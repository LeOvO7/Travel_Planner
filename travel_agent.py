import os
import json
import requests
import time
from typing import TypedDict, Annotated, Sequence, Literal
from datetime import datetime

from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.graph.message import add_messages

# Import mock data for fallback when API quota is exceeded
try:
    from mock_travel_data import get_mock_hotels, get_mock_restaurants, get_mock_attractions, get_mock_flights
    MOCK_DATA_AVAILABLE = True
except ImportError:
    MOCK_DATA_AVAILABLE = False


# ---- Shared RapidAPI helpers ----

def _rapidapi_headers(host: str) -> dict:
    """Return common RapidAPI headers."""
    return {
        "X-RapidAPI-Key": os.environ.get("RAPIDAPI_KEY", ""),
        "X-RapidAPI-Host": host,
        "Content-Type": "application/json",
    }


MAX_RETRIES = 3

def _request_with_retry(url: str, headers: dict, params: dict, timeout: int = 45) -> dict:
    """
    Make a GET request with automatic retry on timeout or API-level timeout errors.
    Returns the parsed JSON response dict, or an empty dict on total failure.
    """
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            res = requests.get(url, headers=headers, params=params, timeout=timeout)
            data = res.json()
            # Some RapidAPIs return {"status": false, "errors": "Connection timeout ..."}
            if (isinstance(data, dict)
                    and data.get("status") is False
                    and "timeout" in str(data.get("errors", "")).lower()):
                last_error = data.get("errors", "API internal timeout")
                if attempt < MAX_RETRIES:
                    time.sleep(2)
                    continue
            return data
        except requests.exceptions.Timeout:
            last_error = f"Request timed out ({timeout}s)"
            if attempt < MAX_RETRIES:
                time.sleep(2)
                continue
        except Exception as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                time.sleep(1)
                continue
    # All retries exhausted – return a recognisable error dict
    return {"_error": last_error or "Unknown error after retries"}


def _check_error(data: dict) -> str | None:
    """If _request_with_retry returned an error dict, extract the message."""
    if isinstance(data, dict) and "_error" in data:
        return data["_error"]
    return None


def _geocode_place(name: str, city: str) -> tuple:
    """Try to geocode a place name using OpenWeather geocoding API.
    Returns (lat, lon) or (None, None) on failure."""
    api_key = os.environ.get("OPENWEATHER_API_KEY")
    if not api_key:
        return None, None
    try:
        res = requests.get(
            "http://api.openweathermap.org/geo/1.0/direct",
            params={"q": f"{name}, {city}", "limit": 1, "appid": api_key},
            timeout=5,
        )
        data = res.json()
        if data:
            return data[0].get("lat"), data[0].get("lon")
    except Exception:
        pass
    return None, None


def _append_structured(text_report: str, data_type: str, items: list) -> str:
    """Append a structured-data marker to the tool's text return.
    The backend SSE handler will strip this out and send it separately."""
    payload = {"type": data_type, "items": items}
    marker = f"\n<!--STRUCTURED_DATA:{json.dumps(payload, default=str)}-->"
    return text_report + marker


# ---- Weather ----

@tool
def get_weather_forecast(city: str) -> str:
    """
    Retrieves detailed weather forecast for a specific city.

    This tool performs two steps:
    1. Geocoding: Converts city name to latitude/longitude.
    2. One Call API 3.0: Fetches current weather and daily summaries.

    Args:
        city: The name of the city (e.g., "Shanghai", "London", "Tokyo").
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY")

    if not api_key:
        return "Error: OPENWEATHER_API_KEY not found in environment variables."

    # city -> lat/lon
    geo_url = "http://api.openweathermap.org/geo/1.0/direct"
    try:
        geo_res = requests.get(geo_url, params={"q": city, "limit": 1, "appid": api_key})
        geo_data = geo_res.json()

        if not geo_data:
            return f"Error: Could not find city '{city}'. Please check the spelling."

        lat = geo_data[0]["lat"]
        lon = geo_data[0]["lon"]
        found_name = geo_data[0]["name"]
        country = geo_data[0]["country"]

    except Exception as e:
        return f"Geocoding service connection failed: {str(e)}"

    # openwheather
    onecall_url = "https://api.openweathermap.org/data/3.0/onecall"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "lang": "en",
        "exclude": "minutely,hourly,alerts"
    }

    try:
        weather_res = requests.get(onecall_url, params=params)

        if weather_res.status_code == 401:
            return "API Error: 401 Unauthorized. Please verify your 'One Call by Call' subscription is active on OpenWeatherMap."

        weather_res.raise_for_status()
        data = weather_res.json()

        report = []
        report.append(f"【Weather Report for {found_name}, {country}】")

        # 1. Current Weather
        current = data.get("current", {})
        temp = current.get("temp", "N/A")
        desc = current.get("weather", [{}])[0].get("description", "Unknown")
        report.append(f"Current Conditions: {desc}, Temperature: {temp}°C")

        # 2. Forecast (One Call API 3.0 returns up to 8 days)
        daily_list = data.get("daily", [])
        report.append(f"\nDaily forecast ({len(daily_list)} days):")

        daily_structured = []
        for day in daily_list:
            dt = datetime.fromtimestamp(day["dt"]).strftime("%Y-%m-%d")
            min_temp = day["temp"]["min"]
            max_temp = day["temp"]["max"]
            summary = day.get("summary", day["weather"][0]["description"])
            report.append(f"- {dt}: {summary} (Temp: {min_temp}°C ~ {max_temp}°C)")
            daily_structured.append({
                "date": dt,
                "minTemp": min_temp,
                "maxTemp": max_temp,
                "summary": summary,
                "icon": day["weather"][0].get("icon", ""),
            })

        structured_items = [{
            "cityName": found_name,
            "country": country,
            "latitude": lat,
            "longitude": lon,
            "current": {"temp": temp, "description": desc},
            "daily": daily_structured,
        }]
        return _append_structured("\n".join(report), "weather", structured_items)

    except Exception as e:
        return f"Failed to retrieve weather data: {str(e)}"


# ---- RapidAPI Tools (Hotels / Flights / Restaurants / Attractions) ----

@tool
def search_hotels(city: str, checkin_date: str, checkout_date: str) -> str:
    """
    Search for available hotels in a city with pricing and rating info.

    Args:
        city: City name (e.g., "Tokyo", "Paris", "Shanghai").
        checkin_date: Check-in date in YYYY-MM-DD format.
        checkout_date: Check-out date in YYYY-MM-DD format.
    """
    api_key = os.environ.get("RAPIDAPI_KEY")
    if not api_key:
        return "Error: RAPIDAPI_KEY not found in environment variables."

    host = "booking-com15.p.rapidapi.com"
    headers = _rapidapi_headers(host)

    # Step 1 – resolve destination id
    dest_data = _request_with_retry(
        f"https://{host}/api/v1/hotels/searchDestination",
        headers=headers,
        params={"query": city},
        timeout=30,
    )
    err = _check_error(dest_data)
    if err:
        # Fallback to mock data if API fails and mock data is available
        if MOCK_DATA_AVAILABLE and "quota" in err.lower():
            mock_hotels = get_mock_hotels(city)
            if mock_hotels:
                report = [f"【Hotel Search Results – {city} ({checkin_date} to {checkout_date})】"]
                report.append("⚠️ Using sample data (API quota exceeded)\n")

                for h in mock_hotels:
                    name = h.get("name", "Unknown")
                    price = h.get("price")
                    currency = h.get("currency", "USD")
                    review_score = h.get("reviewScore")
                    review_word = h.get("reviewScoreWord", "")

                    report.append(f"- **{name}**")
                    if price:
                        report.append(f"  Price: {currency} {price}/night")
                    if review_score:
                        report.append(f"  Rating: {review_score}/10 ({review_word})")
                    report.append("")

                return _append_structured("\n".join(report), "hotels", mock_hotels)

        return f"Destination search failed: {err}"

    items = dest_data.get("data", [])
    if not items:
        # Fallback to mock data if no destination found
        if MOCK_DATA_AVAILABLE:
            mock_hotels = get_mock_hotels(city)
            if mock_hotels:
                report = [f"【Hotel Search Results – {city} ({checkin_date} to {checkout_date})】"]
                report.append("⚠️ Using sample data (API data unavailable)\n")

                for h in mock_hotels:
                    name = h.get("name", "Unknown")
                    price = h.get("price")
                    currency = h.get("currency", "USD")
                    review_score = h.get("reviewScore")
                    review_word = h.get("reviewScoreWord", "")

                    report.append(f"- **{name}**")
                    if price:
                        report.append(f"  Price: {currency} {price}/night")
                    if review_score:
                        report.append(f"  Rating: {review_score}/10 ({review_word})")
                    report.append("")

                return _append_structured("\n".join(report), "hotels", mock_hotels)

        return f"Could not find destination '{city}' on Booking.com."
    dest_id = items[0].get("dest_id")
    search_type = items[0].get("search_type", "city")

    # Step 2 – search hotels
    hotel_data = _request_with_retry(
        f"https://{host}/api/v1/hotels/searchHotels",
        headers=headers,
        params={
            "dest_id": dest_id,
            "search_type": search_type,
            "arrival_date": checkin_date,
            "departure_date": checkout_date,
            "adults": "1",
            "room_qty": "1",
            "page_number": "1",
            "units": "metric",
            "languagecode": "en-us",
            "currency_code": "USD",
        },
        timeout=45,
    )
    err = _check_error(hotel_data)
    if err:
        return f"Hotel search failed: {err}"

    hotels = hotel_data.get("data", {}).get("hotels", [])[:6]

    if not hotels:
        return f"No available hotels found in {city} for {checkin_date} ~ {checkout_date}."

    report = [f"【Hotel Search Results – {city} ({checkin_date} to {checkout_date})】\n"]
    structured_items = []
    for h in hotels:
        prop = h.get("property", {})
        name = prop.get("name", "Unknown")
        score = prop.get("reviewScore", "N/A")
        score_word = prop.get("reviewScoreWord", "")
        review_count = prop.get("reviewCount", 0)
        price_info = prop.get("priceBreakdown", {})
        gross = price_info.get("grossPrice", {})
        price = gross.get("value", "N/A")
        currency = gross.get("currency", "USD")

        report.append(f"- **{name}**")
        report.append(f"  Rating: {score}/10 {score_word} ({review_count} reviews)")
        if price != "N/A":
            report.append(f"  Price: {currency} {price:.0f}")
        report.append("")

        structured_items.append({
            "name": name,
            "reviewScore": score,
            "reviewScoreWord": score_word,
            "reviewCount": review_count,
            "price": price if price != "N/A" else None,
            "currency": currency,
            "photoUrl": prop.get("photoUrls", [None])[0],
            "checkinDate": checkin_date,
            "checkoutDate": checkout_date,
            "city": city,
            "latitude": prop.get("latitude"),
            "longitude": prop.get("longitude"),
        })
    return _append_structured("\n".join(report), "hotels", structured_items)


@tool
def search_flights(departure_id: str, arrival_id: str, departure_date: str) -> str:
    """
    Search for available flights via Google Flights.

    Args:
        departure_id: IATA airport code for departure (e.g., "CHO" for Charlottesville,
                      "LAX" for Los Angeles, "JFK" for New York JFK, "PEK" for Beijing).
        arrival_id: IATA airport code for arrival (e.g., "JFK", "NRT", "LHR").
        departure_date: Date in YYYY-MM-DD format.
    """
    api_key = os.environ.get("RAPIDAPI_KEY")
    if not api_key:
        return "Error: RAPIDAPI_KEY not found in environment variables."

    host = "google-flights2.p.rapidapi.com"
    headers = _rapidapi_headers(host)

    flight_data = _request_with_retry(
        f"https://{host}/api/v1/searchFlights",
        headers=headers,
        params={
            "departure_id": departure_id,
            "arrival_id": arrival_id,
            "outbound_date": departure_date,
            "travel_class": "ECONOMY",
            "adults": "1",
            "show_hidden": "1",
            "currency": "USD",
            "language_code": "en-US",
            "country_code": "US",
            "search_type": "best",
        },
        timeout=60,
    )
    err = _check_error(flight_data)
    if err:
        # Fallback to mock data if API fails and mock data is available
        if MOCK_DATA_AVAILABLE and "quota" in err.lower():
            # Try to infer city from arrival airport code
            city_map = {
                "JFK": "New York", "LGA": "New York", "EWR": "New York",
                "NRT": "Tokyo", "HND": "Tokyo",
                "LAX": "Los Angeles", "SFO": "San Francisco",
                "ORD": "Chicago", "LHR": "London"
            }
            city = city_map.get(arrival_id, "New York")

            mock_flights = get_mock_flights(city)
            if mock_flights:
                report = [f"【Flights: {departure_id} → {arrival_id} on {departure_date}】"]
                report.append("⚠️ Using sample data (API quota exceeded)\n")

                for fl in mock_flights:
                    airline = fl.get("airline", "Unknown")
                    flight_num = fl.get("flightNumber", "")
                    dep_time = fl.get("departureTime", "")
                    arr_time = fl.get("arrivalTime", "")
                    duration = fl.get("duration", "")
                    price = fl.get("price")
                    stops = fl.get("stops", 0)

                    report.append(f"- **{airline}** ({flight_num})")
                    report.append(f"  {dep_time} → {arr_time}")
                    stop_str = "direct" if stops == 0 else f"{stops} stop(s)"
                    if duration:
                        report.append(f"  Duration: {duration} ({stop_str})")
                    if price:
                        report.append(f"  Price: USD {price}")

                    layovers = fl.get("layovers", [])
                    for lo in layovers:
                        report.append(f"  Layover: {lo.get('name', '')} ({lo.get('duration', '')})")
                    report.append("")

                return _append_structured("\n".join(report), "flights", mock_flights)

        return f"Flight search failed: {err}"

    # Parse response: data.itineraries.topFlights[]
    itineraries = flight_data.get("data", {}).get("itineraries", {})
    top_flights = itineraries.get("topFlights", [])
    other_flights = itineraries.get("otherFlights", [])
    all_flights = (top_flights + other_flights)[:6]

    if not all_flights:
        return f"No flights found from {departure_id} to {arrival_id} on {departure_date}."

    report = [f"【Flights: {departure_id} → {arrival_id} on {departure_date}】\n"]
    structured_items = []
    for fl in all_flights:
        price = fl.get("price", "N/A")
        stops = fl.get("stops", 0)
        dur_text = fl.get("duration", {}).get("text", "")
        dep_time = fl.get("departure_time", "")
        arr_time = fl.get("arrival_time", "")

        # Get airline from first flight segment
        segments = fl.get("flights", [])
        airline = segments[0].get("airline", "Unknown") if segments else "Unknown"
        flight_num = segments[0].get("flight_number", "") if segments else ""

        report.append(f"- **{airline}** ({flight_num})")
        report.append(f"  {dep_time} → {arr_time}")
        stop_str = "direct" if stops == 0 else f"{stops} stop(s)"
        if dur_text:
            report.append(f"  Duration: {dur_text} ({stop_str})")
        if price != "N/A":
            report.append(f"  Price: USD {price}")

        # Layover info
        layover_list = []
        layovers = fl.get("layovers")
        if layovers and isinstance(layovers, list):
            for lo in layovers:
                lo_name = lo.get("name", "")
                raw_dur = lo.get("duration", "")
                lo_dur = raw_dur.get("text", "") if isinstance(raw_dur, dict) else str(raw_dur) if raw_dur else ""
                if lo_name:
                    report.append(f"  Layover: {lo_name} ({lo_dur})")
                    layover_list.append({"name": lo_name, "duration": lo_dur})
        report.append("")

        structured_items.append({
            "airline": airline,
            "flightNumber": flight_num,
            "departureTime": dep_time,
            "arrivalTime": arr_time,
            "duration": dur_text,
            "price": price if price != "N/A" else None,
            "stops": stops,
            "layovers": layover_list,
            "departureId": departure_id,
            "arrivalId": arrival_id,
            "date": departure_date,
        })
    return _append_structured("\n".join(report), "flights", structured_items)


@tool
def search_restaurants(city: str, cuisine: str = "") -> str:
    """
    Search for popular restaurants and dining options in a city.

    Args:
        city: City name (e.g., "Tokyo", "Paris").
        cuisine: Optional cuisine type filter (e.g., "Japanese", "Italian"). Leave empty for all.
    """
    api_key = os.environ.get("RAPIDAPI_KEY")
    if not api_key:
        return "Error: RAPIDAPI_KEY not found in environment variables."

    host = "tripadvisor16.p.rapidapi.com"
    headers = _rapidapi_headers(host)

    # Step 1 – resolve location id
    loc_data = _request_with_retry(
        f"https://{host}/api/v1/restaurant/searchLocation",
        headers=headers,
        params={"query": city},
        timeout=30,
    )
    err = _check_error(loc_data)
    if err:
        # Fallback to mock data if API fails and mock data is available
        if MOCK_DATA_AVAILABLE and "quota" in err.lower():
            mock_restaurants = get_mock_restaurants(city)
            if mock_restaurants:
                report = [f"【Restaurant Recommendations – {city}】"]
                report.append("⚠️ Using sample data (API quota exceeded)\n")

                for r in mock_restaurants:
                    name = r.get("name", "Unknown")
                    rating = r.get("averageRating")
                    price_tag = r.get("priceTag", "")
                    cuisines = r.get("cuisineTags", [])

                    report.append(f"- **{name}**")
                    if rating:
                        report.append(f"  Rating: {rating}/5")
                    if price_tag:
                        report.append(f"  Price: {price_tag}")
                    if cuisines:
                        report.append(f"  Cuisine: {', '.join(cuisines)}")
                    report.append("")

                return _append_structured("\n".join(report), "restaurants", mock_restaurants)

        return f"Restaurant location search failed: {err}"

    locations = loc_data.get("data", [])
    if not locations:
        return f"Could not find location '{city}' on TripAdvisor."
    location_id = locations[0].get("locationId")

    # Step 2 – search restaurants
    rest_data = _request_with_retry(
        f"https://{host}/api/v1/restaurant/searchRestaurants",
        headers=headers,
        params={
            "locationId": location_id,
            **({"q": cuisine} if cuisine else {}),
        },
        timeout=45,
    )
    err = _check_error(rest_data)
    if err:
        # Fallback to mock data if API fails
        if MOCK_DATA_AVAILABLE and "quota" in err.lower():
            mock_restaurants = get_mock_restaurants(city)
            if mock_restaurants:
                report = [f"【Restaurant Recommendations – {city}】"]
                report.append("⚠️ Using sample data (API quota exceeded)\n")

                for r in mock_restaurants:
                    name = r.get("name", "Unknown")
                    rating = r.get("averageRating")
                    price_tag = r.get("priceTag", "")
                    cuisines = r.get("cuisineTags", [])

                    report.append(f"- **{name}**")
                    if rating:
                        report.append(f"  Rating: {rating}/5")
                    if price_tag:
                        report.append(f"  Price: {price_tag}")
                    if cuisines:
                        report.append(f"  Cuisine: {', '.join(cuisines)}")
                    report.append("")

                return _append_structured("\n".join(report), "restaurants", mock_restaurants)

        return f"Restaurant search failed: {err}"

    restaurants = rest_data.get("data", {}).get("data", [])[:8]

    if not restaurants:
        return f"No restaurant data found for {city}."

    report = [f"【Restaurant Recommendations – {city}】\n"]
    structured_items = []
    for r in restaurants:
        name = r.get("name", "Unknown")
        rating = r.get("averageRating", "N/A")
        reviews = r.get("userReviewCount", 0)
        price_tag = r.get("priceTag", "")
        # Tags are plain strings, e.g. ["French", "American", "Steakhouse"]
        cuisines = r.get("establishmentTypeAndCuisineTags", [])
        address = r.get("addressObj", {}).get("street1", "") if isinstance(r.get("addressObj"), dict) else ""

        report.append(f"- **{name}**")
        if cuisines:
            report.append(f"  Cuisine: {', '.join(cuisines[:3])}")
        report.append(f"  Rating: {rating}/5 ({reviews} reviews)")
        if price_tag:
            report.append(f"  Price level: {price_tag}")
        if address:
            report.append(f"  Address: {address}")
        report.append("")

        structured_items.append({
            "name": name,
            "averageRating": rating,
            "userReviewCount": reviews,
            "priceTag": price_tag,
            "cuisineTags": cuisines[:3] if cuisines else [],
            "address": address,
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "city": city,
        })
    return _append_structured("\n".join(report), "restaurants", structured_items)


@tool
def search_attractions(city: str) -> str:
    """
    Search for popular tourist attractions and things to do in a city.

    Args:
        city: City name (e.g., "Tokyo", "Paris").
    """
    api_key = os.environ.get("RAPIDAPI_KEY")
    if not api_key:
        return "Error: RAPIDAPI_KEY not found in environment variables."

    host = "booking-com15.p.rapidapi.com"
    headers = _rapidapi_headers(host)

    # Step 1 – resolve attraction location → get city ufi
    loc_data = _request_with_retry(
        f"https://{host}/api/v1/attraction/searchLocation",
        headers=headers,
        params={"query": city, "languagecode": "en-us"},
        timeout=30,
    )
    err = _check_error(loc_data)
    if err:
        # Fallback to mock data if API fails and mock data is available
        if MOCK_DATA_AVAILABLE and "quota" in err.lower():
            mock_attractions = get_mock_attractions(city)
            if mock_attractions:
                report = [f"【Popular Attractions – {city}】"]
                report.append("⚠️ Using sample data (API quota exceeded)\n")

                for a in mock_attractions:
                    name = a.get("name", "Unknown")
                    desc = a.get("shortDescription", "")
                    rating = a.get("rating")
                    price = a.get("price")

                    report.append(f"- **{name}**")
                    if desc:
                        report.append(f"  {desc}")
                    if rating:
                        report.append(f"  Rating: {rating}/5")
                    if price is not None:
                        if price == 0:
                            report.append(f"  Free admission")
                        else:
                            report.append(f"  Price: USD {price}")
                    report.append("")

                return _append_structured("\n".join(report), "attractions", mock_attractions)

        return f"Attraction location search failed: {err}"

    products = loc_data.get("data", {}).get("products", [])
    if not products:
        return f"Could not find attraction location for '{city}'."
    # Use the first product's id (contains encoded ufi for the city)
    location_id = products[0].get("id", "")
    if not location_id:
        return f"Could not resolve attraction location id for '{city}'."

    # Step 2 – search attractions
    attr_data = _request_with_retry(
        f"https://{host}/api/v1/attraction/searchAttractions",
        headers=headers,
        params={
            "id": location_id,
            "sortBy": "trending",
            "page": "1",
            "currency_code": "USD",
            "languagecode": "en-us",
        },
        timeout=45,
    )
    err = _check_error(attr_data)
    if err:
        # Fallback to mock data if API fails
        if MOCK_DATA_AVAILABLE and "quota" in err.lower():
            mock_attractions = get_mock_attractions(city)
            if mock_attractions:
                report = [f"【Popular Attractions – {city}】"]
                report.append("⚠️ Using sample data (API quota exceeded)\n")

                for a in mock_attractions:
                    name = a.get("name", "Unknown")
                    desc = a.get("shortDescription", "")
                    rating = a.get("rating")
                    price = a.get("price")

                    report.append(f"- **{name}**")
                    if desc:
                        report.append(f"  {desc}")
                    if rating:
                        report.append(f"  Rating: {rating}/5")
                    if price is not None:
                        if price == 0:
                            report.append(f"  Free admission")
                        else:
                            report.append(f"  Price: USD {price}")
                    report.append("")

                return _append_structured("\n".join(report), "attractions", mock_attractions)

        return f"Attraction search failed: {err}"

    products = attr_data.get("data", {}).get("products", [])[:8]

    if not products:
        return f"No attraction data found for {city}."

    report = [f"【Popular Attractions – {city}】\n"]
    structured_items = []
    for a in products:
        name = a.get("name", "Unknown")
        short_desc = a.get("shortDescription", "")
        price_info = a.get("representativePrice", {})
        price = price_info.get("publicAmount", "")
        currency = price_info.get("currency", "USD")
        reviews_stats = a.get("reviewsStats", {})
        combined = reviews_stats.get("combinedNumericStats", {})
        rating = combined.get("average", "")
        reviews = combined.get("total", 0)

        report.append(f"- **{name}**")
        if short_desc:
            report.append(f"  {short_desc[:120]}")
        if rating:
            report.append(f"  Rating: {rating}/5 ({reviews} reviews)")
        if price:
            report.append(f"  From: {currency} {price}")
        report.append("")

        # Try to get coordinates from API data, fall back to geocoding
        a_lat = a.get("latitude") or a.get("ufiDetails", {}).get("latitude")
        a_lon = a.get("longitude") or a.get("ufiDetails", {}).get("longitude")
        if not a_lat or not a_lon:
            a_lat, a_lon = _geocode_place(name, city)

        structured_items.append({
            "name": name,
            "shortDescription": short_desc,
            "price": price if price else None,
            "currency": currency,
            "rating": rating if rating else None,
            "reviewCount": reviews,
            "photoUrl": (a.get("primaryPhoto", {}) or {}).get("small"),
            "city": city,
            "latitude": a_lat,
            "longitude": a_lon,
        })
    return _append_structured("\n".join(report), "attractions", structured_items)


SYSTEM_PROMPT = (
    "You are an experienced travel consultant who specializes in weather-adaptive trip planning. "
    "You have access to real-time data tools: weather forecasts, hotel/flight/attraction search (Booking.com), "
    "and restaurant search (TripAdvisor).\n"
    "You always provide specific, actionable, and localized advice — not generic tourism content.\n"
    "When recommending, you must:\n"
    "- Use the available tools to gather REAL data before making recommendations.\n"
    "- Tie every recommendation explicitly to the weather data (cite temperature/condition).\n"
    "- Cite real hotel names and prices from search results — never fabricate prices.\n"
    "- Cite real restaurant names, ratings, and addresses from search results.\n"
    "- Arrange sightseeing spots in a geographically logical order to minimize transit time between locations.\n"
    "- Recommend accommodations in areas that are convenient for the next day's itinerary.\n"
    "- Consider the traveler's comfort across varying daytime and nighttime temperatures.\n"
    "- If any tool call fails, still provide the best advice you can with available data and your knowledge.\n"
    "- Format the output clearly with markdown headers and bullet points."
)

# Register tools
tools = [
    get_weather_forecast,
    search_hotels,
    search_flights,
    search_restaurants,
    search_attractions,
]

# ----------------------------------

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

# Initialize
model = ChatOpenAI(model="gpt-4o", temperature=0.7)
model_with_tools = model.bind_tools(tools)

def call_model(state: AgentState):
    return {"messages": [model_with_tools.invoke(state["messages"])]}

def should_continue(state: AgentState) -> Literal["tools", "end"]:
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return "end"

workflow = StateGraph(AgentState)

workflow.add_node("agent", call_model)
workflow.add_node("tools", ToolNode(tools))

workflow.set_entry_point("agent")

workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        "end": END,
    },
)

workflow.add_edge("tools", "agent")
app = workflow.compile()

# ---------------------------------

def run_agent():
    print("="*60)
    print("Smart Travel Planner")
    print("="*60)

    # Check keys silently
    if not os.environ.get("OPENWEATHER_API_KEY"):
        print("Error: OPENWEATHER_API_KEY environment variable is missing.")
        return
    if not os.environ.get("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is missing.")
        return

    dest = input("Enter Destination : ")
    date = input("Enter Travel Dates : ")

    initial_prompt = (
        f"I am traveling to {dest} on {date}.\n\n"
        "Please gather real-time data using the available tools, then produce a complete travel guide.\n\n"
        "**Data gathering** (use tools in parallel where possible):\n"
        "1. Use `get_weather_forecast` to get the weather forecast for the destination.\n"
        "2. Use `search_hotels` to find available hotels with real prices.\n"
        "3. Use `search_restaurants` to find top-rated dining options.\n"
        "4. Use `search_attractions` to find popular things to do.\n"
        "5. If a departure city is obvious from context, use `search_flights` to find flights.\n\n"
        "**Output structure** — base ALL recommendations on the real data returned:\n\n"
        "## Daily Itinerary\n"
        f"You MUST provide a full-day plan for EVERY day of the trip ({date}). "
        "Do NOT skip any day. If weather forecast data is not available for some days, "
        "extrapolate from the closest available forecast and note it.\n"
        "For EACH day, provide:\n"
        "- **Weather Summary**: Quote the key data (high/low temp, condition).\n"
        "- **Sightseeing Route**: List 3-4 specific attractions from search results in a geographically logical order. "
        "For each spot, note why it suits the day's weather and how to get to the next one.\n"
        "- **Meals**: Recommend specific restaurants from search results near the day's route for lunch and dinner. "
        "Include ratings and price level.\n"
        "- **Outfit Plan**: What to wear for the day based on the temperature range and conditions.\n"
        "- **Accommodation**: Recommend a specific hotel from search results, including price and rating. "
        "Prefer hotels in areas convenient for the next day's itinerary.\n\n"
        "## Flights & Transportation\n"
        "- If flight data was retrieved, list the best options with price and duration.\n"
        "- How to get from the airport/station to the city center.\n"
        "- Recommended transit method for sightseeing (metro, bus, taxi, walking) based on weather and distances.\n"
        "- Any travel passes or apps that are useful.\n\n"
        "## Hotel Recommendations\n"
        "- Summarize the top 3 hotel picks from search results with prices, ratings, and area.\n\n"
        "## Packing Checklist\n"
        "A consolidated, categorized list:\n"
        "- Weather protection (rain/sun/wind gear)\n"
        "- Clothing essentials (with quantities based on trip length)\n"
        "- Health & comfort (sunscreen SPF level, hydration advice, etc.)\n\n"
        "## Practical Tips\n"
        "- Local food/drink specialties worth trying given the weather.\n"
        "- Any weather-related safety warnings or cultural tips.\n\n"
        "Format the output clearly with markdown headers and bullet points."
    )

    print(f"\n Agent is thinking and querying the API...\n")

    inputs = {"messages": [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=initial_prompt)]}

    try:
        for event in app.stream(inputs, stream_mode="values"):
            message = event["messages"][-1]

            if isinstance(message, AIMessage) and message.tool_calls:
                print(f"  Agent is calling tool: {message.tool_calls[0]['name']}")

            elif isinstance(message, AIMessage) and message.content:
                print("\n" + "="*60)
                print(" Travel Guide")
                print("="*60)
                print(message.content)
    except Exception as e:
        print(f"\n An error occurred: {e}")

if __name__ == "__main__":
    run_agent()

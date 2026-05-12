/**
 * Mock travel data for testing when APIs are unavailable
 * Contains real coordinates for New York City locations
 */

export const MOCK_CITIES = {
  'New York': {
    weather: {
      cityName: 'New York',
      latitude: 40.7127281,
      longitude: -74.0060152,
      temperature: 72,
      description: 'Partly cloudy',
      humidity: 65,
      windSpeed: 12
    },
    flights: [
      {
        airline: 'United Airlines',
        flightNumber: 'UA 1234',
        departureTime: '08:00 AM',
        arrivalTime: '11:30 AM',
        duration: '3h 30m',
        price: 245,
        stops: 0,
        layovers: [],
        departureId: 'LAX',
        arrivalId: 'JFK',
        date: '2026-06-15'
      },
      {
        airline: 'Delta',
        flightNumber: 'DL 567',
        departureTime: '10:15 AM',
        arrivalTime: '02:00 PM',
        duration: '3h 45m',
        price: 289,
        stops: 0,
        layovers: [],
        departureId: 'LAX',
        arrivalId: 'JFK',
        date: '2026-06-15'
      },
      {
        airline: 'American Airlines',
        flightNumber: 'AA 890',
        departureTime: '02:30 PM',
        arrivalTime: '10:45 PM',
        duration: '8h 15m',
        price: 198,
        stops: 1,
        layovers: [
          {
            name: "Chicago O'Hare (ORD)",
            duration: '2h 30m'
          }
        ],
        departureId: 'LAX',
        arrivalId: 'JFK',
        date: '2026-06-15'
      },
      {
        airline: 'JetBlue',
        flightNumber: 'B6 123',
        departureTime: '06:00 AM',
        arrivalTime: '09:20 AM',
        duration: '3h 20m',
        price: 225,
        stops: 0,
        layovers: [],
        departureId: 'LAX',
        arrivalId: 'JFK',
        date: '2026-06-15'
      }
    ],
    hotels: [
      {
        name: 'The Plaza Hotel',
        city: 'New York',
        latitude: 40.7648,
        longitude: -73.9747,
        price: 450,
        currency: 'USD',
        reviewScore: 8.9,
        reviewScoreWord: 'Excellent',
        reviewCount: 2543,
        photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
      },
      {
        name: 'The Standard High Line',
        city: 'New York',
        latitude: 40.7410,
        longitude: -74.0076,
        price: 325,
        currency: 'USD',
        reviewScore: 8.5,
        reviewScoreWord: 'Very Good',
        reviewCount: 1876,
        photoUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
      },
      {
        name: '1 Hotel Brooklyn Bridge',
        city: 'New York',
        latitude: 40.7033,
        longitude: -73.9903,
        price: 385,
        currency: 'USD',
        reviewScore: 9.1,
        reviewScoreWord: 'Superb',
        reviewCount: 987,
        photoUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'
      }
    ],
    restaurants: [
      {
        name: 'Le Bernardin',
        city: 'New York',
        latitude: 40.7614,
        longitude: -73.9776,
        averageRating: '4.8',
        userReviewCount: 3456,
        priceTag: '$$$',
        cuisineTags: ['French', 'Seafood'],
        address: '155 W 51st St, New York, NY 10019'
      },
      {
        name: "Joe's Pizza",
        city: 'New York',
        latitude: 40.7300,
        longitude: -74.0020,
        averageRating: '4.5',
        userReviewCount: 8765,
        priceTag: '$',
        cuisineTags: ['Pizza', 'Italian'],
        address: '7 Carmine St, New York, NY 10014'
      },
      {
        name: "Katz's Delicatessen",
        city: 'New York',
        latitude: 40.7223,
        longitude: -73.9872,
        averageRating: '4.6',
        userReviewCount: 12543,
        priceTag: '$$',
        cuisineTags: ['Deli', 'American'],
        address: '205 E Houston St, New York, NY 10002'
      },
      {
        name: 'Eleven Madison Park',
        city: 'New York',
        latitude: 40.7425,
        longitude: -73.9868,
        averageRating: '4.9',
        userReviewCount: 2134,
        priceTag: '$$$$',
        cuisineTags: ['Contemporary', 'Fine Dining'],
        address: '11 Madison Ave, New York, NY 10010'
      }
    ],
    attractions: [
      {
        name: 'Statue of Liberty',
        city: 'New York',
        latitude: 40.6892,
        longitude: -74.0445,
        rating: '4.8',
        reviewCount: 45678,
        price: 24,
        currency: 'USD',
        shortDescription: 'Iconic monument and symbol of freedom',
        photoUrl: 'https://images.unsplash.com/photo-1569098644584-210bcd375b59'
      },
      {
        name: 'Central Park',
        city: 'New York',
        latitude: 40.7829,
        longitude: -73.9654,
        rating: '4.9',
        reviewCount: 67890,
        price: 0,
        currency: 'USD',
        shortDescription: 'Iconic urban park in Manhattan',
        photoUrl: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90'
      },
      {
        name: 'Empire State Building',
        city: 'New York',
        latitude: 40.7484,
        longitude: -73.9857,
        rating: '4.7',
        reviewCount: 34567,
        price: 44,
        currency: 'USD',
        shortDescription: 'Art Deco skyscraper with observation decks',
        photoUrl: 'https://images.unsplash.com/photo-1546436836-07a91091f160'
      },
      {
        name: 'Brooklyn Bridge',
        city: 'New York',
        latitude: 40.7061,
        longitude: -73.9969,
        rating: '4.8',
        reviewCount: 23456,
        price: 0,
        currency: 'USD',
        shortDescription: 'Historic suspension bridge connecting Manhattan and Brooklyn',
        photoUrl: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634'
      },
      {
        name: 'Times Square',
        city: 'New York',
        latitude: 40.7580,
        longitude: -73.9855,
        rating: '4.5',
        reviewCount: 56789,
        price: 0,
        currency: 'USD',
        shortDescription: 'Bustling commercial intersection and entertainment center',
        photoUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390'
      }
    ]
  },
  'Tokyo': {
    weather: {
      cityName: 'Tokyo',
      latitude: 35.6762,
      longitude: 139.6503,
      temperature: 68,
      description: 'Clear sky',
      humidity: 70,
      windSpeed: 8
    },
    flights: [
      {
        airline: 'All Nippon Airways',
        flightNumber: 'NH 9',
        departureTime: '11:00 AM',
        arrivalTime: '03:00 PM+1',
        duration: '11h 0m',
        price: 1245,
        stops: 0,
        layovers: [],
        departureId: 'LAX',
        arrivalId: 'NRT',
        date: '2026-06-15'
      },
      {
        airline: 'Japan Airlines',
        flightNumber: 'JL 62',
        departureTime: '01:30 PM',
        arrivalTime: '05:30 PM+1',
        duration: '11h 0m',
        price: 1289,
        stops: 0,
        layovers: [],
        departureId: 'LAX',
        arrivalId: 'NRT',
        date: '2026-06-15'
      },
      {
        airline: 'United Airlines',
        flightNumber: 'UA 32',
        departureTime: '09:45 AM',
        arrivalTime: '02:15 PM+1',
        duration: '11h 30m',
        price: 1198,
        stops: 0,
        layovers: [],
        departureId: 'LAX',
        arrivalId: 'NRT',
        date: '2026-06-15'
      }
    ],
    hotels: [
      {
        name: 'Park Hyatt Tokyo',
        city: 'Tokyo',
        latitude: 35.6850,
        longitude: 139.6918,
        price: 520,
        currency: 'USD',
        reviewScore: 9.2,
        reviewScoreWord: 'Superb',
        reviewCount: 1234,
        photoUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'
      },
      {
        name: 'The Peninsula Tokyo',
        city: 'Tokyo',
        latitude: 35.6762,
        longitude: 139.7638,
        price: 610,
        currency: 'USD',
        reviewScore: 9.4,
        reviewScoreWord: 'Exceptional',
        reviewCount: 876,
        photoUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a'
      }
    ],
    restaurants: [
      {
        name: 'Sukiyabashi Jiro',
        city: 'Tokyo',
        latitude: 35.6680,
        longitude: 139.7630,
        averageRating: '4.9',
        userReviewCount: 876,
        priceTag: '$$$$',
        cuisineTags: ['Sushi', 'Japanese'],
        address: 'Tsukamoto Sogyo Building, 2-15 Ginza 4-chome'
      },
      {
        name: 'Ichiran Ramen',
        city: 'Tokyo',
        latitude: 35.6938,
        longitude: 139.7036,
        averageRating: '4.6',
        userReviewCount: 5432,
        priceTag: '$',
        cuisineTags: ['Ramen', 'Japanese'],
        address: '1-22-7 Jinnan, Shibuya'
      }
    ],
    attractions: [
      {
        name: 'Tokyo Skytree',
        city: 'Tokyo',
        latitude: 35.7101,
        longitude: 139.8107,
        rating: '4.7',
        reviewCount: 12345,
        price: 18,
        currency: 'USD',
        shortDescription: 'Broadcasting and observation tower',
        photoUrl: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8'
      },
      {
        name: 'Senso-ji Temple',
        city: 'Tokyo',
        latitude: 35.7148,
        longitude: 139.7967,
        rating: '4.8',
        reviewCount: 23456,
        price: 0,
        currency: 'USD',
        shortDescription: 'Ancient Buddhist temple in Asakusa',
        photoUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186'
      }
    ]
  }
};

/**
 * Generate a mock travel session with realistic data
 * @param {string} city - City name (e.g., 'New York', 'Tokyo')
 * @returns {object} - Complete session object with messages and structured data
 */
export function generateMockSession(city = 'New York') {
  const mockData = MOCK_CITIES[city] || MOCK_CITIES['New York'];

  return {
    id: `mock-${Date.now()}`,
    title: `Trip to ${city}`,
    messages: [
      {
        id: Date.now(),
        type: 'user',
        content: `Plan a trip to ${city}`
      },
      {
        id: Date.now() + 1,
        type: 'assistant',
        content: `Here's your complete travel plan for ${city}! 🎉\n\nI've found ${mockData.flights.length} flight options, ${mockData.hotels.length} hotels, ${mockData.restaurants.length} restaurants, and ${mockData.attractions.length} attractions for you. Check out the map to see all the locations!`,
        structuredData: [
          {
            type: 'weather',
            items: [mockData.weather]
          },
          {
            type: 'flights',
            items: mockData.flights
          },
          {
            type: 'hotels',
            items: mockData.hotels
          },
          {
            type: 'restaurants',
            items: mockData.restaurants
          },
          {
            type: 'attractions',
            items: mockData.attractions
          }
        ]
      }
    ],
    createdAt: Date.now(),
    hasInitialInput: true,
    initialTripData: {
      departure: '',
      destination: city,
      dates: 'Not specified'
    }
  };
}

/**
 * Get summary of mock data for display
 */
export function getMockDataSummary(city = 'New York') {
  const mockData = MOCK_CITIES[city] || MOCK_CITIES['New York'];
  return {
    city,
    flights: mockData.flights.length,
    hotels: mockData.hotels.length,
    restaurants: mockData.restaurants.length,
    attractions: mockData.attractions.length,
    total: mockData.flights.length + mockData.hotels.length + mockData.restaurants.length + mockData.attractions.length
  };
}

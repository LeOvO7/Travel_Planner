# 🗺️ 地图空白问题 - 完整调试指南

## 问题现状
- ✅ 独立测试页面 (`test-map.html`) 可以正常显示地图
- ❌ React 主应用中的 MapView 显示空白

这说明 **Google Maps API Key 有效**，问题出在应用配置或数据上。

---

## 📋 快速诊断步骤

### 步骤 1: 重启开发服务器 ⭐ 最重要！

Vite 只在启动时读取 `.env` 文件。如果你之前修改过 `.env`，必须重启：

```bash
# 停止当前服务器 (Ctrl+C)
cd frontend
npm run dev
```

### 步骤 2: 检查浏览器控制台

1. 打开 React 应用（通常是 `http://localhost:5173`）
2. 按 F12 打开开发者工具
3. 切换到 **Console** 标签
4. 查找以 🗺️ 开头的调试信息

#### 预期看到的输出：

```javascript
🗺️ MapView Debug Info: {
  hasSession: true,
  sessionTitle: "Trip to Tokyo",
  messageCount: 5,
  structuredDataCount: 3,
  structuredDataTypes: ["weather", "hotels", "restaurants"],
  allPlacesCount: 15,
  placesWithCoordsCount: 15,  // ⚠️ 如果是 0，说明没有坐标数据！
  mapCenter: { lat: 35.6762, lng: 139.6503 },
  weather: { city: "Tokyo", lat: 35.6762, lng: 139.6503 },
  apiKeyLoaded: true,
  apiKeyPrefix: "AIzaSyB2Mo8gdkO3-35t...",
  isLoaded: true,
  loadError: null
}
```

### 步骤 3: 根据输出诊断问题

#### 问题 A: `apiKeyLoaded: false` 或 `apiKeyPrefix: undefined`
**原因**: 环境变量未加载

**解决方案**:
1. 确认 `frontend/.env` 文件存在
2. 确认包含: `VITE_GOOGLE_MAPS_API_KEY=AIzaSyB2Mo8gdkO3-35tsmrf_WlBrSkTbUKYp9Q`
3. **重启开发服务器** (Ctrl+C 然后 `npm run dev`)
4. 清除浏览器缓存并硬刷新 (Ctrl+Shift+R)

#### 问题 B: `placesWithCoordsCount: 0`
**原因**: 会话中没有包含坐标的地点数据

**解决方案**:
1. 确保后端 API 正常运行
2. 发起一次新的旅行规划请求
3. 等待 AI 返回完整的酒店/餐厅/景点数据
4. 检查后端是否正确调用了 Booking.com/TripAdvisor API

**测试方法**:
在控制台运行：
```javascript
// 查看当前 session 的原始数据
const session = sessions[0]; // 或当前 session
console.log(session);
```

#### 问题 C: `loadError: "..."` 有错误信息
**原因**: Google Maps API 加载失败

**常见错误**:
- `InvalidKeyMapError`: API Key 无效或限制设置不正确
- `RefererNotAllowedMapError`: API Key 的 HTTP referrer 限制过严
- `ApiNotActivatedMapError`: 未启用必需的 API

**解决方案**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. 确保启用了:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. 检查 API Key 限制设置（建议开发时不要设置 HTTP referrer 限制）

#### 问题 D: `hasSession: false` 或 `messageCount: 0`
**原因**: 没有选中会话或会话为空

**解决方案**:
1. 点击侧边栏的 "New Trip Planning" 创建新会话
2. 发起一次旅行规划请求
3. 等待 AI 返回结果后再打开地图

---

## 🔍 深度调试

### 检查后端数据格式

在 ChatMessage 组件中，查看返回的结构化数据是否包含坐标：

```javascript
// 在浏览器控制台运行
const msg = sessions[0]?.messages.find(m => m.type === 'assistant');
console.log('Structured Data:', msg?.structuredData);

// 预期输出示例:
[
  {
    type: "hotels",
    items: [
      {
        name: "Hotel Name",
        latitude: 35.6762,  // ⚠️ 必须有
        longitude: 139.6503, // ⚠️ 必须有
        city: "Tokyo",
        price: 100,
        ...
      }
    ]
  }
]
```

如果 `latitude` 和 `longitude` 字段缺失，问题在后端 API。

### 查看网络请求

1. 打开 DevTools 的 **Network** 标签
2. 刷新页面
3. 搜索 `maps.googleapis.com`
4. 查看是否有失败的请求（红色）
5. 点击失败的请求查看详细错误信息

---

## 🎯 最常见的 3 个问题及解决方案

### 1. 环境变量未加载 (80% 的情况)
```bash
# 停止服务器
Ctrl+C

# 重新启动
npm run dev
```

### 2. 没有数据 (15% 的情况)
- 确保发起了完整的旅行规划请求
- 等待后端返回酒店、餐厅、景点数据
- 检查后端是否正常运行

### 3. API Key 限制设置 (5% 的情况)
- 去 Google Cloud Console 检查 API Key 限制
- 临时移除所有限制进行测试
- 确保启用了所需的 API

---

## 📞 仍然无法解决？

提供以下信息以便进一步诊断：

1. 浏览器控制台的完整 `🗺️ MapView Debug Info` 输出
2. 浏览器控制台的所有红色错误信息
3. Network 标签中与 Google Maps 相关的失败请求
4. 运行 `npm run dev` 时的终端输出

---

## ✅ 成功标志

当地图正常工作时，你应该看到：

- ✅ `apiKeyLoaded: true`
- ✅ `isLoaded: true`
- ✅ `loadError: null`
- ✅ `placesWithCoordsCount > 0`
- ✅ 浏览器控制台没有红色错误
- ✅ 地图显示标记点
- ✅ 可以点击标记点查看详情

---

**最后提醒**: 90% 的问题可以通过 **重启开发服务器** 解决！ 🎉

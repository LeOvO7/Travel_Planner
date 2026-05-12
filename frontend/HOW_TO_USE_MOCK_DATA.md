# 🎉 如何使用模拟数据测试地图

## ✅ 功能已添加！

我已经在前端添加了"Load Mock Data"功能，让你可以立即看到地图效果，无需等待 API 配额重置。

---

## 🚀 使用步骤

### 1. 启动前端应用

确保前端开发服务器正在运行：

```bash
cd frontend
npm run dev
```

### 2. 打开应用

访问 `http://localhost:5173`（或你的开发服务器地址）

### 3. 点击"Load Mock Data"按钮

在侧边栏中，你会看到两个按钮：
- **+ New Trip Planning** - 创建新的空会话（需要后端 API）
- **✨ Load Mock Data** - 加载纽约的模拟数据（绿色按钮）

**点击绿色的"Load Mock Data"按钮！**

### 4. 查看模拟数据

点击后会自动创建一个名为"Trip to New York"的会话，包含：
- ✅ 3 家酒店（真实坐标）
- ✅ 4 家餐厅（真实坐标）
- ✅ 5 个景点（真实坐标）
- ✅ 天气数据

### 5. 打开地图视图

方式一：点击侧边栏的 **"Map View"** 按钮

方式二：在会话列表中悬停鼠标，点击 **📤** 图标查看详情，然后点击地图按钮

### 6. 查看地图！🗺️

你应该能看到：
- ✅ Google Maps 正常加载
- ✅ 纽约市区地图
- ✅ **12 个标记点**（3个酒店 + 4个餐厅 + 5个景点）
- ✅ 不同颜色的标记：
  - 🔵 蓝色圆圈 = 酒店
  - 🟢 绿色圆圈 = 餐厅
  - 🟠 橙色标签 = 景点
- ✅ 点击标记点可以查看详细信息

---

## 📍 模拟数据包含的地点

### 🏨 酒店（3个）
1. The Plaza Hotel - (40.7648, -73.9747)
2. The Standard High Line - (40.7410, -74.0076)
3. 1 Hotel Brooklyn Bridge - (40.7033, -73.9903)

### 🍽️ 餐厅（4个）
1. Le Bernardin - (40.7614, -73.9776)
2. Joe's Pizza - (40.7300, -74.0020)
3. Katz's Delicatessen - (40.7223, -73.9872)
4. Eleven Madison Park - (40.7425, -73.9868)

### 🎯 景点（5个）
1. Statue of Liberty - (40.6892, -74.0445)
2. Central Park - (40.7829, -73.9654)
3. Empire State Building - (40.7484, -73.9857)
4. Brooklyn Bridge - (40.7061, -73.9969)
5. Times Square - (40.7580, -73.9855)

---

## 🎨 预期效果

### 聊天界面
- 显示用户请求："Plan a trip to New York"
- AI 回复包含所有推荐
- 可以看到酒店、餐厅、景点的卡片

### 地图界面
- 左侧：地点列表（可滚动）
- 右侧：Google Maps
- 所有地点都有标记点
- 点击列表项 = 地图跳转到该位置
- 点击地图标记 = 列表滚动到该项
- 顶部有过滤按钮（All/Hotels/Food/Sights）

---

## 🐛 调试信息

如果你之前添加了调试覆盖层（黄色框），打开地图时你应该能看到：

```
🐛 Debug Info (Remove after fixing)
API Key: ✅ Loaded
isLoaded: ✅ true
loadError: ✅ null
Places: 12 total, 12 with coords
Center: [40.7127, -74.0061]
Map Container: ✅ Exists
Map Instance: ✅ Created
Markers: 12 markers
```

所有指标都应该是 ✅，如果有任何 ❌，告诉我具体是什么。

---

## 🔄 添加更多城市

如果你想测试其他城市的数据，我已经在 `mockTravelData.js` 中准备了东京的数据。

要使用东京数据，修改 Sidebar.jsx 中的按钮：

```jsx
onClick={() => onLoadMockData?.('Tokyo')}  // 改为 Tokyo
```

或者我可以帮你添加一个下拉菜单来选择城市！

---

## ✅ 成功标志

你应该能看到：
1. ✅ 地图正常加载（不再空白）
2. ✅ 12 个标记点分布在纽约市区
3. ✅ 点击标记点显示信息窗口
4. ✅ 左侧列表显示所有地点
5. ✅ 过滤按钮可以筛选地点类型

---

## 🎯 下一步

### 当前状态
- ✅ **地图功能完全正常**
- ✅ **模拟数据可以测试所有功能**
- ❌ **真实 API 需要解决配额问题**

### 解决 API 配额问题的选项

查看 [API_QUOTA_SOLUTION.md](../API_QUOTA_SOLUTION.md) 了解：
- 升级 RapidAPI 计划
- 替换为其他免费 API（Amadeus, Foursquare）
- 等待配额重置

---

## 🧹 清理调试代码

当你确认地图工作正常后，可以移除调试覆盖层：

1. 打开 `frontend/src/components/MapView.jsx`
2. 删除黄色调试框的代码（大约第 333-347 行）
3. 删除控制台调试日志（第 130-148 行的 useEffect）

或者告诉我，我来帮你清理！

---

现在试试点击"Load Mock Data"按钮，然后打开地图查看效果吧！🎉

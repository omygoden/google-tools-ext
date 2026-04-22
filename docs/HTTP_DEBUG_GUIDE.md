# HTTP 请求故障排查指南

## 问题描述
HTTP 请求功能一直报错，无法成功发送请求。

## 已完成的修复

### 1. 增强错误日志 (http-request.js)
- ✅ 添加了 Chrome runtime 可用性检查
- ✅ 添加了详细的请求发送日志
- ✅ 改进了错误消息，包含解决方案提示
- ✅ 修复了语法错误（多余的括号）

### 2. 改进后台代理日志 (background.js)
- ✅ 添加了消息接收日志
- ✅ 添加了请求处理日志
- ✅ 添加了未知消息类型警告

## 排查步骤

### 步骤 1: 重新加载扩展
1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions`
3. 找到你的扩展 "SQL/JSON → Go Struct (Local)"
4. 点击刷新/重新加载按钮 🔄
5. 确保扩展已启用

### 步骤 2: 检查权限
在 `chrome://extensions` 页面：
1. 点击扩展的"详情"按钮
2. 向下滚动到"权限"部分
3. 确认以下权限已授予：
   - ✅ 读取和更改您访问的网站上的所有数据
   - ✅ 存储
   - ✅ 管理标签页

### 步骤 3: 打开开发者工具
1. 点击扩展图标打开应用
2. 按 F12 或右键点击 → "检查"
3. 切换到 "Console" 标签页
4. 清空控制台（点击 🚫 图标）

### 步骤 4: 查看后台脚本日志
1. 在 `chrome://extensions` 页面
2. 找到你的扩展
3. 点击 "service worker" 或 "背景页" 链接
4. 这会打开后台脚本的开发者工具
5. 切换到 "Console" 标签页

### 步骤 5: 发送测试请求
1. 在扩展中切换到 "HTTP 请求" 标签
2. 输入一个测试 URL，例如：
   - `https://httpbin.org/get` (GET 请求测试)
   - `https://httpbin.org/post` (POST 请求测试)
3. 点击"发送"按钮
4. 观察两个控制台的输出

### 步骤 6: 分析日志输出

#### 前台日志（应用页面控制台）应该显示：
```
[HTTP Request] Sending request via background proxy: {
  url: "https://...",
  method: "GET",
  headers: {...},
  bodyLength: 0
}
```

#### 后台日志（service worker 控制台）应该显示：
```
[Background] Received message: PROXY_REQUEST
[Background] Processing PROXY_REQUEST for URL: https://...
[Proxy] Requesting: GET https://...
[Proxy] Status: 200
```

#### 然后前台日志应该显示：
```
[HTTP Request] Received response: {success: true, status: 200, ...}
```

## 常见错误及解决方案

### 错误 1: "Could not establish connection. Receiving end does not exist."
**原因**: Background service worker 未运行
**解决方案**:
1. 重新加载扩展
2. 检查 background.js 是否有语法错误
3. 在 chrome://extensions 页面查看是否有错误提示

### 错误 2: "Failed to fetch"
**原因**: 网络错误或 CORS 问题
**解决方案**:
1. 确认 URL 是否正确
2. 确认网络连接正常
3. 尝试使用 httpbin.org 等测试 API
4. 检查目标服务器是否在线

### 错误 3: "Chrome 扩展运行时不可用"
**原因**: chrome.runtime 对象不可用
**解决方案**:
1. 确认是在扩展环境中运行（不是普通网页）
2. 重新加载扩展
3. 检查 manifest.json 配置

### 错误 4: 权限被拒绝
**原因**: 缺少必要的权限
**解决方案**:
1. 检查 manifest.json 中的 `host_permissions` 是否包含 `<all_urls>`
2. 重新加载扩展以应用权限更改
3. 如果是首次使用，可能需要重新安装扩展

## 测试 URL 列表

### 安全的测试 API：
- GET: `https://httpbin.org/get`
- POST: `https://httpbin.org/post`
- JSON: `https://jsonplaceholder.typicode.com/posts/1`
- 延迟测试: `https://httpbin.org/delay/2`

## 下一步操作

如果问题仍然存在，请提供：
1. 前台控制台的完整错误信息
2. 后台 service worker 控制台的日志
3. 你尝试访问的 URL
4. Chrome 版本号

这些信息将帮助我们更准确地定位问题。

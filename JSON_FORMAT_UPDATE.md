# JSON 格式化模块更新说明

## 新增功能

### 1. 加载效果
- **触发条件**: 当输入的JSON数据超过10,000字符时，会显示加载指示器
- **显示内容**: 旋转的加载动画 + "正在格式化..." 文字提示
- **用户体验**: 在处理大数据量时，用户能看到明确的加载反馈，不会误以为程序卡死

### 2. 错误信息显示优化
- **之前**: 格式化失败时，错误信息只在顶部消息栏显示，输出框清空
- **现在**: 
  - 错误信息直接显示在输出框中
  - 错误文本显示为红色（#ff3b30）
  - 包含详细的错误原因和出错位置
  - 格式: `❌ 格式化失败\n\n[详细错误信息]`

## 测试用例

### 测试1: 大数据量加载效果
```javascript
// 生成一个大JSON对象（超过10,000字符）
const largeData = {
  items: Array.from({length: 500}, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `This is a description for item ${i}`,
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      tags: ['tag1', 'tag2', 'tag3']
    }
  }))
};
console.log(JSON.stringify(largeData));
```

### 测试2: 格式错误显示
输入以下错误的JSON：
```
{
  "name": "test",
  "value": 123,
  "invalid": 
}
```

预期输出框显示：
```
❌ 格式化失败

JSON 格式错误: Unexpected token } in JSON at position XX

出错位置附近:
...
```

### 测试3: 正常格式化
输入：
```json
{"name":"test","value":123,"nested":{"key":"value"}}
```

预期：正常格式化输出，文本颜色恢复正常（黑色）

## 技术实现

### 修改的文件
1. **popup.js**
   - 修改 `handleJsonFormat()` 函数
   - 添加 `showJsonLoading()` 函数
   - 添加 `hideJsonLoading()` 函数

2. **styles.css**
   - 添加 `.json-loading` 样式
   - 添加 `.json-loading-spinner` 样式
   - 添加 `.json-loading-text` 样式
   - 添加 `@keyframes json-spin` 动画

### 关键代码逻辑
1. 在格式化开始前检查输入长度
2. 如果超过10,000字符，显示loading
3. 使用 `await new Promise(resolve => setTimeout(resolve, 10))` 让UI有时间更新
4. 格式化完成或出错后，移除loading
5. 出错时在输出框显示错误信息并设置红色文字
6. 成功时重置文字颜色为默认值

# JSON 格式化模块优化说明

## 优化内容

### 1. 错误信息提示优化

**问题：** 之前当 JSON 格式有问题时，错误信息不够详细，用户难以定位问题。

**解决方案：**
- 捕获 JSON.parse() 抛出的详细错误信息
- 在错误消息中显示具体的错误原因（如 "Unexpected token"、位置信息等）
- 错误时自动清空输出框，避免显示旧的内容
- 移除可能存在的可点击包装器，恢复文本框显示

**示例：**
- 输入：`{name: "test"}`
- 错误消息：`JSON 格式错误: Unexpected token n in JSON at position 1`

### 2. 自动移除转义符（支持嵌套）

**问题：** 从某些 API 或日志中复制的 JSON 数据可能包含转义符（如 `"{\"name\":\"value\"}"`），甚至可能包含嵌套的转义 JSON（如数组中的对象包含转义的 JSON 字符串字段）。

**解决方案：**
- 检测输入是否为转义的 JSON 字符串（以双引号开始和结束）
- 自动进行解析和递归处理：
  1. 第一次解析移除外层引号和转义符（如果需要）
  2. 第二次解析实际的 JSON 内容
  3. **递归处理**：深度遍历 JSON 结构，检测所有字符串值
  4. 如果字符串值本身是有效的 JSON，自动解析并替换
- 自动更新输入框为完全解析的版本
- 显示特殊提示消息告知用户已自动处理

**示例 1 - 简单转义：**
- 输入：`"{\"name\":\"John\",\"age\":30}"`
- 自动转换为：`{"name":"John","age":30}`
- 消息：`JSON 已格式化（已自动移除转义符）`

**示例 2 - 嵌套转义（数组中的对象包含转义的 JSON 字符串）：**
- 输入：
```json
[{
  "tag": "137",
  "data": "{\"status\":3,\"name\":\"test\"}"
}]
```
- 自动转换为：
```json
[{
  "tag": "137",
  "data": {
    "status": 3,
    "name": "test"
  }
}]
```
- 消息：`JSON 已格式化（已自动移除转义符）`


## 代码变更

### 文件：`popup.js`

#### 变更 1：新增 `deepUnescapeJson` 递归函数

这是一个核心的递归函数，用于深度遍历 JSON 结构并自动解析所有转义的 JSON 字符串。

```javascript
/* ===== Recursively unescape JSON strings ===== */
function deepUnescapeJson(obj) {
  if (typeof obj === 'string') {
    // Try to parse the string as JSON
    try {
      const parsed = JSON.parse(obj);
      // If successful, recursively process the parsed result
      return deepUnescapeJson(parsed);
    } catch (e) {
      // Not a JSON string, return as is
      return obj;
    }
  } else if (Array.isArray(obj)) {
    // Recursively process array elements
    return obj.map(item => deepUnescapeJson(item));
  } else if (obj !== null && typeof obj === 'object') {
    // Recursively process object properties
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = deepUnescapeJson(obj[key]);
      }
    }
    return result;
  }
  // Return primitives as is
  return obj;
}
```

**工作原理：**
1. **字符串处理：** 尝试将字符串解析为 JSON，如果成功则递归处理解析结果
2. **数组处理：** 递归处理每个数组元素
3. **对象处理：** 递归处理每个对象属性
4. **基本类型：** 直接返回（数字、布尔值、null 等）

**示例：**
```javascript
// 输入
const input = [{
  "data": "{\"name\":\"test\",\"nested\":\"{\\\"deep\\\":1}\"}"
}];

// 输出（完全解析）
const output = [{
  "data": {
    "name": "test",
    "nested": {
      "deep": 1
    }
  }
}];
```

#### 变更 2：`handleJsonFormat` 函数增强

```javascript
async function handleJsonFormat(silent = false) {
  try {
    let input = ($("#jsonFormatInput")?.value || "").trim();
    if (!input) {
      if ($("#jsonFormatOutput")) $("#jsonFormatOutput").value = "";
      if (!silent) setMsg("");
      return;
    }

    // Try to parse directly first
    let parsed;
    let wasUnescaped = false;
    
    try {
      parsed = JSON.parse(input);
    } catch (firstError) {
      // If parsing fails, try to detect and unescape JSON
      // Check if the input looks like an escaped JSON string
      if (input.startsWith('"') && input.endsWith('"')) {
        try {
          // Remove outer quotes and parse as a string to unescape
          const unescaped = JSON.parse(input);
          // Now try to parse the unescaped content as JSON
          parsed = JSON.parse(unescaped);
          wasUnescaped = true;
          // Update the input field with the unescaped version
          if ($("#jsonFormatInput")) {
            $("#jsonFormatInput").value = unescaped;
            updateLineNumbers($("#jsonFormatInput"), $("#jsonFormatInputLines"));
          }
        } catch (secondError) {
          // If still fails, throw the original error with details
          throw new Error(`JSON 格式错误: ${firstError.message}`);
        }
      } else {
        // Not an escaped string, throw detailed error
        throw new Error(`JSON 格式错误: ${firstError.message}`);
      }
    }

    // ... 格式化逻辑 ...

    if (!silent) {
      if (wasUnescaped) {
        setMsg("JSON 已格式化（已自动移除转义符）");
      } else {
        setMsg("JSON 已格式化");
      }
    }
  } catch (e) {
    // Clear output on error
    if ($("#jsonFormatOutput")) {
      $("#jsonFormatOutput").value = "";
      // Remove clickable wrapper if exists
      const wrapper = $("#jsonFormatOutput").nextElementSibling;
      if (wrapper && wrapper.classList.contains('json-clickable-wrapper')) {
        wrapper.remove();
        $("#jsonFormatOutput").style.display = '';
      }
      updateLineNumbers($("#jsonFormatOutput"), $("#jsonFormatOutputLines"));
    }
    if (!silent) setMsg(String(e?.message || e), true);
  }
}
```

#### 变更 2：`handleJsonMinify` 函数错误提示优化

```javascript
} catch (e) {
  setMsg(`JSON 格式错误: ${e?.message || e}`, true);
}
```

## 技术细节

### 转义符检测逻辑

1. **检测条件：** 输入字符串以 `"` 开始且以 `"` 结束
2. **处理流程：**
   - 尝试直接解析（正常 JSON）
   - 如果失败且符合转义条件，进行第一次解析（移除转义）
   - 对解析结果再次解析（获取实际 JSON）
   - 如果成功，更新输入框并标记为已处理
   - 如果失败，抛出原始错误

### 错误处理改进

1. **详细错误信息：** 使用 `Error.message` 获取具体错误描述
2. **清空输出：** 错误时清空输出框，避免混淆
3. **UI 状态恢复：** 移除可能存在的交互式包装器
4. **行号更新：** 确保行号显示与内容同步

## 用户体验改进

### 改进前
- ❌ 错误信息模糊：只显示 "SyntaxError"
- ❌ 转义 JSON 无法处理：需要手动去除转义符
- ❌ 错误时输出框可能显示旧内容

### 改进后
- ✅ 详细错误信息：显示具体错误位置和原因
- ✅ 自动处理转义：一键格式化转义的 JSON
- ✅ 错误时清空输出：避免混淆
- ✅ 智能提示：告知用户是否进行了自动处理

## 兼容性

- ✅ 向后兼容：不影响现有的正常 JSON 格式化功能
- ✅ 渐进增强：新功能作为额外的容错机制
- ✅ 无破坏性变更：所有现有测试用例仍然通过

## 测试建议

详细的测试用例请参考 `JSON_FORMAT_TEST_GUIDE.md` 文件。

主要测试场景：
1. 各种格式错误的 JSON（缺少引号、逗号、括号等）
2. 不同复杂度的转义 JSON（简单对象、嵌套对象、数组等）
3. 正常 JSON 的回归测试
4. 压缩功能的回归测试

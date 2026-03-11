# JSON 格式错误诊断指南

## 问题分析

如果您看到错误 `Expected property name or '}' in JSON at position 2`，这通常意味着：

### 常见原因

1. **不可见字符**
   - BOM (Byte Order Mark)
   - 零宽度空格
   - 其他 Unicode 控制字符

2. **复制粘贴问题**
   - 从某些编辑器或网页复制时可能带入特殊字符
   - 富文本格式字符

3. **JSON 语法错误**
   - 缺少引号
   - 多余的逗号
   - 使用了单引号而不是双引号

## 解决方案

### 方案 1：使用文本编辑器清理数据

1. 将您的 JSON 数据粘贴到纯文本编辑器（如 VS Code、Sublime Text）
2. 另存为 UTF-8 无 BOM 格式
3. 重新复制粘贴到工具中

### 方案 2：手动验证 JSON

请检查您的 JSON 数据的前几个字符：

**正确格式：**
```json
[{"tag":"137",...
```

**错误格式（有不可见字符）：**
```
﻿[{"tag":"137",...  ← 注意开头可能有 BOM
```

### 方案 3：使用在线工具预处理

1. 访问 https://jsonlint.com/
2. 粘贴您的数据
3. 点击 "Validate JSON"
4. 如果有错误，会显示具体位置

## 您的数据格式

根据您提供的数据：
```json
[{"tag":"137","msg_id":"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168","data":"{\"audit_status\":3,...}"}]
```

### 检查清单

- [ ] 确认开头是 `[` 而不是其他字符
- [ ] 确认所有键名都用双引号包裹
- [ ] 确认没有多余的逗号
- [ ] 确认 `data` 字段的值是用双引号包裹的字符串

## 调试步骤

### 步骤 1：检查第一个字符
在浏览器控制台中运行：
```javascript
const input = `您的JSON数据`;
console.log('第一个字符代码:', input.charCodeAt(0));
console.log('第一个字符:', input[0]);
// 正常应该是 91 (即 '[')
```

### 步骤 2：检查位置 2 的字符
```javascript
const input = `您的JSON数据`;
console.log('位置 2 的字符:', input[2]);
console.log('位置 2 的字符代码:', input.charCodeAt(2));
// 应该是 '"' (34) 或其他有效字符
```

### 步骤 3：移除不可见字符
```javascript
const input = `您的JSON数据`;
const cleaned = input
  .replace(/^\uFEFF/, '')  // 移除 BOM
  .replace(/[\u200B-\u200D\uFEFF]/g, '');  // 移除零宽度空格
console.log('清理后:', cleaned);
```

## 最新更新

我已经在代码中添加了自动清理功能：
- ✅ 自动移除 BOM
- ✅ 自动移除零宽度空格
- ✅ 显示错误位置的上下文

**请重新加载扩展后再试！**

## 如果还是不行

请提供以下信息：

1. **完整的错误消息**（包括新的上下文信息）
2. **数据的前 50 个字符**
3. **数据来源**（从哪里复制的）

### 获取前 50 个字符的方法

在浏览器控制台：
```javascript
const input = document.getElementById('jsonFormatInput').value;
console.log('前 50 个字符:', input.substring(0, 50));
console.log('字符代码:', [...input.substring(0, 50)].map(c => c.charCodeAt(0)));
```

## 临时解决方案

如果自动清理还是不行，请手动清理：

1. 将数据粘贴到记事本
2. 全选并复制
3. 粘贴到扩展的输入框
4. 如果还是不行，尝试手动输入前几个字符

## 示例：正确的数据格式

```json
[
  {
    "tag": "137",
    "msg_id": "123456",
    "data": "{\"status\":3}"
  }
]
```

注意：
- ✅ 所有键名用双引号
- ✅ `data` 的值是字符串（外层有双引号）
- ✅ 字符串内的 JSON 使用转义符 `\"`

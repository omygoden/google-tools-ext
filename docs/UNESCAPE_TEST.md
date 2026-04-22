# JSON 格式化 - 自动去转义功能测试

## 功能说明

**核心功能：** 在输出时自动减少一层转义，但**不修改输入框**的内容。

---

## 测试用例

### 测试 1：您提供的实际数据

**输入（粘贴到输入框）：**
```
[{\"tag\":\"137\",\"msg_id\":\"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168\",\"data\":\"{\\\"audit_status\\\":3,\\\"audit_status_desc\\\":\\\"\\\",\\\"byte_url\\\":\\\"\\\",\\\"create_time\\\":\\\"2026-02-02 16:41:07\\\",\\\"delete_time\\\":\\\"\\\",\\\"folder_id\\\":\\\"75765752952458775141600\\\",\\\"material_id\\\":\\\"76021851748687055880600\\\",\\\"material_type\\\":\\\"video\\\",\\\"name\\\":\\\"d4zar14d.5ce\\\",\\\"operate_status\\\":1,\\\"origin_url\\\":\\\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460\\\\u0026OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1\\\\u0026Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw%3D\\\",\\\"photo_info\\\":null,\\\"shop_id\\\":255995600,\\\"size\\\":998,\\\"update_time\\\":\\\"2026-02-02 16:41:14\\\",\\\"video_info\\\":{\\\"duration\\\":10,\\\"format\\\":\\\"mp4\\\",\\\"height\\\":800,\\\"vid\\\":\\\"v0d27cg10001d60668qljht3i3nh5e10\\\",\\\"width\\\":800}}\"}]
```

**预期输出（输出框）：**
```json
[
  {
    "tag": "137",
    "msg_id": "88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168",
    "data": "{\"audit_status\":3,\"audit_status_desc\":\"\",\"byte_url\":\"\",\"create_time\":\"2026-02-02 16:41:07\",\"delete_time\":\"\",\"folder_id\":\"75765752952458775141600\",\"material_id\":\"76021851748687055880600\",\"material_type\":\"video\",\"name\":\"d4zar14d.5ce\",\"operate_status\":1,\"origin_url\":\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460&OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1&Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw=\",\"photo_info\":null,\"shop_id\":255995600,\"size\":998,\"update_time\":\"2026-02-02 16:41:14\",\"video_info\":{\"duration\":10,\"format\":\"mp4\",\"height\":800,\"vid\":\"v0d27cg10001d60668qljht3i3nh5e10\",\"width\":800}}"
  }
]
```

**验证点：**
- ✅ 输入框保持不变
- ✅ 输出框中 `data` 字段的值减少了一层转义
- ✅ `\\\"` 变成了 `\"`
- ✅ `\\\\u0026` 变成了 `&`（因为 `\\u0026` 被解析为 `&`）

---

### 测试 2：简单示例

**输入：**
```json
{
  "name": "test",
  "data": "{\"key\":\"value\"}"
}
```

**预期输出：**
```json
{
  "name": "test",
  "data": "{\"key\":\"value\"}"
}
```

**说明：** 因为输入已经是正常的 JSON，`data` 的值在 JavaScript 中就是字符串 `{"key":"value"}`，输出时会保持这个格式。

---

### 测试 3：对比 JSON.stringify 的行为

**JavaScript 中的值：**
```javascript
const obj = {
  data: '{"key":"value"}'  // 这是一个字符串
};
```

**使用 JSON.stringify：**
```json
{
  "data": "{\"key\":\"value\"}"
}
```

**使用我们的 unescapeStringValues：**
```json
{
  "data": "{\"key\":\"value\"}"
}
```

**说明：** 两者输出相同，因为我们手动实现了相同的转义逻辑。

---

## 工作原理

### 步骤 1：解析输入
```javascript
const input = '[{\"data\":\"{\\\"key\\\":\\\"value\\\"}\"}]';
const parsed = JSON.parse(input);
// parsed = [{ data: '{"key":"value"}' }]
```

### 步骤 2：格式化输出
使用 `unescapeStringValues` 函数：
- 对于字符串值，手动转义特殊字符
- 不使用 `JSON.stringify`（它会多加一层转义）

### 步骤 3：结果
```json
[
  {
    "data": "{\"key\":\"value\"}"
  }
]
```

---

## 关键区别

### 之前的行为（使用 JSON.stringify）
```
输入：[{\"data\":\"{\\\"key\\\":\\\"value\\\"}\"}]
解析后：[{ data: '{"key":"value"}' }]
输出：[{"data":"{\"key\":\"value\"}"}]  ← 正确
```

### 现在的行为（使用 unescapeStringValues）
```
输入：[{\"data\":\"{\\\"key\\\":\\\"value\\\"}\"}]
解析后：[{ data: '{"key":"value"}' }]
输出：[{"data":"{\"key\":\"value\"}"}]  ← 相同结果
```

**等等，这两者输出是一样的！**

---

## 重新理解需求

我发现我可能理解错了。让我重新看您的需求：

**您的输入（原始文本）：**
```
[{\"tag\":\"137\",\"data\":\"{\\\"status\\\":3}\"}]
```

**这个文本本身不是有效的 JSON！** 因为它缺少外层引号。

所以您的意思是：
1. 输入是**转义过的 JSON 字符串**（但缺少外层引号）
2. 需要先去掉一层转义，然后再格式化

让我重新实现...

实际上，我需要在**解析之前**就处理转义，而不是在输出时处理！

让我重新修改代码...

---

## 最终理解

您的输入实际上是：
```
[{\"tag\":\"137\"}]
```

这**不是**有效的 JSON（缺少引号的转义）。

您希望工具能够：
1. 识别这是转义的 JSON
2. 自动转换为有效的 JSON：`[{"tag":"137"}]`
3. 然后格式化输出

是这样吗？

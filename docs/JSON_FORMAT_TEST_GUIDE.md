# JSON 格式化模块优化测试指南

## 测试目的
验证 JSON 格式化模块的两个新功能：
1. 当输入的 JSON 格式有问题时，显示详细的错误信息
2. 自动移除带有转义符的 JSON 字符串中的转义符

## 测试环境
- Chrome 浏览器
- 已安装的扩展程序

## 测试用例

### 测试用例 1: 错误信息提示

#### 1.1 缺少引号的 JSON
**输入:**
```
{name: "test", value: 123}
```

**预期结果:**
- 输出框应该为空
- 显示错误消息：`JSON 格式错误: Unexpected token n in JSON at position 1`（或类似的详细错误信息）

#### 1.2 缺少逗号的 JSON
**输入:**
```json
{
  "name": "test"
  "value": 123
}
```

**预期结果:**
- 输出框应该为空
- 显示错误消息：`JSON 格式错误: Unexpected string in JSON at position ...`

#### 1.3 多余的逗号
**输入:**
```json
{
  "name": "test",
  "value": 123,
}
```

**预期结果:**
- 输出框应该为空
- 显示错误消息：`JSON 格式错误: Unexpected token } in JSON at position ...`

#### 1.4 不匹配的括号
**输入:**
```json
{
  "name": "test",
  "value": [1, 2, 3
}
```

**预期结果:**
- 输出框应该为空
- 显示错误消息：`JSON 格式错误: Unexpected token } in JSON at position ...`

### 测试用例 2: 自动移除转义符

#### 2.1 简单的转义 JSON
**输入:**
```
"{\"name\":\"John\",\"age\":30}"
```

**预期结果:**
- 输入框自动更新为：`{"name":"John","age":30}`
- 输出框显示格式化后的 JSON：
```json
{
  "name": "John",
  "age": 30
}
```
- 显示消息：`JSON 已格式化（已自动移除转义符）`

#### 2.2 嵌套对象的转义 JSON
**输入:**
```
"{\"user\":{\"name\":\"Alice\",\"address\":{\"city\":\"Beijing\",\"zip\":\"100000\"}},\"active\":true}"
```

**预期结果:**
- 输入框自动更新为未转义的 JSON
- 输出框显示格式化后的 JSON：
```json
{
  "user": {
    "name": "Alice",
    "address": {
      "city": "Beijing",
      "zip": "100000"
    }
  },
  "active": true
}
```
- 显示消息：`JSON 已格式化（已自动移除转义符）`

#### 2.3 包含数组的转义 JSON
**输入:**
```
"{\"items\":[{\"id\":1,\"name\":\"item1\"},{\"id\":2,\"name\":\"item2\"}],\"total\":2}"
```

**预期结果:**
- 输入框自动更新为未转义的 JSON
- 输出框显示格式化后的 JSON：
```json
{
  "items": [
    {
      "id": 1,
      "name": "item1"
    },
    {
      "id": 2,
      "name": "item2"
    }
  ],
  "total": 2
}
```
- 显示消息：`JSON 已格式化（已自动移除转义符）`

#### 2.4 数组中包含转义的 JSON 字符串（嵌套转义）
**输入:**
```
[{"tag":"137","msg_id":"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168","data":"{\"audit_status\":3,\"audit_status_desc\":\"\",\"byte_url\":\"\",\"create_time\":\"2026-02-02 16:41:07\",\"delete_time\":\"\",\"folder_id\":\"75765752952458775141600\",\"material_id\":\"76021851748687055880600\",\"material_type\":\"video\",\"name\":\"d4zar14d.5ce\",\"operate_status\":1,\"origin_url\":\"http://example.com/video.mp4\",\"photo_info\":null,\"shop_id\":255995600,\"size\":998,\"update_time\":\"2026-02-02 16:41:14\",\"video_info\":{\"duration\":10,\"format\":\"mp4\",\"height\":800,\"vid\":\"v0d27cg10001d60668qljht3i3nh5e10\",\"width\":800}}"}]
```

**预期结果:**
- 输入框自动更新为完全解析的 JSON（data 字段从字符串变为对象）
- 输出框显示格式化后的 JSON：
```json
[
  {
    "tag": "137",
    "msg_id": "88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168",
    "data": {
      "audit_status": 3,
      "audit_status_desc": "",
      "byte_url": "",
      "create_time": "2026-02-02 16:41:07",
      "delete_time": "",
      "folder_id": "75765752952458775141600",
      "material_id": "76021851748687055880600",
      "material_type": "video",
      "name": "d4zar14d.5ce",
      "operate_status": 1,
      "origin_url": "http://example.com/video.mp4",
      "photo_info": null,
      "shop_id": 255995600,
      "size": 998,
      "update_time": "2026-02-02 16:41:14",
      "video_info": {
        "duration": 10,
        "format": "mp4",
        "height": 800,
        "vid": "v0d27cg10001d60668qljht3i3nh5e10",
        "width": 800
      }
    }
  }
]
```
- 显示消息：`JSON 已格式化（已自动移除转义符）`

#### 2.5 转义的但格式错误的 JSON
**输入:**
```
"{\"name\":\"test\",\"value\":}"
```

**预期结果:**
- 输出框应该为空
- 显示错误消息：`JSON 格式错误: Unexpected token } in JSON at position ...`

### 测试用例 3: 正常 JSON（回归测试）

#### 3.1 标准 JSON 对象
**输入:**
```json
{"name": "test", "value": 123, "active": true}
```

**预期结果:**
- 输出框显示格式化后的 JSON：
```json
{
  "name": "test",
  "value": 123,
  "active": true
}
```
- 显示消息：`JSON 已格式化`

#### 3.2 JSON 数组
**输入:**
```json
[{"id": 1}, {"id": 2}, {"id": 3}]
```

**预期结果:**
- 输出框显示格式化后的 JSON：
```json
[
  {
    "id": 1
  },
  {
    "id": 2
  },
  {
    "id": 3
  }
]
```
- 显示消息：`JSON 已格式化`

### 测试用例 4: 压缩功能（回归测试）

#### 4.1 压缩正常 JSON
**输入:**
```json
{
  "name": "test",
  "value": 123
}
```

**操作:** 点击"压缩"按钮

**预期结果:**
- 输出框显示：`{"name":"test","value":123}`
- 显示消息：`JSON 已压缩`

#### 4.2 压缩错误 JSON
**输入:**
```
{name: "test"}
```

**操作:** 点击"压缩"按钮

**预期结果:**
- 显示错误消息：`JSON 格式错误: Unexpected token n in JSON at position 1`

## 测试步骤

1. 在 Chrome 浏览器中打开扩展程序
2. 切换到 "JSON 格式化" 标签页
3. 按照上述测试用例，依次输入测试数据
4. 观察输出结果和错误消息是否符合预期
5. 记录任何不符合预期的行为

## 验收标准

✅ 所有错误的 JSON 输入都应该显示详细的错误信息
✅ 所有带转义符的 JSON 都应该自动移除转义符并正确格式化
✅ 错误时输出框应该被清空
✅ 正常的 JSON 格式化功能不受影响
✅ 压缩功能正常工作

## 注意事项

- 测试时注意观察消息提示的内容
- 确保输入框和输出框的内容都符合预期
- 如果发现问题，记录详细的错误信息和复现步骤

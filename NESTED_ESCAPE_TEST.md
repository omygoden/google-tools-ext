# 嵌套转义 JSON 测试用例

## 测试用例 1：您提供的实际数据

### 输入
```json
[{"tag":"137","msg_id":"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168","data":"{\"audit_status\":3,\"audit_status_desc\":\"\",\"byte_url\":\"\",\"create_time\":\"2026-02-02 16:41:07\",\"delete_time\":\"\",\"folder_id\":\"75765752952458775141600\",\"material_id\":\"76021851748687055880600\",\"material_type\":\"video\",\"name\":\"d4zar14d.5ce\",\"operate_status\":1,\"origin_url\":\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460\\u0026OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1\\u0026Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw%3D\",\"photo_info\":null,\"shop_id\":255995600,\"size\":998,\"update_time\":\"2026-02-02 16:41:14\",\"video_info\":{\"duration\":10,\"format\":\"mp4\",\"height\":800,\"vid\":\"v0d27cg10001d60668qljht3i3nh5e10\",\"width\":800}}"}]
```

### 预期输出（格式化后）
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
      "origin_url": "http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460&OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1&Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw%3D",
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

### 验证点
- ✅ `data` 字段从字符串变为对象
- ✅ `video_info` 嵌套对象正确解析
- ✅ URL 中的 `\u0026` 转义符被正确处理为 `&`
- ✅ 所有字段都正确格式化
- ✅ 显示消息：`JSON 已格式化（已自动移除转义符）`

---

## 测试用例 2：多层嵌套转义

### 输入
```json
[{
  "level1": "{\"level2\":\"{\\\"level3\\\":\\\"deep value\\\"}\"}"
}]
```

### 预期输出
```json
[
  {
    "level1": {
      "level2": {
        "level3": "deep value"
      }
    }
  }
]
```

### 验证点
- ✅ 三层嵌套转义全部解析
- ✅ 最终得到完整的对象结构

---

## 测试用例 3：数组中多个对象包含转义

### 输入
```json
[
  {"id": 1, "data": "{\"name\":\"item1\"}"},
  {"id": 2, "data": "{\"name\":\"item2\"}"},
  {"id": 3, "data": "{\"name\":\"item3\"}"}
]
```

### 预期输出
```json
[
  {
    "id": 1,
    "data": {
      "name": "item1"
    }
  },
  {
    "id": 2,
    "data": {
      "name": "item2"
    }
  },
  {
    "id": 3,
    "data": {
      "name": "item3"
    }
  }
]
```

### 验证点
- ✅ 所有数组元素的 `data` 字段都被解析
- ✅ 保持数组顺序

---

## 测试用例 4：混合场景

### 输入
```json
{
  "users": [
    {"id": 1, "profile": "{\"age\":25,\"city\":\"Beijing\"}"},
    {"id": 2, "profile": "{\"age\":30,\"city\":\"Shanghai\"}"}
  ],
  "metadata": "{\"version\":\"1.0\",\"timestamp\":\"2026-02-02\"}"
}
```

### 预期输出
```json
{
  "users": [
    {
      "id": 1,
      "profile": {
        "age": 25,
        "city": "Beijing"
      }
    },
    {
      "id": 2,
      "profile": {
        "age": 30,
        "city": "Shanghai"
      }
    }
  ],
  "metadata": {
    "version": "1.0",
    "timestamp": "2026-02-02"
  }
}
```

### 验证点
- ✅ 数组中的转义 JSON 被解析
- ✅ 对象属性中的转义 JSON 被解析
- ✅ 混合结构正确处理

---

## 测试步骤

1. 打开 Chrome 扩展程序
2. 切换到 "JSON 格式化" 标签
3. 将上述测试用例的输入复制到输入框
4. 观察输出是否与预期一致
5. 检查提示消息是否显示 "已自动移除转义符"

## 成功标准

- ✅ 所有嵌套的转义 JSON 字符串都被正确解析
- ✅ 输出结构完整且格式正确
- ✅ 没有遗漏任何转义的字段
- ✅ 提示消息正确显示
- ✅ 输入框自动更新为解析后的 JSON

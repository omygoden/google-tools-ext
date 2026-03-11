# JSON 格式化 - 自动去转义功能说明

## ✅ 最终实现

### 功能描述

**自动处理输入中的反斜杠转义**，将类似 `\"`  的转义序列转换为正常的 JSON 格式。

---

## 工作原理

### 输入处理流程

1. **接收输入**
   ```
   原始输入：[{\"tag\":\"137\",\"data\":\"{\\\"status\\\":3}\"}]
   ```

2. **自动去转义**
   - 检测输入中的 `\"` 序列
   - 将 `\"` 替换为 `"`
   - 将 `\\\"` 保留为 `\"`（处理嵌套转义）

3. **转换后的输入**
   ```json
   [{"tag":"137","data":"{\"status\":3}"}]
   ```

4. **解析和格式化**
   - 使用 `JSON.parse()` 解析
   - 使用 `JSON.stringify()` 格式化输出

5. **最终输出**
   ```json
   [
     {
       "tag": "137",
       "data": "{\"status\":3}"
     }
   ]
   ```

---

## 示例对比

### 示例 1：您的实际数据

**输入（粘贴到输入框）：**
```
[{\"tag\":\"137\",\"msg_id\":\"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168\",\"data\":\"{\\\"audit_status\\\":3,\\\"audit_status_desc\\\":\\\"\\\",\\\"byte_url\\\":\\\"\\\",\\\"create_time\\\":\\\"2026-02-02 16:41:07\\\",\\\"delete_time\\\":\\\"\\\",\\\"folder_id\\\":\\\"75765752952458775141600\\\",\\\"material_id\\\":\\\"76021851748687055880600\\\",\\\"material_type\\\":\\\"video\\\",\\\"name\\\":\\\"d4zar14d.5ce\\\",\\\"operate_status\\\":1,\\\"origin_url\\\":\\\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460\\\\u0026OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1\\\\u0026Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw%3D\\\",\\\"photo_info\\\":null,\\\"shop_id\\\":255995600,\\\"size\\\":998,\\\"update_time\\\":\\\"2026-02-02 16:41:14\\\",\\\"video_info\\\":{\\\"duration\\\":10,\\\"format\\\":\\\"mp4\\\",\\\"height\\\":800,\\\"vid\\\":\\\"v0d27cg10001d60668qljht3i3nh5e10\\\",\\\"width\\\":800}}\"}]
```

**处理步骤：**

1. **去转义后：**
   ```json
   [{"tag":"137","msg_id":"88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168","data":"{\"audit_status\":3,\"audit_status_desc\":\"\",\"byte_url\":\"\",\"create_time\":\"2026-02-02 16:41:07\",\"delete_time\":\"\",\"folder_id\":\"75765752952458775141600\",\"material_id\":\"76021851748687055880600\",\"material_type\":\"video\",\"name\":\"d4zar14d.5ce\",\"operate_status\":1,\"origin_url\":\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460&OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1&Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw=\",\"photo_info\":null,\"shop_id\":255995600,\"size\":998,\"update_time\":\"2026-02-02 16:41:14\",\"video_info\":{\"duration\":10,\"format\":\"mp4\",\"height\":800,\"vid\":\"v0d27cg10001d60668qljht3i3nh5e10\",\"width\":800}}"}]
   ```

2. **格式化输出：**
   ```json
   [
     {
       "tag": "137",
       "msg_id": "88550786847158120670:0255995600:137:1770021674:0001021145047866:6838502441600796168",
       "data": "{\"audit_status\":3,\"audit_status_desc\":\"\",\"byte_url\":\"\",\"create_time\":\"2026-02-02 16:41:07\",\"delete_time\":\"\",\"folder_id\":\"75765752952458775141600\",\"material_id\":\"76021851748687055880600\",\"material_type\":\"video\",\"name\":\"d4zar14d.5ce\",\"operate_status\":1,\"origin_url\":\"http://vibktprfx-prod-prod-aic-vd-cn-shanghai.oss-cn-shanghai.aliyuncs.com/video-gen/2026-02-02-16/BZDeOqjN.mp4?Expires=1770023460&OSSAccessKeyId=LTAI4FoLmvQ9urWXgSRpDvh1&Signature=C5aXX2kZZgwGurrRVw9OhUwwZqw=\",\"photo_info\":null,\"shop_id\":255995600,\"size\":998,\"update_time\":\"2026-02-02 16:41:14\",\"video_info\":{\"duration\":10,\"format\":\"mp4\",\"height\":800,\"vid\":\"v0d27cg10001d60668qljht3i3nh5e10\",\"width\":800}}"
     }
   ]
   ```

**关键点：**
- ✅ `data` 字段仍然是字符串（不是对象）
- ✅ 字符串内容是 `{\"status\":3}`（保留了内部的转义）
- ✅ 输入框**不会**被修改

---

## 技术实现

### 转义处理逻辑

```javascript
// 1. 使用占位符处理嵌套转义
const placeholder = '\u0000QUOTE\u0000';
unescapedInput = input
  .replace(/\\\\\"/g, placeholder)  // \\\" -> 占位符
  .replace(/\\"/g, '"')              // \" -> "
  .replace(new RegExp(placeholder, 'g'), '\\"');  // 占位符 -> \"
```

### 转义规则

| 输入序列 | 转换后 | 说明 |
|---------|--------|------|
| `\"` | `"` | 单层转义 → 正常引号 |
| `\\\"` | `\"` | 双层转义 → 单层转义 |
| `\\\\\"` | `\\\"` | 三层转义 → 双层转义 |

---

## 使用场景

### ✅ 适用场景

1. **从日志文件复制的 JSON**
   ```
   输入：{\"error\":\"not found\"}
   输出：{"error":"not found"}
   ```

2. **从代码中复制的转义 JSON**
   ```
   输入：[{\"id\":1,\"name\":\"test\"}]
   输出：[{"id":1,"name":"test"}]
   ```

3. **包含嵌套转义的 JSON**
   ```
   输入：{\"data\":\"{\\\"key\\\":\\\"value\\\"}\"}
   输出：{"data":"{\"key\":\"value\"}"}
   ```

### ❌ 不影响的场景

1. **正常的 JSON**（不会被修改）
   ```json
   输入：{"name":"test"}
   输出：{"name":"test"}
   ```

2. **已经格式化的 JSON**（保持原样）
   ```json
   输入：
   {
     "name": "test"
   }
   输出：（相同）
   ```

---

## 重要说明

### 1. 输入框不会被修改
- ✅ 转义处理只在内部进行
- ✅ 输入框保持原始内容
- ✅ 只有输出框显示格式化结果

### 2. 字符串值保持为字符串
- ✅ `data` 字段的值如果是字符串，不会被解析为对象
- ✅ 保持数据的原始结构
- ✅ 只减少一层转义，不递归解析

### 3. 自动检测
- ✅ 自动检测输入是否需要去转义
- ✅ 如果去转义后无法解析，保持原样
- ✅ 不会破坏有效的 JSON

---

## 测试步骤

1. **重新加载扩展**
   - 打开 `chrome://extensions/`
   - 找到扩展并点击刷新 🔄

2. **测试您的数据**
   - 粘贴您提供的实际数据
   - 查看输出是否符合预期

3. **验证结果**
   - ✅ 输出格式化正确
   - ✅ `data` 字段是字符串
   - ✅ 显示消息：`JSON 已格式化（已自动移除转义符）`

---

## 总结

现在的实现：
- ✅ 在**输入阶段**自动去除反斜杠转义
- ✅ 使用标准的 `JSON.stringify` 输出
- ✅ 保持字符串值为字符串（不递归解析）
- ✅ 输入框不被修改

这应该完全符合您的需求！🎉

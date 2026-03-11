# 文件管理模块 - 变更日志

## [1.1.0] - 2026-02-17

### 新增 (Added)
- ✨ 支持 TXT 文件格式 (.txt)
- ✨ 支持 Markdown 文件格式 (.md, .markdown)
- ✨ 支持 HTML 文件格式 (.html, .htm)
- ✨ 新增文件图标系统，不同文件类型显示不同图标
  - 📘 .docx - Word 2007+ 文档
  - 📗 .doc - Word 97-2003 文档
  - 📝 .txt - 纯文本文件
  - 📋 .md/.markdown - Markdown 文档
  - 🌐 .html/.htm - HTML 文件
- ✨ 新增 `getFileIcon()` 函数 - 根据文件扩展名返回图标
- ✨ 新增 `readTextFile()` 函数 - 读取纯文本文件
- ✨ 新增 `readFileContent()` 函数 - 统一的文件读取接口
- ✨ 支持混合文件类型上传（可同时上传不同格式的文件）

### 修改 (Changed)
- 🔄 更新文件选择器 accept 属性，从 `.doc,.docx` 扩展为 `.doc,.docx,.txt,.md,.markdown,.html,.htm`
- 🔄 更新界面文本
  - 按钮："选择 Word 文档" → "选择文件"
  - 提示："支持 .doc 和 .docx 格式" → "支持 Word、TXT、Markdown、HTML 等格式"
  - 空状态："暂无文件，请选择或拖拽 Word 文档" → "暂无文件，请选择或拖拽文件"
- 🔄 优化文件验证逻辑，使用数组存储支持的扩展名
- 🔄 改进错误提示信息，更加友好和具体
- 🔄 `handleFiles()` 函数使用 `supportedExtensions` 数组进行验证
- 🔄 `updateFileList()` 函数使用 `getFileIcon()` 动态显示图标
- 🔄 `mergeToTxt()` 和 `mergeToWord()` 函数使用 `readFileContent()` 替代 `readWordDocument()`

### 文档 (Documentation)
- 📝 创建 `FILE_MANAGER_MULTI_FORMAT_UPDATE.md` - 详细更新说明
- 📝 创建 `FILE_MANAGER_TEST_GUIDE.md` - 完整测试指南
- 📝 创建 `FILE_MANAGER_UPDATE_SUMMARY_V1.1.0.md` - 更新总结
- 📝 创建 `FILE_MANAGER_QUICK_START.md` - 快速开始指南
- 📝 创建 `FILE_MANAGER_V1.1.0_README.md` - 主 README 文件
- 📝 创建测试文件：`test-text.txt`, `test-markdown.md`, `test-html.html`

### 技术细节 (Technical)
- 🔧 文本文件使用 `FileReader.readAsText()` 以 UTF-8 编码读取
- 🔧 Word 文档继续使用 `FileReader.readAsArrayBuffer()` 和 XML 解析
- 🔧 文件类型判断基于文件扩展名（toLowerCase）
- 🔧 保持向后兼容，原有 Word 文档功能不受影响

### 兼容性 (Compatibility)
- ✅ 完全向后兼容 v1.0.0
- ✅ 不影响现有用户的使用习惯
- ✅ 新功能为增量添加，无破坏性变更

---

## [1.0.0] - 之前版本

### 功能
- ✅ 支持 Word 文档上传 (.doc, .docx)
- ✅ 文件拖拽上传
- ✅ 文件列表显示
- ✅ 文件移除和清空
- ✅ 多种分隔符选项
  - 单行空白
  - 双行空白
  - 分隔线
  - 星号分隔
  - 自定义分隔符
- ✅ 合并为 TXT 文件
- ✅ 合并为 Word 文件 (DOCX)
- ✅ 内容预览
- ✅ 自动下载

---

## 版本说明

### 版本号规则
- **主版本号**：重大功能变更或不兼容的 API 修改
- **次版本号**：新增功能，向后兼容
- **修订号**：问题修复，向后兼容

### 当前版本
**v1.1.0** - 多格式支持更新

### 下一个版本计划
**v1.2.0** - 用户体验优化
- 文件大小限制提示
- 文件预览功能
- 文件排序功能
- 导出文件名自定义

---

## 更新日期
- **v1.1.0**: 2026-02-17
- **v1.0.0**: 之前版本

## 维护者
Tool Extension Team

## 许可证
内部使用

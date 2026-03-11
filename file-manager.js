/* =========================
 * file-manager.js - Word Document File Manager
 * ========================= */

// Store uploaded files
let uploadedFiles = [];

function $(id) {
    return document.getElementById(id);
}

// Initialize file manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initFileManager();
});

function initFileManager() {
    const fileInput = $('fileInput');
    const fileDropZone = $('fileDropZone');
    const btnSelectFiles = $('btnSelectFiles');
    const btnMergeToTxt = $('btnMergeToTxt');
    const btnMergeToWord = $('btnMergeToWord');
    const btnClearFiles = $('btnClearFiles');
    const fileListContainer = $('fileListContainer');

    if (!fileInput || !fileDropZone) return;

    // Click to select files
    btnSelectFiles?.addEventListener('click', () => {
        fileInput.click();
    });

    fileDropZone?.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag and drop
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileDropZone.style.borderColor = '#34c759';
        fileDropZone.style.background = '#e8f5e9';
    });

    fileDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileDropZone.style.borderColor = '#007aff';
        fileDropZone.style.background = '#f5f7fa';
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileDropZone.style.borderColor = '#007aff';
        fileDropZone.style.background = '#f5f7fa';

        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // Button actions
    btnMergeToTxt?.addEventListener('click', () => mergeToTxt());
    btnMergeToWord?.addEventListener('click', () => mergeToWord());
    btnClearFiles?.addEventListener('click', () => clearAllFiles());

    // Event delegation for remove buttons
    fileListContainer?.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-file]');
        if (removeBtn) {
            const index = parseInt(removeBtn.getAttribute('data-remove-file'), 10);
            removeFile(index);
        }
    });

    // Separator type change
    const separatorRadios = document.querySelectorAll('input[name="separatorType"]');
    const customSeparatorInput = $('customSeparator');

    separatorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (customSeparatorInput) {
                customSeparatorInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
                if (e.target.value === 'custom') {
                    customSeparatorInput.focus();
                }
            }
        });
    });
}

// Handle selected files
function handleFiles(files) {
    if (!files || files.length === 0) return;

    const supportedExtensions = ['.doc', '.docx', '.txt', '.md', '.markdown', '.html', '.htm'];

    const validFiles = Array.from(files).filter(file => {
        const fileName = file.name.toLowerCase();
        return supportedExtensions.some(ext => fileName.endsWith(ext));
    });

    if (validFiles.length === 0) {
        setMsg('请选择支持的文件格式 (Word、TXT、Markdown、HTML)', true);
        return;
    }

    // Add to uploaded files
    validFiles.forEach(file => {
        // Check if file already exists
        const exists = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
        if (!exists) {
            uploadedFiles.push(file);
        }
    });

    updateFileList();
    setMsg(`已添加 ${validFiles.length} 个文件`);
}

// Get file icon based on extension
function getFileIcon(fileName) {
    const name = fileName.toLowerCase();
    if (name.endsWith('.docx')) return '📘';
    if (name.endsWith('.doc')) return '📗';
    if (name.endsWith('.txt')) return '📝';
    if (name.endsWith('.md') || name.endsWith('.markdown')) return '📋';
    if (name.endsWith('.html') || name.endsWith('.htm')) return '🌐';
    return '📄';
}

// Update file list display
function updateFileList() {
    const fileList = $('fileList');
    const fileCount = $('fileCount');

    if (!fileList) return;

    if (uploadedFiles.length === 0) {
        fileList.innerHTML = `
      <div style="text-align: center; color: #86868b; padding: 60px 20px;">
        <div style="font-size: 32px; margin-bottom: 12px;">📋</div>
        <div style="font-size: 14px;">暂无文件，请选择或拖拽文件</div>
      </div>
    `;
        if (fileCount) fileCount.textContent = '0';
        return;
    }

    if (fileCount) fileCount.textContent = uploadedFiles.length;

    let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

    uploadedFiles.forEach((file, index) => {
        const sizeKB = (file.size / 1024).toFixed(2);
        const icon = getFileIcon(file.name);

        html += `
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: #f9f9f9; border-radius: 6px; border: 1px solid #e0e0e0;">
        <div style="font-size: 24px;">${icon}</div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 13px; color: #1d1d1f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name}">
            ${file.name}
          </div>
          <div style="font-size: 11px; color: #86868b; margin-top: 2px;">
            ${sizeKB} KB
          </div>
        </div>
        <button class="small-btn secondary" data-remove-file="${index}" style="padding: 4px 8px; font-size: 11px;">
          移除
        </button>
      </div>
    `;
    });

    html += '</div>';
    fileList.innerHTML = html;
}

// Remove a file from the list
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
    setMsg('文件已移除');
}

// Clear all files
function clearAllFiles() {
    uploadedFiles = [];
    updateFileList();
    if ($('mergedContent')) {
        $('mergedContent').value = '';
    }
    setMsg('已清空文件列表');
}

// Read file content based on file type
async function readFileContent(file) {
    const fileName = file.name.toLowerCase();

    // For text-based files (txt, md, html)
    if (fileName.endsWith('.txt') || fileName.endsWith('.md') ||
        fileName.endsWith('.markdown') || fileName.endsWith('.html') ||
        fileName.endsWith('.htm')) {
        return readTextFile(file);
    }

    // For Word documents
    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        return readWordDocument(file);
    }

    // Fallback for unsupported files
    return Promise.resolve(`[不支持的文件格式: ${file.name}]`);
}

// Read plain text file
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            resolve(e.target.result);
        };

        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file, 'UTF-8');
    });
}

// Read Word document content
async function readWordDocument(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (e) {
            try {
                const arrayBuffer = e.target.result;

                // For .docx files, we can use a simple text extraction
                // For production, you'd want to use mammoth.js library
                if (file.name.endsWith('.docx')) {
                    // Simple extraction - just get text content
                    // This is a basic implementation
                    const text = await extractTextFromDocx(arrayBuffer, file.name);
                    resolve(text);
                } else {
                    // .doc files are harder to parse without a library
                    resolve(`[无法解析 .doc 文件: ${file.name}]\n请使用 .docx 格式以获得更好的支持。`);
                }
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsArrayBuffer(file);
    });
}

// DOCX text extraction - uses enhanced parser if available
async function extractTextFromDocx(arrayBuffer, filename) {
    try {
        // Try to use enhanced parser if available
        if (typeof window.extractTextFromDocxEnhanced === 'function') {
            const result = await window.extractTextFromDocxEnhanced(arrayBuffer, filename);
            if (result && !result.includes('[无法从')) {
                return result;
            }
        }

        // Fallback to basic extraction
        const uint8Array = new Uint8Array(arrayBuffer);
        const text = new TextDecoder('utf-8').decode(uint8Array);

        // Try to find text content between XML tags
        // Fixed regex pattern - removed unicode escapes
        const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

        if (matches && matches.length > 0) {
            const extractedText = matches
                .map(match => match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            return extractedText || `[文件 ${filename} 内容为空或无法解析]`;
        }

        return `[无法从 ${filename} 提取文本内容]\n建议：请确保文件是有效的 .docx 格式`;
    } catch (error) {
        return `[解析 ${filename} 时出错: ${error.message}]`;
    }
}

// Get selected separator
function getSeparator() {
    const selectedRadio = document.querySelector('input[name="separatorType"]:checked');
    const separatorType = selectedRadio?.value || 'newline';

    switch (separatorType) {
        case 'newline':
            // 单行空白：先换行，再加一个空行
            return '\n\n';
        case 'double-newline':
            // 双行空白：先换行，再加两个空行
            return '\n\n\n';
        case 'line':
            // 分隔线：先换行，加分隔线，再换行
            return '\n' + '-'.repeat(60) + '\n';
        case 'stars':
            // 星号分隔：先换行，加星号线，再换行
            return '\n' + '*'.repeat(60) + '\n';
        case 'custom':
            const customInput = $('customSeparator');
            let customValue = customInput?.value || '\n';

            // 处理转义字符
            customValue = customValue
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\r/g, '\r');

            // 确保自定义分隔符前面有换行（如果用户没有添加的话）
            if (!customValue.startsWith('\n')) {
                customValue = '\n' + customValue;
            }

            return customValue;
        default:
            return '\n\n';
    }
}

// Merge to TXT
async function mergeToTxt() {
    if (uploadedFiles.length === 0) {
        setMsg('请先选择文件', true);
        return;
    }

    setMsg('正在合并文件...');

    const separator = getSeparator();
    let mergedText = '';

    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];

        try {
            const content = await readFileContent(file);
            mergedText += content;

            // 添加分隔符
            if (i < uploadedFiles.length - 1) {
                mergedText += separator;
            }
        } catch (error) {
            mergedText += `\n[读取文件 ${file.name} 失败: ${error.message}]\n`;
        }
    }

    // Display in preview
    if ($('mergedContent')) {
        $('mergedContent').value = mergedText;
    }

    // Download as TXT file
    downloadTextFile(mergedText, 'merged_documents.txt');

    setMsg('已合并为 TXT 文件');
}

// Merge to Word (generate real DOCX file)
async function mergeToWord() {
    if (uploadedFiles.length === 0) {
        setMsg('请先选择文件', true);
        return;
    }

    setMsg('正在合并文件...');

    const separator = getSeparator();
    let mergedText = '';

    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];

        try {
            const content = await readFileContent(file);
            mergedText += content;

            // 添加分隔符
            if (i < uploadedFiles.length - 1) {
                mergedText += separator;
            }
        } catch (error) {
            mergedText += `\n[读取文件 ${file.name} 失败: ${error.message}]\n`;
        }
    }

    // Display in preview
    if ($('mergedContent')) {
        $('mergedContent').value = mergedText;
    }

    // Create DOCX file
    try {
        const docxBlob = await createDocxFile(mergedText);
        downloadBlob(docxBlob, 'merged_documents.docx');
        setMsg('已合并为 Word 文档 (DOCX 格式)');
    } catch (error) {
        console.error('DOCX creation error:', error);
        // Fallback to RTF if DOCX creation fails
        const rtfContent = createSimpleRTF(mergedText);
        downloadTextFile(rtfContent, 'merged_documents.rtf', 'application/rtf');
        setMsg('已合并为 Word 文档 (RTF 格式)');
    }
}

// Create a simple RTF document
function createSimpleRTF(text) {
    // Basic RTF header
    let rtf = '{\\rtf1\\ansi\\deff0\n';
    rtf += '{\\fonttbl{\\f0 Arial;}}\n';
    rtf += '\\f0\\fs24\n';

    // Convert text to RTF format
    const rtfText = text
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/\n/g, '\\par\n');

    rtf += rtfText;
    rtf += '\n}';

    return rtf;
}

// Download text file
function downloadTextFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Message function (reuse from popup.js if available)
function setMsg(text, isErr = false) {
    const el = $('msg');
    if (!el) {
        console.log(text);
        return;
    }

    if (!text) {
        el.style.opacity = '0';
        el.style.transform = 'translateX(400px)';
        return;
    }

    el.textContent = text;
    el.style.color = '#ffffff';
    el.style.backgroundColor = isErr ? '#ff3b30' : '#34c759';
    el.style.padding = '12px 20px';
    el.style.borderRadius = '10px';
    el.style.fontWeight = '500';
    el.style.opacity = '1';
    el.style.transform = 'translateX(0)';

    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(400px)';
    }, 3000);
}

// Download blob file
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Create a real DOCX file from text
async function createDocxFile(text) {
    // DOCX is a ZIP file containing XML files
    // We'll create a minimal valid DOCX structure

    const files = {
        '[Content_Types].xml': createContentTypesXml(),
        '_rels/.rels': createRelsXml(),
        'word/_rels/document.xml.rels': createDocumentRelsXml(),
        'word/document.xml': createDocumentXml(text)
    };

    // Create ZIP file manually
    const zipBlob = await createZipBlob(files);
    return zipBlob;
}

// Create [Content_Types].xml
function createContentTypesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
}

// Create _rels/.rels
function createRelsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

// Create word/_rels/document.xml.rels
function createDocumentRelsXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
}

// Create word/document.xml with text content
function createDocumentXml(text) {
    // Split text into paragraphs
    const paragraphs = text.split('\n');

    let paragraphsXml = '';
    for (const para of paragraphs) {
        if (para.trim()) {
            // Escape XML special characters
            const escapedText = escapeXml(para);
            paragraphsXml += `
        <w:p>
            <w:r>
                <w:t xml:space="preserve">${escapedText}</w:t>
            </w:r>
        </w:p>`;
        } else {
            // Empty paragraph
            paragraphsXml += `
        <w:p/>`;
        }
    }

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>${paragraphsXml}
    </w:body>
</w:document>`;
}

// Escape XML special characters
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Create ZIP blob from files object
async function createZipBlob(files) {
    // Simple ZIP file creation
    // For production, use JSZip library
    // For now, we'll use a workaround with base64 encoding

    // Since creating a proper ZIP file requires complex binary operations,
    // we'll use the Blob API with a simple structure

    // Check if we can use CompressionStream
    if (typeof CompressionStream === 'undefined') {
        throw new Error('CompressionStream not supported');
    }

    // For simplicity, we'll create an uncompressed ZIP
    const zipParts = [];
    const centralDirectory = [];
    let offset = 0;

    const fileEntries = Object.entries(files);

    for (const [path, content] of fileEntries) {
        const contentBytes = new TextEncoder().encode(content);
        const pathBytes = new TextEncoder().encode(path);

        // Local file header
        const localHeader = new Uint8Array(30 + pathBytes.length);
        const view = new DataView(localHeader.buffer);

        // Local file header signature
        view.setUint32(0, 0x04034b50, true);
        // Version needed to extract
        view.setUint16(4, 20, true);
        // General purpose bit flag
        view.setUint16(6, 0, true);
        // Compression method (0 = stored)
        view.setUint16(8, 0, true);
        // File last modification time
        view.setUint16(10, 0, true);
        // File last modification date
        view.setUint16(12, 0, true);
        // CRC-32
        view.setUint32(14, 0, true);
        // Compressed size
        view.setUint32(18, contentBytes.length, true);
        // Uncompressed size
        view.setUint32(22, contentBytes.length, true);
        // File name length
        view.setUint16(26, pathBytes.length, true);
        // Extra field length
        view.setUint16(28, 0, true);

        // Copy path
        localHeader.set(pathBytes, 30);

        zipParts.push(localHeader);
        zipParts.push(contentBytes);

        // Central directory entry
        const centralHeader = new Uint8Array(46 + pathBytes.length);
        const centralView = new DataView(centralHeader.buffer);

        // Central file header signature
        centralView.setUint32(0, 0x02014b50, true);
        // Version made by
        centralView.setUint16(4, 20, true);
        // Version needed to extract
        centralView.setUint16(6, 20, true);
        // General purpose bit flag
        centralView.setUint16(8, 0, true);
        // Compression method
        centralView.setUint16(10, 0, true);
        // File last modification time
        centralView.setUint16(12, 0, true);
        // File last modification date
        centralView.setUint16(14, 0, true);
        // CRC-32
        centralView.setUint32(16, 0, true);
        // Compressed size
        centralView.setUint32(20, contentBytes.length, true);
        // Uncompressed size
        centralView.setUint32(24, contentBytes.length, true);
        // File name length
        centralView.setUint16(28, pathBytes.length, true);
        // Extra field length
        centralView.setUint16(30, 0, true);
        // File comment length
        centralView.setUint16(32, 0, true);
        // Disk number start
        centralView.setUint16(34, 0, true);
        // Internal file attributes
        centralView.setUint16(36, 0, true);
        // External file attributes
        centralView.setUint32(38, 0, true);
        // Relative offset of local header
        centralView.setUint32(42, offset, true);

        // Copy path
        centralHeader.set(pathBytes, 46);

        centralDirectory.push(centralHeader);

        offset += localHeader.length + contentBytes.length;
    }

    // Combine central directory
    const centralDirSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);

    // End of central directory record
    const endOfCentralDir = new Uint8Array(22);
    const endView = new DataView(endOfCentralDir.buffer);

    // End of central dir signature
    endView.setUint32(0, 0x06054b50, true);
    // Number of this disk
    endView.setUint16(4, 0, true);
    // Disk where central directory starts
    endView.setUint16(6, 0, true);
    // Number of central directory records on this disk
    endView.setUint16(8, fileEntries.length, true);
    // Total number of central directory records
    endView.setUint16(10, fileEntries.length, true);
    // Size of central directory
    endView.setUint32(12, centralDirSize, true);
    // Offset of start of central directory
    endView.setUint32(16, offset, true);
    // Comment length
    endView.setUint16(20, 0, true);

    // Combine all parts
    const allParts = [...zipParts, ...centralDirectory, endOfCentralDir];

    return new Blob(allParts, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/* =========================
 * docx-parser.js - Enhanced DOCX Parser
 * ========================= */

// Enhanced DOCX text extraction using proper ZIP parsing
async function extractTextFromDocxEnhanced(arrayBuffer, filename) {
    try {
        const zipData = new Uint8Array(arrayBuffer);

        // Extract document.xml from the DOCX ZIP archive
        const documentXml = await extractFileFromZip(zipData, 'word/document.xml');

        if (!documentXml) {
            // Fallback to basic extraction
            return extractTextBasic(zipData, filename);
        }

        // Parse XML and extract text
        const text = extractTextFromXml(documentXml);

        return text || `[文件 ${filename} 内容为空]`;
    } catch (error) {
        console.error('DOCX extraction error:', error);
        // Fallback to basic extraction
        return extractTextBasic(new Uint8Array(arrayBuffer), filename);
    }
}

// Basic fallback extraction
function extractTextBasic(uint8Array, filename) {
    try {
        const text = new TextDecoder('utf-8').decode(uint8Array);
        const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

        if (matches && matches.length > 0) {
            return matches
                .map(match => match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        return `[无法从 ${filename} 提取文本内容]`;
    } catch (error) {
        return `[解析 ${filename} 时出错: ${error.message}]`;
    }
}

// Extract a file from ZIP archive
async function extractFileFromZip(zipData, targetPath) {
    try {
        let offset = 0;
        const dataView = new DataView(zipData.buffer);

        while (offset < zipData.length - 30) {
            // Check for local file header signature (0x04034b50)
            const signature = dataView.getUint32(offset, true);

            if (signature === 0x04034b50) {
                const compressionMethod = dataView.getUint16(offset + 8, true);
                const compressedSize = dataView.getUint32(offset + 18, true);
                const uncompressedSize = dataView.getUint32(offset + 22, true);
                const fileNameLength = dataView.getUint16(offset + 26, true);
                const extraFieldLength = dataView.getUint16(offset + 28, true);

                // Get filename
                const fileNameStart = offset + 30;
                const fileName = new TextDecoder().decode(
                    zipData.slice(fileNameStart, fileNameStart + fileNameLength)
                );

                // Check if this is the file we're looking for
                if (fileName === targetPath) {
                    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
                    const compressedData = zipData.slice(dataStart, dataStart + compressedSize);

                    // If stored (no compression), return directly
                    if (compressionMethod === 0) {
                        return new TextDecoder().decode(compressedData);
                    }

                    // If deflated (compression method 8)
                    if (compressionMethod === 8) {
                        try {
                            // Use the inflateData function if available
                            if (typeof window.inflateData === 'function') {
                                const inflated = await window.inflateData(compressedData);
                                if (inflated) {
                                    return new TextDecoder().decode(inflated);
                                }
                            }

                            // Fallback: try pako if available
                            if (typeof pako !== 'undefined') {
                                const inflated = pako.inflate(compressedData);
                                return new TextDecoder().decode(inflated);
                            }
                        } catch (e) {
                            console.error('Decompression error:', e);
                        }
                    }
                }

                // Move to next file
                offset += 30 + fileNameLength + extraFieldLength + compressedSize;
            } else {
                offset++;
            }
        }

        return null;
    } catch (error) {
        console.error('ZIP extraction error:', error);
        return null;
    }
}

// Extract text from Word XML
function extractTextFromXml(xml) {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, 'text/xml');

        // Check for parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            return extractTextWithRegex(xml);
        }

        // Get all text nodes
        const textNodes = xmlDoc.getElementsByTagName('w:t');
        const paragraphs = [];
        let currentParagraph = [];
        let lastParent = null;

        // Extract text preserving paragraph structure
        for (let i = 0; i < textNodes.length; i++) {
            const textNode = textNodes[i];
            const textContent = textNode.textContent;

            // Find parent paragraph
            let parent = textNode.parentElement;
            while (parent && parent.tagName !== 'w:p') {
                parent = parent.parentElement;
            }

            // New paragraph detected
            if (parent !== lastParent && currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(''));
                currentParagraph = [];
            }

            currentParagraph.push(textContent);
            lastParent = parent;
        }

        // Add last paragraph
        if (currentParagraph.length > 0) {
            paragraphs.push(currentParagraph.join(''));
        }

        const result = paragraphs.join('\n').trim();
        return result || extractTextWithRegex(xml);
    } catch (error) {
        console.error('XML parsing error:', error);
        return extractTextWithRegex(xml);
    }
}

// Fallback regex-based text extraction
function extractTextWithRegex(xml) {
    const matches = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);

    if (matches && matches.length > 0) {
        return matches
            .map(match => match.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return '';
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.extractTextFromDocxEnhanced = extractTextFromDocxEnhanced;
}

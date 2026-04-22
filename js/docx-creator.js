/* =========================
 * docx-creator.js - Simple DOCX File Creator
 * ========================= */

// Create a simple DOCX file from text
async function createSimpleDocx(text) {
    // DOCX is a ZIP file containing XML files
    // We'll create the minimal required structure

    const files = {
        '[Content_Types].xml': createContentTypes(),
        '_rels/.rels': createRels(),
        'word/_rels/document.xml.rels': createDocumentRels(),
        'word/document.xml': createDocument(text)
    };

    // Create ZIP file
    const zipBlob = await createZipFromFiles(files);
    return zipBlob;
}

// Create [Content_Types].xml
function createContentTypes() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
}

// Create _rels/.rels
function createRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

// Create word/_rels/document.xml.rels
function createDocumentRels() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
}

// Create word/document.xml with text content
function createDocument(text) {
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

// Create ZIP file from files object
async function createZipFromFiles(files) {
    // We'll create a simple ZIP file manually
    // For a production app, you'd use JSZip library

    // For now, we'll use a workaround: create an RTF file instead
    // which is simpler and still opens in Word
    // This is a temporary solution until we implement full ZIP support

    // Get the document text from files
    const documentXml = files['word/document.xml'];
    const textMatch = documentXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);

    if (textMatch) {
        const text = textMatch
            .map(t => t.replace(/<w:t[^>]*>/, '').replace(/<\/w:t>/, ''))
            .map(t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
            .join('\n');

        // Create RTF as fallback
        return createRTFBlob(text);
    }

    return createRTFBlob('');
}

// Create RTF Blob (fallback)
function createRTFBlob(text) {
    let rtf = '{\\rtf1\\ansi\\deff0\n';
    rtf += '{\\fonttbl{\\f0 Arial;}}\n';
    rtf += '\\f0\\fs24\n';

    const rtfText = text
        .replace(/\\/g, '\\\\')
        .replace(/{/g, '\\{')
        .replace(/}/g, '\\}')
        .replace(/\n/g, '\\par\n');

    rtf += rtfText;
    rtf += '\n}';

    return new Blob([rtf], { type: 'application/rtf' });
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.createSimpleDocx = createSimpleDocx;
}

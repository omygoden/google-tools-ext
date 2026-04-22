/* =========================
 * inflate.js - Simple DEFLATE decompression
 * Minimal implementation for DOCX ZIP files
 * ========================= */

// Simplified DEFLATE decompression using browser's built-in capabilities
async function inflateData(compressedData) {
    try {
        // Method 1: Try DecompressionStream (modern browsers)
        if (typeof DecompressionStream !== 'undefined') {
            try {
                // Create a blob from the compressed data
                const blob = new Blob([compressedData]);
                const ds = new DecompressionStream('deflate-raw');
                const decompressedStream = blob.stream().pipeThrough(ds);
                const decompressedBlob = await new Response(decompressedStream).blob();
                const arrayBuffer = await decompressedBlob.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            } catch (e) {
                console.warn('DecompressionStream failed:', e);
            }
        }

        // Method 2: Try with 'deflate' instead of 'deflate-raw'
        if (typeof DecompressionStream !== 'undefined') {
            try {
                const blob = new Blob([compressedData]);
                const ds = new DecompressionStream('deflate');
                const decompressedStream = blob.stream().pipeThrough(ds);
                const decompressedBlob = await new Response(decompressedStream).blob();
                const arrayBuffer = await decompressedBlob.arrayBuffer();
                return new Uint8Array(arrayBuffer);
            } catch (e) {
                console.warn('DecompressionStream (deflate) failed:', e);
            }
        }

        // If all methods fail, return null
        return null;
    } catch (error) {
        console.error('Decompression error:', error);
        return null;
    }
}

// Make function available globally
if (typeof window !== 'undefined') {
    window.inflateData = inflateData;
}

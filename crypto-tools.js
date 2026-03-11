/* ===== Crypto Tools Functions ===== */

// MD5 Implementation (Minimal)
function md5(string) {
    function k(n) { return Math.sin(n) * 4294967296 | 0; }
    var b, c, d, j, a = [1732584193, -271733879, -1732584194, 271733878],
        g = [
            [0, 7, 12, 17, 22], [1, 5, 9, 14, 20], [5, 4, 11, 16, 23], [0, 6, 10, 15, 21]
        ];
    string = unescape(encodeURIComponent(string));
    var n = string.length,
        l = [(n << 3) & 0xffffffff, (n / 0x20000000) & 0xffffffff],
        i, m = [0x80],
        f = ((n + 8) >> 6) + 1;
    for (i = 0; i < n; i++) m[i >> 2] |= string.charCodeAt(i) << ((i % 4) << 3);
    m[f * 16 - 2] = l[0];
    m[f * 16 - 1] = l[1];
    for (i = 0; i < f; i++) {
        var o = a.slice(0),
            p = m.slice(i * 16, i * 16 + 16);
        for (j = 0; j < 64; j++) {
            var h = j >> 4,
                e = g[h],
                q = (j < 16) ? j : (j < 32) ? (5 * j + 1) % 16 : (j < 48) ? (3 * j + 5) % 16 : (7 * j) % 16;
            var t = a[3];
            a[3] = a[2];
            a[2] = a[1];
            a[1] = (a[1] + ((b = (h < 1) ? (a[1] & a[2]) | (~a[1] & a[3]) : (h < 2) ? (a[1] & a[3]) | (a[2] & ~a[3]) : (h < 3) ? a[1] ^ a[2] ^ a[3] : a[2] ^ (a[1] | ~a[3])) + (p[q] + (k(j + 1) + a[0])))) << e[(j % 4) + 1] | (a[1] + (b + (p[q] + (k(j + 1) + a[0])))) >>> (32 - e[(j % 4) + 1]);
            a[0] = t;
        }
        for (j = 0; j < 4; j++) a[j] += o[j];
    }
    for (i = 0, string = ""; i < 32; i++) string += ((a[i >> 3] >> ((i % 8) << 2)) & 15).toString(16);
    return string;
}

// Subtle Crypto Hashing (SHA1, SHA256)
async function hashSubtle(algo, message) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Base64 Encode
function handleBase64Encode() {
    try {
        const input = ($("cryptoInput")?.value || "").trim();
        if (!input) {
            setMsg("请输入文本", true);
            return;
        }
        const encoded = btoa(unescape(encodeURIComponent(input)));
        if ($("cryptoOutput")) $("cryptoOutput").value = encoded;
        setMsg("Base64 编码完成");
    } catch (e) {
        setMsg("编码失败: " + e.message, true);
    }
}

// Base64 Decode
function handleBase64Decode() {
    try {
        const input = ($("cryptoInput")?.value || "").trim();
        if (!input) {
            setMsg("请输入 Base64 文本", true);
            return;
        }
        const decoded = decodeURIComponent(escape(atob(input)));
        if ($("cryptoOutput")) $("cryptoOutput").value = decoded;
        setMsg("Base64 解码完成");
    } catch (e) {
        setMsg("解码失败，请检查输入是否为有效的 Base64", true);
    }
}

// MD5 Handle
function handleMd5() {
    const input = ($("cryptoInput")?.value || "").trim();
    if (!input) { setMsg("请输入文本", true); return; }
    if ($("cryptoOutput")) $("cryptoOutput").value = md5(input);
    setMsg("MD5 计算完成");
}

// SHA Handle
async function handleSha(algo) {
    const input = ($("cryptoInput")?.value || "").trim();
    if (!input) { setMsg("请输入文本", true); return; }
    try {
        const val = await hashSubtle(algo, input);
        if ($("cryptoOutput")) $("cryptoOutput").value = val;
        setMsg(`${algo} 计算完成`);
    } catch (e) {
        setMsg(`${algo} 计算失败`, true);
    }
}

// Hex Encode
function handleHexEncode() {
    try {
        const input = ($("cryptoInput")?.value || "").trim();
        if (!input) { setMsg("请输入文本", true); return; }
        const encoder = new TextEncoder();
        const bytes = encoder.encode(input);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
        if ($("cryptoOutput")) $("cryptoOutput").value = hex;
        setMsg("Hex 编码完成");
    } catch (e) {
        setMsg("Hex 编码失败", true);
    }
}

// Hex Decode
function handleHexDecode() {
    try {
        const input = ($("cryptoInput")?.value || "").trim().replace(/\s/g, '');
        if (!input) { setMsg("请输入 Hex 文本", true); return; }
        if (input.length % 2 !== 0) throw new Error("无效的 Hex 长度");
        const bytes = new Uint8Array(input.length / 2);
        for (let i = 0; i < input.length; i += 2) {
            bytes[i / 2] = parseInt(input.substr(i, 2), 16);
        }
        const decoder = new TextDecoder();
        if ($("cryptoOutput")) $("cryptoOutput").value = decoder.decode(bytes);
        setMsg("Hex 解码完成");
    } catch (e) {
        setMsg("Hex 解码失败: " + e.message, true);
    }
}

// Unicode Encode
function handleUnicodeEncode() {
    const input = ($("cryptoInput")?.value || "");
    if (!input) { setMsg("请输入文本", true); return; }
    const out = input.split('').map(c => {
        const code = c.charCodeAt(0).toString(16).toUpperCase();
        return "\\u" + "0000".substring(0, 4 - code.length) + code;
    }).join('');
    if ($("cryptoOutput")) $("cryptoOutput").value = out;
    setMsg("Unicode 编码完成");
}

// Unicode Decode
function handleUnicodeDecode() {
    const input = ($("cryptoInput")?.value || "");
    if (!input) { setMsg("请输入 Unicode 文本", true); return; }
    try {
        const out = input.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
            return String.fromCharCode(parseInt(grp, 16));
        });
        if ($("cryptoOutput")) $("cryptoOutput").value = out;
        setMsg("Unicode 解码完成");
    } catch (e) {
        setMsg("Unicode 解码失败", true);
    }
}

// Clear Crypto
function handleCryptoClear() {
    if ($("cryptoInput")) $("cryptoInput").value = "";
    if ($("cryptoOutput")) $("cryptoOutput").value = "";
    setMsg("已清空");
}

// Copy Crypto
async function handleCryptoCopy() {
    const val = $("cryptoOutput")?.value || "";
    if (!val) { setMsg("没有可复制的内容", true); return; }
    await copyText(val); // copyText is global in popup.js
    setMsg("已复制到剪贴板");
}

// Initialize
function initCryptoTools() {
    $("btnBase64Encode")?.addEventListener("click", handleBase64Encode);
    $("btnBase64Decode")?.addEventListener("click", handleBase64Decode);
    $("btnHexEncode")?.addEventListener("click", handleHexEncode);
    $("btnHexDecode")?.addEventListener("click", handleHexDecode);
    $("btnUnicodeEncode")?.addEventListener("click", handleUnicodeEncode);
    $("btnUnicodeDecode")?.addEventListener("click", handleUnicodeDecode);
    $("btnMd5")?.addEventListener("click", handleMd5);
    $("btnSha1")?.addEventListener("click", () => handleSha('SHA-1'));
    $("btnSha256")?.addEventListener("click", () => handleSha('SHA-256'));
    $("btnSha512")?.addEventListener("click", () => handleSha('SHA-512'));
    $("btnCryptoClear")?.addEventListener("click", handleCryptoClear);
    $("btnCryptoCopy")?.addEventListener("click", handleCryptoCopy);
}

document.addEventListener('DOMContentLoaded', initCryptoTools);

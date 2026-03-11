/* ===== URL Tools Functions ===== */

// Store parsed URL data
let currentUrlData = {
    baseUrl: '',
    params: new Map()
};

// URL Encode
function handleUrlEncode() {
    try {
        const input = ($("urlInput")?.value || "").trim();
        if (!input) {
            setMsg("请输入需要编码的文本", true);
            return;
        }

        const encoded = encodeURIComponent(input);
        if ($("urlOutput")) $("urlOutput").value = encoded;
        setMsg("URL 已编码");
    } catch (e) {
        setMsg(String(e?.message || e), true);
    }
}

// URL Decode
function handleUrlDecode() {
    try {
        const input = ($("urlInput")?.value || "").trim();
        if (!input) {
            setMsg("请输入需要解码的文本", true);
            return;
        }

        const decoded = decodeURIComponent(input);
        if ($("urlOutput")) $("urlOutput").value = decoded;
        setMsg("URL 已解码");
    } catch (e) {
        setMsg("解码失败，请检查输入是否为有效的URL编码", true);
    }
}

// Parse URL Parameters
function handleUrlParse() {
    try {
        const input = ($("urlInput")?.value || "").trim();
        if (!input) {
            setMsg("请输入URL", true);
            return;
        }

        // Parse URL
        let url;
        try {
            url = new URL(input);
        } catch {
            // If not a full URL, try to parse as query string
            if (input.includes('?') || input.includes('=')) {
                url = new URL("http://example.com?" + (input.startsWith('?') ? input.substring(1) : input));
            } else {
                setMsg("无效的 URL 格式", true);
                return;
            }
        }

        // Store base URL
        currentUrlData.baseUrl = url.origin !== 'null' && url.origin !== 'http://example.com' ? url.origin + url.pathname : url.pathname;
        if (currentUrlData.baseUrl === 'http://example.com/') currentUrlData.baseUrl = '';

        currentUrlData.params.clear();

        // Parse parameters
        const params = url.searchParams;
        const paramsObj = {};

        params.forEach((value, key) => {
            currentUrlData.params.set(key, value);
            paramsObj[key] = value;
        });

        // Display in output as a summary or full URL if it's a full URL
        if ($("urlOutput")) {
            $("urlOutput").value = input;
        }

        // Render params table
        renderUrlParamsTable();

        // Show params section
        const section = $("urlParamsSection");
        if (section) section.style.display = 'block';

        // Update JSON input
        if ($("urlParamsJson")) {
            $("urlParamsJson").value = JSON.stringify(paramsObj, null, 2);
        }

        setMsg(`已解析 ${currentUrlData.params.size} 个参数`);
    } catch (e) {
        setMsg(String(e?.message || e), true);
    }
}

// Render URL Parameters Table
function renderUrlParamsTable() {
    const tbody = $("urlParamsBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    currentUrlData.params.forEach((value, key) => {
        addUrlParamRow(key, value);
    });
}

// Add Parameter Row
function addUrlParamRow(key = "", value = "") {
    const tbody = $("urlParamsBody");
    if (!tbody) return;

    const tr = document.createElement("tr");

    // Key input
    const td1 = document.createElement("td");
    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.value = key;
    keyInput.placeholder = "Key";
    td1.appendChild(keyInput);

    // Value input
    const td2 = document.createElement("td");
    const valueInput = document.createElement("input");
    valueInput.type = "text";
    valueInput.value = value;
    valueInput.placeholder = "Value";
    td2.appendChild(valueInput);

    // Delete button
    const td3 = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "×";
    deleteBtn.className = "small-btn";
    deleteBtn.style.background = "#ff3b30";
    deleteBtn.style.color = "white";
    deleteBtn.style.padding = "2px 8px";
    deleteBtn.onclick = () => {
        tr.remove();
        syncParamsToJson();
    };
    td3.appendChild(deleteBtn);

    // Sync back on change
    [keyInput, valueInput].forEach(el => {
        el.oninput = () => {
            // No need to sync to JSON anymore
        };
    });

    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);
}

// Build URL from parameters
function handleBuildUrl() {
    try {
        const tbody = $("urlParamsBody");
        if (!tbody) return;

        const rows = tbody.querySelectorAll("tr");
        const params = new URLSearchParams();

        rows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            const key = inputs[0].value.trim();
            const value = inputs[1].value.trim();
            if (key) {
                params.append(key, value);
            }
        });

        let baseUrl = currentUrlData.baseUrl || ($("urlInput")?.value || "").split('?')[0] || "http://example.com";
        const queryString = params.toString();

        if (queryString) {
            baseUrl = baseUrl.includes('?') ? baseUrl.split('?')[0] : baseUrl;
            baseUrl += "?" + queryString;
        }

        if ($("urlOutput")) {
            $("urlOutput").value = baseUrl;
        }

        setMsg("URL 已重新构建");
    } catch (e) {
        setMsg(String(e?.message || e), true);
    }
}

// Copy URL Output
async function handleUrlCopy() {
    const output = $("urlOutput")?.value || "";
    if (!output) {
        setMsg("没有可复制的内容", true);
        return;
    }
    await copyText(output);
    setMsg("已复制到剪贴板");
}

// Clear URL inputs
function handleUrlClear() {
    if ($("urlInput")) $("urlInput").value = "";
    if ($("urlOutput")) $("urlOutput").value = "";

    const section = $("urlParamsSection");
    if (section) section.style.display = 'none';

    currentUrlData.baseUrl = '';
    currentUrlData.params.clear();

    const tbody = $("urlParamsBody");
    if (tbody) tbody.innerHTML = "";

    setMsg("已清空");
}

// Initialize URL Tools
function initUrlTools() {
    $("btnUrlEncode")?.addEventListener("click", handleUrlEncode);
    $("btnUrlDecode")?.addEventListener("click", handleUrlDecode);
    $("btnUrlParse")?.addEventListener("click", handleUrlParse);
    $("btnUrlCopy")?.addEventListener("click", handleUrlCopy);
    $("btnUrlClear")?.addEventListener("click", handleUrlClear);
    $("urlInput")?.addEventListener("input", debounce(() => {
        const val = ($("urlInput").value || "").trim();
        if (val.startsWith('http') || val.includes('?')) {
            handleUrlParse();
        }
    }, 500));
    $("btnAddParam")?.addEventListener("click", () => {
        const section = $("urlParamsSection");
        if (section) section.style.display = 'block';
        addUrlParamRow();
    });
    $("btnBuildUrl")?.addEventListener("click", handleBuildUrl);
}

// Initialize when library is loaded
initUrlTools();

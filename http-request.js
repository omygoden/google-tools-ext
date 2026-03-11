/* ===== HTTP Request Functions ===== */

const httpRequestState = {
    method: 'POST',
    url: '',
    params: [],
    headers: [
        { key: 'Content-Type', value: 'application/json', enabled: true }
    ],
    bodyType: 'json',
    bodyJson: '{}',
    bodyForm: [],
    bodyText: '',
    viewModes: {
        params: 'kv',
        headers: 'kv'
    }
};

function initHttpRequest() {
    // Method & URL
    $("httpMethod")?.addEventListener("change", (e) => httpRequestState.method = e.target.value);

    // Bi-directional sync for URL and Params
    const urlInput = $("httpUrl");
    if (urlInput) {
        urlInput.addEventListener("input", (e) => {
            httpRequestState.url = e.target.value;
            syncUrlToParams();
        });
    }

    $("btnHttpSyncUrlToParams")?.addEventListener("click", syncUrlToParams);

    // Send logic
    $("btnSendRequest")?.addEventListener("click", handleSendRequest);

    // Body Type logic
    document.querySelectorAll('input[name="httpBodyType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            httpRequestState.bodyType = e.target.value;
            updateBodyUI();
        });
    });

    // Row management
    $("btnHttpAddParam")?.addEventListener("click", () => addHttpRow('params'));
    $("btnHttpAddHeader")?.addEventListener("click", () => addHttpRow('headers'));
    $("btnHttpAddForm")?.addEventListener("click", () => addHttpRow('bodyForm'));

    // Toggle view modes (KV vs JSON)
    document.querySelectorAll('.btn-req-toggle-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.type;
            toggleHttpViewMode(type);
        });
    });

    // Sub-tab switching (Request config)
    document.querySelectorAll('[data-req-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.dataset.reqTab;
            // UI Update
            document.querySelectorAll('[data-req-tab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.req-panel').forEach(p => p.classList.remove('active'));
            const targetPanel = $(`req-tab-${tabId}`);
            if (targetPanel) targetPanel.classList.add('active');

            // Re-render to ensure correctness
            if (tabId === 'params') renderHttpTable('params');
            if (tabId === 'headers') renderHttpTable('headers');
            if (tabId === 'body' && httpRequestState.bodyType === 'form') renderHttpTable('bodyForm');
        });
    });

    // Response tab switching
    document.querySelectorAll('[data-res-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = e.target.dataset.resTab;
            document.querySelectorAll('[data-res-tab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.res-panel').forEach(p => p.classList.remove('active'));
            const targetPanel = $(`res-tab-${tabId}`);
            if (targetPanel) targetPanel.classList.add('active');
        });
    });

    // Form Import
    $("btnHttpFormImportJson")?.addEventListener("click", handleHttpFormImportJson);

    // Copy response
    $("btnHttpResCopy")?.addEventListener("click", async () => {
        const val = $("httpResBody").value;
        if (val) {
            await copyText(val);
            setMsg("响应已复制");
        }
    });

    // Expand/Shrink Request Config Area
    $("btnExpandRequest")?.addEventListener("click", () => adjustHttpSectionSize('request', 'expand'));
    $("btnShrinkRequest")?.addEventListener("click", () => adjustHttpSectionSize('request', 'shrink'));

    // Expand/Shrink Response Area
    $("btnExpandResponse")?.addEventListener("click", () => adjustHttpSectionSize('response', 'expand'));
    $("btnShrinkResponse")?.addEventListener("click", () => adjustHttpSectionSize('response', 'shrink'));

    // Initial rows
    if (httpRequestState.params.length === 0) addHttpRow('params', false);
    renderHttpTable('headers');
    updateBodyUI();
}

function syncUrlToParams() {
    const rawUrl = ($("httpUrl")?.value || "").trim();
    if (!rawUrl) return;

    try {
        let url;
        if (rawUrl.startsWith('http')) {
            url = new URL(rawUrl);
        } else {
            url = new URL("http://temp.com/" + rawUrl);
        }

        const newParams = [];
        url.searchParams.forEach((v, k) => {
            newParams.push({ key: k, value: v, enabled: true });
        });

        if (newParams.length > 0) {
            httpRequestState.params = newParams;
            renderHttpTable('params');
        }
    } catch (e) {
        // Ignore parsing errors for partial URLs
    }
}

function syncParamsToUrl() {
    const rawUrl = ($("httpUrl")?.value || "").trim();
    if (!rawUrl) return;

    try {
        let baseUrl = rawUrl.split('?')[0];
        const searchParams = new URLSearchParams();

        httpRequestState.params.forEach(p => {
            if (p.key) searchParams.append(p.key, p.value);
        });

        const qs = searchParams.toString();
        const finalUrl = baseUrl + (qs ? "?" + qs : "");

        const urlInput = $("httpUrl");
        if (urlInput && urlInput.value !== finalUrl) {
            urlInput.value = finalUrl;
            httpRequestState.url = finalUrl;
        }
    } catch (e) { }
}

function updateBodyUI() {
    const types = ['none', 'json', 'form', 'text'];
    types.forEach(t => {
        const el = $(`httpBody${t.charAt(0).toUpperCase() + t.slice(1)}`);
        if (el) el.style.display = (httpRequestState.bodyType === t) ? (t === 'form' ? 'flex' : 'block') : 'none';
    });

    // Auto set header if JSON
    if (httpRequestState.bodyType === 'json') {
        ensureHeader('Content-Type', 'application/json');
    } else if (httpRequestState.bodyType === 'form' || httpRequestState.bodyType === 'none') {
        // For FormData, the browser must set the Content-Type with boundary
        // For 'none', no content type needed usually
        removeHeader('Content-Type');
    }
}

function removeHeader(key) {
    const oldLen = httpRequestState.headers.length;
    httpRequestState.headers = httpRequestState.headers.filter(h => h.key.toLowerCase() !== key.toLowerCase());
    if (httpRequestState.headers.length !== oldLen) {
        renderHttpTable('headers');
        syncHttpToInternal('headers');
    }
}

function ensureHeader(key, value) {
    const existing = httpRequestState.headers.find(h => h.key.toLowerCase() === key.toLowerCase());
    if (existing) {
        existing.value = value;
    } else {
        httpRequestState.headers.push({ key, value, enabled: true });
    }
    renderHttpTable('headers');
}

function addHttpRow(type, render = true) {
    const item = { key: '', value: '', enabled: true };
    if (type === 'params') httpRequestState.params.push(item);
    else if (type === 'headers') httpRequestState.headers.push(item);
    else if (type === 'bodyForm') httpRequestState.bodyForm.push(item);
    if (render) renderHttpTable(type);
}

function renderHttpTable(type) {
    const list = type === 'params' ? httpRequestState.params : (type === 'headers' ? httpRequestState.headers : httpRequestState.bodyForm);
    const tbodyId = type === 'params' ? 'httpParamsBody' : (type === 'headers' ? 'httpHeadersBody' : 'httpBodyFormBody');
    const tbody = $(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = '';
    list.forEach((item, index) => {
        const tr = document.createElement('tr');

        const tdKey = document.createElement('td');
        const inputKey = document.createElement('input');
        inputKey.value = item.key;
        inputKey.placeholder = 'Key';
        inputKey.oninput = (e) => {
            item.key = e.target.value;
            if (type === 'params') syncParamsToUrl();
            syncHttpToInternal(type);
        };
        tdKey.appendChild(inputKey);

        const tdVal = document.createElement('td');
        const inputVal = document.createElement('input');
        inputVal.value = item.value;
        inputVal.placeholder = 'Value';
        inputVal.oninput = (e) => {
            item.value = e.target.value;
            if (type === 'params') syncParamsToUrl();
            syncHttpToInternal(type);
        };
        tdVal.appendChild(inputVal);

        const tdActions = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '×';
        delBtn.className = 'small-btn';
        delBtn.style.background = '#ff3b30';
        delBtn.style.color = 'white';
        delBtn.onclick = () => {
            list.splice(index, 1);
            if (type === 'params') syncParamsToUrl();
            renderHttpTable(type);
            syncHttpToInternal(type);
        };
        tdActions.appendChild(delBtn);

        tr.appendChild(tdKey);
        tr.appendChild(tdVal);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

function syncHttpToInternal(type) {
    if (type === 'params' || type === 'headers') {
        const list = type === 'params' ? httpRequestState.params : httpRequestState.headers;
        const obj = {};
        list.forEach(i => { if (i.key) obj[i.key] = i.value; });
        const jsonId = type === 'params' ? 'httpParamsJson' : 'httpHeadersJson';
        const el = $(jsonId);
        if (el) el.value = JSON.stringify(obj, null, 2);
    }
}

function toggleHttpViewMode(type) {
    const current = httpRequestState.viewModes[type];
    const next = current === 'kv' ? 'json' : 'kv';
    httpRequestState.viewModes[type] = next;

    const panel = $(`req-tab-${type}`);
    if (!panel) return;
    const kvView = panel.querySelector('.view-kv');
    const jsonView = panel.querySelector('.view-json');
    const btn = panel.querySelector('.btn-req-toggle-view');

    if (next === 'json') {
        if (kvView) kvView.style.display = 'none';
        if (jsonView) jsonView.style.display = 'block';
        if (btn) btn.textContent = 'KV 模式';
        syncHttpToInternal(type);
    } else {
        if (kvView) kvView.style.display = 'block';
        if (jsonView) jsonView.style.display = 'none';
        if (btn) btn.textContent = 'JSON 模式';
        try {
            const el = $(type === 'params' ? 'httpParamsJson' : 'httpHeadersJson');
            const obj = JSON.parse(el.value || '{}');
            const newList = [];
            for (const [k, v] of Object.entries(obj)) {
                newList.push({ key: k, value: String(v), enabled: true });
            }
            if (type === 'params') httpRequestState.params = newList;
            else httpRequestState.headers = newList;
            renderHttpTable(type);
        } catch (e) { }
    }
}

function handleHttpFormImportJson() {
    try {
        const jsonStr = $("httpBodyFormJson").value;
        const obj = JSON.parse(jsonStr);
        httpRequestState.bodyForm = [];
        for (const [k, v] of Object.entries(obj)) {
            httpRequestState.bodyForm.push({ key: k, value: String(v), enabled: true });
        }
        renderHttpTable('bodyForm');
        setMsg("Form 参数已导入");
    } catch (e) {
        setMsg("JSON 错误: " + e.message, true);
    }
}

async function handleSendRequest() {
    const urlStr = ($("httpUrl")?.value || "").trim();
    if (!urlStr) {
        setMsg("请输入 URL", true);
        return;
    }

    setMsg("正在发送请求...");
    const btn = $("btnSendRequest");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "发送中...";
    }
    const statusEl = $("httpResponseStatus");
    if (statusEl) {
        statusEl.textContent = "PENDING";
        statusEl.className = "warning";
    }
    if ($("httpResBody")) $("httpResBody").value = "";
    if ($("httpResHeadersBody")) $("httpResHeadersBody").innerHTML = "";

    try {
        let finalUrl = urlStr;
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;

        const urlObj = new URL(finalUrl);
        // Table params take precedence if they exist
        if (httpRequestState.params.some(p => p.key)) {
            httpRequestState.params.forEach(p => {
                if (p.key) urlObj.searchParams.set(p.key, p.value);
            });
            finalUrl = urlObj.toString();
        }

        const headersObj = {};
        const forbiddenHeaders = ['host', 'origin', 'referer', 'cookie', 'date', 'dnt', 'expect', 'connection', 'keep-alive', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'via'];

        httpRequestState.headers.forEach(h => {
            if (h.key) {
                const keyLower = h.key.toLowerCase();
                if (forbiddenHeaders.includes(keyLower)) {
                    console.warn(`Header '${h.key}' is forbidden and may be ignored by the browser.`);
                }
                headersObj[h.key] = h.value;
            }
        });

        let body = null;
        if (httpRequestState.method !== 'GET' && httpRequestState.method !== 'HEAD') {
            if (httpRequestState.bodyType === 'json') {
                body = $("httpBodyJsonText").value;
            } else if (httpRequestState.bodyType === 'form') {
                // Background proxy works better with JSON for form data if possible, 
                // but let's try to handle it. FormData is hard to serialize for sendMessage.
                // For simplicity in the proxy, we'll convert form-data to URLSearchParams style for body if it's simple
                const params = new URLSearchParams();
                httpRequestState.bodyForm.forEach(f => {
                    if (f.key) params.append(f.key, f.value);
                });
                body = params.toString();
                if (!headersObj['Content-Type']) {
                    headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
                }
            } else if (httpRequestState.bodyType === 'text') {
                body = $("httpBodyTextValue").value;
            }
        }

        const startTime = Date.now();

        // Check if chrome.runtime is available
        if (!chrome || !chrome.runtime) {
            console.error("Chrome runtime is not available");
            setMsg("Chrome 扩展运行时不可用，请重新加载扩展", true);
            if (btn) {
                btn.disabled = false;
                btn.textContent = "发送";
            }
            if (statusEl) {
                statusEl.textContent = "ERROR";
                statusEl.className = "error";
            }
            return;
        }

        console.log("[HTTP Request] Sending request via background proxy:", {
            url: finalUrl,
            method: httpRequestState.method,
            headers: headersObj,
            bodyLength: body ? body.length : 0
        });

        // Use background proxy to bypass CORS/permission issues in foreground
        chrome.runtime.sendMessage({
            type: 'PROXY_REQUEST',
            payload: {
                url: finalUrl,
                method: httpRequestState.method,
                headers: headersObj,
                body: body
            }
        }, (response) => {
            // Check for chrome.runtime.lastError to catch issues with sendMessage itself
            if (chrome.runtime.lastError) {
                console.error("chrome.runtime.sendMessage error:", chrome.runtime.lastError.message);
                setMsg("请求发送失败: " + chrome.runtime.lastError.message + " (请尝试重新加载扩展)", true);
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "发送";
                }
                if (statusEl) {
                    statusEl.textContent = "ERROR";
                    statusEl.className = "error";
                }
                if ($("httpResBody")) {
                    $("httpResBody").value = "错误详情:\n" + chrome.runtime.lastError.message +
                        "\n\n可能的解决方案:\n1. 在 chrome://extensions 页面重新加载此扩展\n2. 检查扩展的权限设置\n3. 查看浏览器控制台的详细错误信息";
                }
                return;
            }

            console.log("[HTTP Request] Received response:", response);

            const duration = Date.now() - startTime;

            if (btn) {
                btn.disabled = false;
                btn.textContent = "发送";
            }

            if (!response || response.success === false) {
                const errorText = response ? response.error : "背景脚本无法返回响应";
                console.error("Proxy error:", response);
                let errorMsg = errorText;
                if (errorMsg === "Failed to fetch") {
                    errorMsg = "请求失败: 网络错误或 CORS 跨域被阻止。请确保 URL 正确并在浏览器插件设置中允许访问该网站。";
                } else {
                    errorMsg = "请求失败: " + errorMsg;
                }
                setMsg(errorMsg, true);
                if (statusEl) {
                    statusEl.textContent = "ERROR";
                    statusEl.className = "error";
                }
                if ($("httpResBody")) $("httpResBody").value = errorText + "\n\n(提示: 某些本地请求可能被 Chrome 限制，请尝试启用 'Allow access to file URLs' 或检查跨域设置)";
                return;
            }

            const statusText = `${response.status} ${response.statusText} (${duration}ms)`;
            if (statusEl) {
                statusEl.textContent = statusText;
                statusEl.className = response.ok ? 'success' : 'error';
            }

            const resHeadersBody = $("httpResHeadersBody");
            if (resHeadersBody && response.headers) {
                Object.entries(response.headers).forEach(([k, v]) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td style="font-weight:600; width:120px;">${k}</td><td>${v}</td>`;
                    resHeadersBody.appendChild(tr);
                });
            }

            if ($("httpResBody")) {
                const data = response.data;
                $("httpResBody").value = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
            }

            setMsg("请求成功");
        });

    } catch (e) {
        console.error("Request Prep failed:", e);
        setMsg("请求准备失败: " + e.message, true);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "发送";
        }
    }
}

/**
 * Adjust the size of HTTP request/response sections
 * @param {string} section - 'request' or 'response'
 * @param {string} action - 'expand' or 'shrink'
 */
function adjustHttpSectionSize(section, action) {
    const requestConfig = $("httpRequestConfig");
    const responseSection = $("httpResponseSection");

    if (!requestConfig || !responseSection) return;

    // Get current flex values
    const requestFlex = parseFloat(getComputedStyle(requestConfig).flex) || 2.2;
    const responseFlex = parseFloat(getComputedStyle(responseSection).flex) || 1;

    const step = 0.5; // Adjustment step
    const minFlex = 0.5; // Minimum flex value
    const maxFlex = 6; // Maximum flex value

    let newRequestFlex = requestFlex;
    let newResponseFlex = responseFlex;

    if (section === 'request') {
        if (action === 'expand') {
            newRequestFlex = Math.min(requestFlex + step, maxFlex);
            // Optionally shrink response to maintain balance
            newResponseFlex = Math.max(responseFlex - step * 0.5, minFlex);
        } else if (action === 'shrink') {
            newRequestFlex = Math.max(requestFlex - step, minFlex);
            // Optionally expand response to maintain balance
            newResponseFlex = Math.min(responseFlex + step * 0.5, maxFlex);
        }
    } else if (section === 'response') {
        if (action === 'expand') {
            newResponseFlex = Math.min(responseFlex + step, maxFlex);
            // Optionally shrink request to maintain balance
            newRequestFlex = Math.max(requestFlex - step * 0.5, minFlex);
        } else if (action === 'shrink') {
            newResponseFlex = Math.max(responseFlex - step, minFlex);
            // Optionally expand request to maintain balance
            newRequestFlex = Math.min(requestFlex + step * 0.5, maxFlex);
        }
    }

    // Apply new flex values
    requestConfig.style.flex = newRequestFlex;
    responseSection.style.flex = newResponseFlex;

    // Visual feedback
    const sectionName = section === 'request' ? '请求配置' : '响应结果';
    const actionName = action === 'expand' ? '放大' : '缩小';
    setMsg(`${sectionName}区域已${actionName}`);
}

// Initialize
initHttpRequest();

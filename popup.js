/* =========================
 * popup.js (works for popup.html and app.html)
 * ========================= */

const STORAGE_KEY = "sqlTypeMappingV1";
const STORAGE_TAGS_SQL = "tagTemplatesSqlV1";
const STORAGE_TAGS_JSON = "tagTemplatesJsonV1";

const DEFAULT_SQL_TAGS = 'json:"{name}" gorm:"column:{name}"';
const DEFAULT_JSON_TAGS = 'json:"{name}"';

function $(id) {
  return document.getElementById(id);
}

let msgTimeout = null;
let msgHideTimeout = null;

function setMsg(text, isErr = false) {
  const el = $("msg");
  if (!el) return;

  if (msgTimeout) clearTimeout(msgTimeout);
  if (msgHideTimeout) clearTimeout(msgHideTimeout);

  if (!text) {
    el.style.opacity = "0";
    el.style.transform = "translateX(400px)";
    return;
  }

  el.textContent = text;
  el.style.color = "#ffffff";
  el.style.backgroundColor = isErr ? "#ff3b30" : "#34c759";
  el.style.padding = "12px 20px";
  el.style.borderRadius = "10px";
  el.style.fontWeight = "500";
  el.style.opacity = "1";
  el.style.transform = "translateX(0)";

  // Auto hide after 3 seconds
  msgTimeout = setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(400px)";
    msgHideTimeout = setTimeout(() => {
      el.style.backgroundColor = "transparent";
      el.style.padding = "0";
    }, 300);
  }, 3000);
}

function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/* ===== Main Tabs (Go Struct vs JSON Format) ===== */
function setupMainTabs() {
  document.querySelectorAll(".main-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".main-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const mainTab = btn.dataset.mainTab;
      document.querySelectorAll(".main-panel").forEach((p) => p.classList.remove("active"));
      const panel = document.getElementById(`main-tab-${mainTab}`);
      if (panel) panel.classList.add("active");

      setMsg("");

      // Trigger appropriate initialization when switching to a tab
      if (mainTab === "go-struct") {
        // Re-trigger the active sub-tab
        const activeSubTab = document.querySelector(".tab.active");
        if (activeSubTab) {
          const tab = activeSubTab.dataset.tab;
          if (tab === "sql") setTimeout(window.autoSqlConvert, 0);
          if (tab === "json") setTimeout(window.autoJsonConvert, 0);
          if (tab === "map") setTimeout(renderMappingTable, 0);
        }
      } else if (mainTab === "json-format") {
        setTimeout(window.autoJsonFormat, 0);
      }
    });
  });
}

/* ===== Mapping storage ===== */
async function getMapping() {
  const res = await chrome.storage.local.get([STORAGE_KEY]);
  const saved = res[STORAGE_KEY];
  const base = defaultMapping(); // from converter.js
  if (saved && typeof saved === "object") {
    return { merged: { ...base, ...saved }, user: saved };
  }
  return { merged: base, user: {} };
}

async function saveUserMapping(userMap) {
  await chrome.storage.local.set({ [STORAGE_KEY]: userMap || {} });
}

async function resetUserMapping() {
  await chrome.storage.local.remove([STORAGE_KEY]);
}

/* ===== Tag templates storage (with defaults) ===== */
async function getTagTemplates() {
  const r = await chrome.storage.local.get([STORAGE_TAGS_SQL, STORAGE_TAGS_JSON]);

  let sqlTags = (r[STORAGE_TAGS_SQL] || "").trim();
  let jsonTags = (r[STORAGE_TAGS_JSON] || "").trim();

  if (!sqlTags) {
    sqlTags = DEFAULT_SQL_TAGS;
    await chrome.storage.local.set({ [STORAGE_TAGS_SQL]: sqlTags });
  }
  if (!jsonTags) {
    jsonTags = DEFAULT_JSON_TAGS;
    await chrome.storage.local.set({ [STORAGE_TAGS_JSON]: jsonTags });
  }
  return { sqlTags, jsonTags };
}

/* ===== Sub Tabs (SQL/JSON/Map) ===== */
function setupTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.dataset.tab;
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      const panel = document.getElementById(`tab-${tab}`);
      if (panel) panel.classList.add("active");

      setMsg("");
      // 切换时触发一次自动转换/刷新映射
      if (tab === "sql") setTimeout(window.autoSqlConvert, 0);
      if (tab === "json") setTimeout(window.autoJsonConvert, 0);
      if (tab === "map") setTimeout(renderMappingTable, 0);
    });
  });
}

/* ===== Copy ===== */
async function copyText(text) {
  if (!text) return;
  await navigator.clipboard.writeText(text);
}

/* ===== SQL: track input changes and reset struct name =====
 * 规则:当 SQL 输入发生实质性变化时(不同的表名或表结构),重置 Struct 名
 */
let lastSqlInputHash = '';

function getSqlStructureHash(sqlText) {
  try {
    // 提取表名作为主要标识
    const tableName = extractTableName(sqlText); // from converter.js
    if (!tableName) return sqlText.substring(0, 50);
    
    // 提取字段列表作为结构标识
    const fields = parseCreateTableFields(sqlText); // from converter.js
    const fieldNames = fields.map(f => f.name).sort().join(',');
    
    return tableName + '|' + fieldNames;
  } catch {
    return sqlText.substring(0, 50);
  }
}

function resetSqlStructNameIfChanged() {
  const sqlEl = $("sqlText");
  const nameEl = $("sqlStructName");
  if (!sqlEl || !nameEl) return;

  const sqlText = (sqlEl.value || "").trim();
  if (!sqlText) {
    lastSqlInputHash = '';
    return;
  }

  const currentHash = getSqlStructureHash(sqlText);
  
  // 如果表结构发生变化,重置 Struct 名
  if (currentHash !== lastSqlInputHash) {
    const currentName = (nameEl.value || "").trim();
    // 只有当 Struct 名是默认值或之前自动生成的值时才重置
    if (!currentName || currentName === "AutoGenerated" || lastSqlInputHash) {
      // 尝试从表名生成新的 Struct 名
      const tableName = extractTableName(sqlText);
      if (tableName) {
        nameEl.value = toCamelExported(tableName); // from converter.js
      } else {
        nameEl.value = "AutoGenerated";
      }
    }
  }
  
  lastSqlInputHash = currentHash;
}

/* ===== JSON: track input changes and reset struct name =====
 * 规则:当 JSON 输入发生实质性变化时(不同的 JSON 结构),重置 Struct 名为 AutoGenerated
 */
let lastJsonInputHash = '';

function getJsonStructureHash(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    // 使用 JSON 的 key 结构作为哈希,忽略值的变化
    const getKeys = (obj) => {
      if (Array.isArray(obj)) {
        return obj.length > 0 ? ['[' + getKeys(obj[0]) + ']'] : ['[]'];
      } else if (obj && typeof obj === 'object') {
        return Object.keys(obj).sort().map(k => k + ':' + getKeys(obj[k])).join(',');
      }
      return typeof obj;
    };
    return getKeys(parsed);
  } catch {
    return jsonText.substring(0, 50); // 解析失败时用前50个字符
  }
}

function resetJsonStructNameIfChanged() {
  const jsonEl = $("jsonText");
  const nameEl = $("jsonStructName");
  if (!jsonEl || !nameEl) return;

  const jsonText = (jsonEl.value || "").trim();
  if (!jsonText) {
    lastJsonInputHash = '';
    return;
  }

  const currentHash = getJsonStructureHash(jsonText);
  
  // 如果结构发生变化(或首次输入),重置 Struct 名
  if (currentHash !== lastJsonInputHash) {
    // 只有当 Struct 名是默认值或之前自动生成的值时才重置
    const currentName = (nameEl.value || "").trim();
    if (!currentName || currentName === "AutoGenerated" || lastJsonInputHash) {
      nameEl.value = "AutoGenerated";
    }
  }
  
  lastJsonInputHash = currentHash;
}

/* ===== Custom tags storage ===== */
// Expose to window for access from custom-tags-modal.js
window.sqlCustomTagsList = [];
window.jsonCustomTagsList = [];
window.currentCustomTagsMode = 'sql'; // 'sql' or 'json'

/* ===== Build tag string from checkboxes ===== */
function buildSqlTagString() {
  const tags = [];
  const checkboxes = document.querySelectorAll('.sql-tag-checkbox:checked');

  checkboxes.forEach(cb => {
    const tagName = cb.value;
    if (tagName === 'json') {
      tags.push('json:"{name}"');
    } else if (tagName === 'gorm') {
      tags.push('gorm:"column:{name}"');
    } else if (tagName === 'xml') {
      tags.push('xml:"{name}"');
    } else if (tagName === 'db') {
      tags.push('db:"{name}"');
    } else if (tagName === 'form') {
      tags.push('form:"{name}"');
    } else if (tagName === 'xorm') {
      tags.push('xorm:"{name}"');
    } else if (tagName === 'mapstructure') {
      tags.push('mapstructure:"{name}"');
    }
  });

  // Add custom tags (auto-generate template from tag names)
  if (window.sqlCustomTagsList && window.sqlCustomTagsList.length > 0) {
    window.sqlCustomTagsList.forEach(tagName => {
      tags.push(`${tagName}:"{name}"`);
    });
  }

  return tags.join(' ');
}

function buildJsonTagString() {
  const tags = [];
  const checkboxes = document.querySelectorAll('.json-tag-checkbox:checked');

  let hasJson = false;
  let hasOmitempty = false;

  checkboxes.forEach(cb => {
    const tagName = cb.value;
    if (tagName === 'json') {
      hasJson = true;
    } else if (tagName === 'omitempty') {
      hasOmitempty = true;
    } else if (tagName === 'mapstructure') {
      tags.push('mapstructure:"{name}"');
    } else if (tagName === 'yaml') {
      tags.push('yaml:"{name}"');
    }
  });

  // Handle json with optional omitempty
  if (hasJson) {
    if (hasOmitempty) {
      tags.unshift('json:"{name},omitempty"');
    } else {
      tags.unshift('json:"{name}"');
    }
  }

  // Add custom tags (auto-generate template from tag names)
  if (window.jsonCustomTagsList && window.jsonCustomTagsList.length > 0) {
    window.jsonCustomTagsList.forEach(tagName => {
      tags.push(`${tagName}:"{name}"`);
    });
  }

  return tags.join(' ');
}

/* ===== Core convert handlers (manual + auto share same) ===== */
async function handleSqlConvert(silent = false) {
  try {
    const sqlText = ($("sqlText")?.value || "").trim();
    if (!sqlText) {
      if ($("sqlOut")) $("sqlOut").value = "";
      if (!silent) setMsg("");
      return;
    }

    resetSqlStructNameIfChanged();

    const { merged } = await getMapping();

    const structName = ($("sqlStructName")?.value || "AutoGenerated").trim() || "AutoGenerated";
    const tagText = buildSqlTagString() || DEFAULT_SQL_TAGS;

    const code = convertSqlToGoStruct(sqlText, structName, tagText, merged); // from converter.js
    if ($("sqlOut")) $("sqlOut").value = code;

    if (!silent) setMsg("SQL 已更新");
  } catch (e) {
    // 自动模式下不刷屏：只有非 silent 才显示错误
    if (!silent) setMsg(String(e?.message || e), true);
  }
}

async function handleJsonConvert(silent = false) {
  try {
    const jsonText = ($("jsonText")?.value || "").trim();
    if (!jsonText) {
      if ($("jsonOut")) $("jsonOut").value = "";
      if (!silent) setMsg("");
      return;
    }

    const structName = ($("jsonStructName")?.value || "AutoGenerated").trim() || "AutoGenerated";
    const tagText = buildJsonTagString() || DEFAULT_JSON_TAGS;

    const code = convertJsonToGoStruct(jsonText, structName, tagText); // from converter.js
    if ($("jsonOut")) $("jsonOut").value = code;

    if (!silent) setMsg("JSON 已更新");
  } catch (e) {
    if (!silent) setMsg(String(e?.message || e), true);
  }
}

/* ===== Auto convert (debounced) =====
 * 自动转换用 silent=true：避免输入一半时疯狂报错
 * Expose to window for access from custom-tags-modal.js
 */
window.autoSqlConvert = debounce(() => handleSqlConvert(true), 250);
window.autoJsonConvert = debounce(() => handleJsonConvert(true), 250);

/* ===== Mapping UI ===== */
function addMapRow(sqlType = "", goType = "") {
  const tbody = $("mapBody");
  if (!tbody) return;

  const tr = document.createElement("tr");

  const td1 = document.createElement("td");
  const in1 = document.createElement("input");
  in1.value = sqlType;
  in1.placeholder = "例如 varchar";
  td1.appendChild(in1);

  const td2 = document.createElement("td");
  const in2 = document.createElement("input");
  in2.value = goType;
  in2.placeholder = "例如 string";
  td2.appendChild(in2);

  const td3 = document.createElement("td");
  const btn = document.createElement("button");
  btn.textContent = "删除";
  btn.className = "small-btn";
  btn.addEventListener("click", () => tr.remove());
  td3.appendChild(btn);

  tr.appendChild(td1);
  tr.appendChild(td2);
  tr.appendChild(td3);
  tbody.appendChild(tr);
}

async function renderMappingTable() {
  const tbody = $("mapBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const { merged } = await getMapping();
  const keys = Object.keys(merged).sort();
  for (const k of keys) addMapRow(k, merged[k]);
  setMsg("映射已加载");
}

async function handleMapSave() {
  try {
    const tbody = $("mapBody");
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll("tr"));
    const userMap = {};
    for (const r of rows) {
      const inputs = r.querySelectorAll("input");
      const k = (inputs[0].value || "").trim().toLowerCase();
      const v = (inputs[1].value || "").trim();
      if (k && v) userMap[k] = v;
    }
    await saveUserMapping(userMap);
    setMsg("映射已保存");
    // 保存后，如果当前在 SQL tab，自动刷新一次结果
    setTimeout(window.autoSqlConvert, 0);
  } catch (e) {
    setMsg(String(e?.message || e), true);
  }
}

async function handleMapReset() {
  await resetUserMapping();
  await renderMappingTable();
  setMsg("已恢复默认映射");
  setTimeout(window.autoSqlConvert, 0);
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", async () => {
  setupMainTabs();
  setupTabs();

  // Note: Tag templates are now handled by checkboxes, no need to load from storage

  // 默认 structName
  if ($("sqlStructName") && !$("sqlStructName").value) $("sqlStructName").value = "AutoGenerated";
  if ($("jsonStructName") && !$("jsonStructName").value) $("jsonStructName").value = "AutoGenerated";

  /* ===== Go Struct Conversion Buttons ===== */
  $("btnSqlConvert")?.addEventListener("click", () => handleSqlConvert(false));
  $("btnJsonConvert")?.addEventListener("click", () => handleJsonConvert(false));

  $("btnSqlCopy")?.addEventListener("click", async () => {
    await copyText($("sqlOut")?.value || "");
    setMsg("已复制 SQL 输出");
  });
  $("btnJsonCopy")?.addEventListener("click", async () => {
    await copyText($("jsonOut")?.value || "");
    setMsg("已复制 JSON 输出");
  });

  $("btnMapAdd")?.addEventListener("click", () => addMapRow("", ""));
  $("btnMapSave")?.addEventListener("click", handleMapSave);
  $("btnMapReset")?.addEventListener("click", handleMapReset);

  /* ===== Auto convert listeners ===== */
  $("sqlText")?.addEventListener("input", window.autoSqlConvert);
  $("sqlText")?.addEventListener("paste", () => setTimeout(window.autoSqlConvert, 0));
  $("sqlStructName")?.addEventListener("input", window.autoSqlConvert);

  // SQL tag checkboxes
  document.querySelectorAll('.sql-tag-checkbox').forEach(cb => {
    cb.addEventListener('change', window.autoSqlConvert);
  });

  $("jsonText")?.addEventListener("input", window.autoJsonConvert);
  $("jsonText")?.addEventListener("paste", () => setTimeout(window.autoJsonConvert, 0));
  $("jsonStructName")?.addEventListener("input", window.autoJsonConvert);

  // JSON tag checkboxes
  document.querySelectorAll('.json-tag-checkbox').forEach(cb => {
    cb.addEventListener('change', window.autoJsonConvert);
  });

  // JSON 输入变化时,检测结构变化并重置 Struct 名
  $("jsonText")?.addEventListener("input", debounce(resetJsonStructNameIfChanged, 200));
  $("jsonText")?.addEventListener("paste", () => setTimeout(resetJsonStructNameIfChanged, 0));

  // SQL 输入变化时，若 structName 还是默认，自动填表名驼峰
  $("sqlText")?.addEventListener("input", debounce(resetSqlStructNameIfChanged, 200));
  $("sqlText")?.addEventListener("paste", () => setTimeout(resetSqlStructNameIfChanged, 0));

  /* ===== JSON Formatter Buttons ===== */
  $("btnJsonFormat")?.addEventListener("click", () => handleJsonFormat(false));
  $("btnJsonMinify")?.addEventListener("click", handleJsonMinify);
  $("btnJsonToYaml")?.addEventListener("click", handleJsonToYaml);
  $("btnJsonFormatCopy")?.addEventListener("click", async () => {
    await copyText($("jsonFormatOutput")?.value || "");
    setMsg("已复制格式化输出");
  });
  $("btnJsonFormatClear")?.addEventListener("click", () => {
    if ($("jsonFormatInput")) {
      $("jsonFormatInput").value = "";
      updateLineNumbers($("jsonFormatInput"), $("jsonFormatInputLines"));
    }
    if ($("jsonFormatOutput")) {
      $("jsonFormatOutput").value = "";
      updateLineNumbers($("jsonFormatOutput"), $("jsonFormatOutputLines"));
    }
    setMsg("已清空");
  });

  /* ===== JSON Formatter Auto-format listeners ===== */
  $("jsonFormatInput")?.addEventListener("input", window.autoJsonFormat);
  $("jsonFormatInput")?.addEventListener("paste", () => setTimeout(window.autoJsonFormat, 0));
  $("jsonSortKeys")?.addEventListener("change", window.autoJsonFormat);
  $("jsonIndent")?.addEventListener("input", window.autoJsonFormat);

  // 首次打开：若输入框已有内容，自动转一次
  setTimeout(() => {
    window.autoSqlConvert();
    window.autoJsonConvert();
    window.autoJsonFormat();
  }, 0);

  setMsg("Ready");
});

/* ===== JSON Formatter Functions ===== */
function sortObjectKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  } else if (obj !== null && typeof obj === "object") {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => {
      sorted[key] = sortObjectKeys(obj[key]);
    });
    return sorted;
  }
  return obj;
}

/* ===== Reduce one layer of escaping in string values for output ===== */
function unescapeStringValues(obj, indent = 2, currentIndent = 0) {
  const spaces = ' '.repeat(currentIndent);
  const nextSpaces = ' '.repeat(currentIndent + indent);

  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();

  if (typeof obj === 'string') {
    // For string values, manually escape special characters
    // This gives us one less layer of escaping compared to JSON.stringify
    const escaped = obj
      .replace(/\\/g, '\\\\')     // Escape backslashes first
      .replace(/"/g, '\\"')       // Escape quotes
      .replace(/\n/g, '\\n')      // Escape newlines
      .replace(/\r/g, '\\r')      // Escape carriage returns
      .replace(/\t/g, '\\t')      // Escape tabs
      .replace(/\f/g, '\\f')      // Escape form feeds
      .replace(/\b/g, '\\b');     // Escape backspaces
    return `"${escaped}"`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(item => nextSpaces + unescapeStringValues(item, indent, currentIndent + indent));
    return '[\n' + items.join(',\n') + '\n' + spaces + ']';
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys.map(key => {
      const value = unescapeStringValues(obj[key], indent, currentIndent + indent);
      return `${nextSpaces}${JSON.stringify(key)}: ${value}`;
    });
    return '{\n' + items.join(',\n') + '\n' + spaces + '}';
  }

  return JSON.stringify(obj);
}



async function handleJsonFormat(silent = false) {
  const outputEl = $("jsonFormatOutput");
  const outputWrapper = outputEl?.parentElement;

  try {
    let input = ($("jsonFormatInput")?.value || "").trim();
    if (!input) {
      if (outputEl) {
        outputEl.value = "";
        // Remove loading indicator if exists
        const loadingEl = outputWrapper?.querySelector('.json-loading');
        if (loadingEl) loadingEl.remove();
      }
      if (!silent) setMsg("");
      return;
    }

    // Show loading indicator for large inputs
    if (input.length > 10000) {
      showJsonLoading(outputWrapper);
      // Use setTimeout to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Sanitize input: remove BOM and other invisible characters
    input = input.replace(/^\uFEFF/, ''); // Remove BOM
    input = input.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width spaces

    // Try to unescape the input if it contains backslash-escaped quotes
    // This handles cases like: [{\"tag\":\"137\"}] -> [{"tag":"137"}]
    let wasUnescaped = false;
    let unescapedInput = input;

    // Check if input contains escaped quotes
    if (input.includes('\\"')) {
      try {
        // Replace \" with " TWICE to handle nested escaping
        // Example: [{\"data\":\"{\\\"key\\\":\\\"value\\\"}\"}]
        // After 1st: [{"data":"{\\\"key\\\":\\\"value\"}"}]  <- Still invalid
        // After 2nd: [{"data":"{\"key\":\"value\"}"}]  <- Valid! data is a string
        unescapedInput = input.replace(/\\"/g, '"');
        unescapedInput = unescapedInput.replace(/\\"/g, '"');

        // Try to parse the unescaped version
        JSON.parse(unescapedInput);
        // If successful, use the unescaped version
        input = unescapedInput;
        wasUnescaped = true;
      } catch (e) {
        // If unescaping breaks it, keep the original
        wasUnescaped = false;
      }
    }

    // Try to parse directly first
    let parsed;

    try {
      parsed = JSON.parse(input);
      // Successfully parsed - no need to unescape inner values
    } catch (firstError) {
      // If parsing fails, try to detect and unescape JSON
      // Check if the input looks like an escaped JSON string
      if (input.startsWith('"') && input.endsWith('"')) {
        try {
          // Remove outer quotes and parse as a string to unescape
          const unescaped = JSON.parse(input);
          // Now try to parse the unescaped content as JSON
          parsed = JSON.parse(unescaped);
          // Don't recursively unescape - keep inner string values as-is
          wasUnescaped = true;
          // Update the input field with the unescaped version
          if ($("jsonFormatInput")) {
            $("jsonFormatInput").value = JSON.stringify(parsed);
            updateLineNumbers($("jsonFormatInput"), $("jsonFormatInputLines"));
          }
        } catch (secondError) {
          // If still fails, show detailed error with context
          const errorMsg = firstError.message;
          const posMatch = errorMsg.match(/position (\d+)/);
          let contextMsg = errorMsg;

          if (posMatch) {
            const pos = parseInt(posMatch[1]);
            const start = Math.max(0, pos - 20);
            const end = Math.min(input.length, pos + 20);
            const context = input.substring(start, end);
            const pointer = ' '.repeat(Math.min(20, pos - start)) + '^';
            contextMsg = `JSON 格式错误: ${errorMsg}\n\n出错位置附近:\n${context}\n${pointer}`;
          } else {
            contextMsg = `JSON 格式错误: ${errorMsg}`;
          }

          throw new Error(contextMsg);
        }
      } else {
        // Not an escaped string, show detailed error with context
        const errorMsg = firstError.message;
        const posMatch = errorMsg.match(/position (\d+)/);
        let contextMsg = errorMsg;

        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          const start = Math.max(0, pos - 20);
          const end = Math.min(input.length, pos + 20);
          const context = input.substring(start, end);
          const pointer = ' '.repeat(Math.min(20, pos - start)) + '^';
          contextMsg = `JSON 格式错误: ${errorMsg}\n\n出错位置附近:\n${context}\n${pointer}`;
        } else {
          contextMsg = `JSON 格式错误: ${errorMsg}`;
        }

        throw new Error(contextMsg);
      }
    }

    const sortKeys = $("jsonSortKeys")?.checked || false;
    if (sortKeys) {
      parsed = sortObjectKeys(parsed);
    }

    const indent = parseInt($("jsonIndent")?.value || "2", 10);
    const formatted = JSON.stringify(parsed, null, indent);

    // Remove loading indicator
    hideJsonLoading(outputWrapper);

    if (outputEl) {
      outputEl.value = formatted;
      outputEl.style.color = ''; // Reset color
      // Update line numbers
      updateLineNumbers(outputEl, $("jsonFormatOutputLines"));
      // Make JSON values clickable
      makeJsonClickable(outputEl);
    }
    if (!silent) {
      if (wasUnescaped) {
        setMsg("JSON 已格式化（已自动移除转义符）");
      } else {
        setMsg("JSON 已格式化");
      }
    }
  } catch (e) {
    // Remove loading indicator
    hideJsonLoading(outputWrapper);

    // Show error in output box
    if (outputEl) {
      const errorMessage = String(e?.message || e);
      outputEl.value = `❌ 格式化失败\n\n${errorMessage}`;
      outputEl.style.color = '#ff3b30'; // Red color for error

      // Remove clickable wrapper if exists
      const wrapper = outputEl.nextElementSibling;
      if (wrapper && wrapper.classList.contains('json-clickable-wrapper')) {
        wrapper.remove();
        outputEl.style.display = '';
      }
      updateLineNumbers(outputEl, $("jsonFormatOutputLines"));
    }
    if (!silent) setMsg(String(e?.message || e), true);
  }
}

async function handleJsonMinify() {
  try {
    const output = $("jsonFormatOutput");
    if (!output) return;

    const wrapper = output.nextElementSibling;
    const isCurrentlyMinified = output.style.display !== 'none' && output.value && !wrapper;

    if (isCurrentlyMinified) {
      // Currently showing minified, switch back to formatted
      handleJsonFormat(true);
      setMsg("已切换到格式化视图");
      return;
    }

    // Currently formatted or empty, minify it
    const input = ($("jsonFormatInput")?.value || "").trim();
    if (!input) {
      setMsg("请输入 JSON 数据", true);
      return;
    }

    const parsed = JSON.parse(input);
    const minified = JSON.stringify(parsed);

    // Remove wrapper if exists
    if (wrapper && wrapper.classList.contains('json-clickable-wrapper')) {
      wrapper.remove();
    }
    // Show textarea and set value
    output.style.display = '';
    output.value = minified;
    // Update line numbers
    updateLineNumbers(output, $("jsonFormatOutputLines"));
    setMsg("JSON 已压缩");
  } catch (e) {
    setMsg(`JSON 格式错误: ${e?.message || e}`, true);
  }
}

/* ===== YAML Key Name Transform Helpers ===== */
function yamlKeyToSnakeCase(key) {
  // Split on existing separators or camelCase boundaries
  // e.g. "userName" -> "user_name", "HTTPStatus" -> "http_status", "already_snake" -> "already_snake"
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')   // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // consecutive capitals
    .replace(/[-\s]+/g, '_')                    // spaces/dashes to underscore
    .toLowerCase();
}

function yamlKeyToPascalCase(key) {
  // Split on underscores, dashes, spaces, or camelCase boundaries, then PascalCase join
  // e.g. "user_name" -> "UserName", "userId" -> "UserId", "http_status_code" -> "HttpStatusCode"
  return key
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function getYamlKeyTransform(style) {
  if (style === 'snake_case') return yamlKeyToSnakeCase;
  if (style === 'camelCase') return yamlKeyToPascalCase;
  return (k) => k; // original
}

/* ===== JSON to YAML Conversion ===== */
function jsonToYaml(value, indent = 0, keyTransform = null) {
  const prefix = '  '.repeat(indent);
  const transformKey = keyTransform || ((k) => k);

  if (value === null || value === undefined) {
    return 'null';
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (typeof value === 'string') {
    // Check if string needs quoting
    if (
      value === '' ||
      value === 'true' || value === 'false' ||
      value === 'null' || value === 'yes' || value === 'no' ||
      value === 'on' || value === 'off' ||
      /^[\d.eE+-]+$/.test(value) ||
      value.includes(': ') || value.includes('#') ||
      value.startsWith('- ') || value.startsWith('? ') ||
      value.startsWith('{') || value.startsWith('[') ||
      value.startsWith('"') || value.startsWith("'") ||
      value.startsWith('&') || value.startsWith('*') ||
      value.includes('\n')
    ) {
      // Use double-quoted style, escape special chars
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';

    const lines = [];
    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        // Object items: first key on same line as dash
        const keys = Object.keys(item);
        if (keys.length === 0) {
          lines.push(`${prefix}- {}`);
        } else {
          const firstKey = transformKey(keys[0]);
          const firstVal = jsonToYaml(item[keys[0]], indent + 2, keyTransform);
          if (isSimpleValue(item[keys[0]])) {
            lines.push(`${prefix}- ${firstKey}: ${firstVal}`);
          } else {
            lines.push(`${prefix}- ${firstKey}:`);
            lines.push(firstVal);
          }
          // Remaining keys
          for (let i = 1; i < keys.length; i++) {
            const k = transformKey(keys[i]);
            const v = jsonToYaml(item[keys[i]], indent + 2, keyTransform);
            if (isSimpleValue(item[keys[i]])) {
              lines.push(`${prefix}  ${k}: ${v}`);
            } else {
              lines.push(`${prefix}  ${k}:`);
              lines.push(v);
            }
          }
        }
      } else if (Array.isArray(item)) {
        // Nested array
        lines.push(`${prefix}-`);
        lines.push(jsonToYaml(item, indent + 1, keyTransform));
      } else {
        // Simple value item
        lines.push(`${prefix}- ${jsonToYaml(item, indent + 1, keyTransform)}`);
      }
    }
    return lines.join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '{}';

    const lines = [];
    for (const key of keys) {
      const transformedKey = transformKey(key);
      const val = value[key];
      const yamlVal = jsonToYaml(val, indent + 1, keyTransform);

      if (isSimpleValue(val)) {
        lines.push(`${prefix}${transformedKey}: ${yamlVal}`);
      } else {
        lines.push(`${prefix}${transformedKey}:`);
        lines.push(yamlVal);
      }
    }
    return lines.join('\n');
  }

  return String(value);
}

function isSimpleValue(value) {
  return value === null || value === undefined ||
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function handleJsonToYaml() {
  try {
    const output = $("jsonFormatOutput");
    if (!output) return;

    let input = ($("jsonFormatInput")?.value || "").trim();
    if (!input) {
      setMsg("请输入 JSON 数据", true);
      return;
    }

    // Sanitize
    input = input.replace(/^\uFEFF/, '');
    input = input.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Try unescaping
    if (input.includes('\\"')) {
      try {
        let unescaped = input.replace(/\\"/g, '"').replace(/\\"/g, '"');
        JSON.parse(unescaped);
        input = unescaped;
      } catch (e) { /* keep original */ }
    }

    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      // Try as escaped string
      if (input.startsWith('"') && input.endsWith('"')) {
        const unescaped = JSON.parse(input);
        parsed = JSON.parse(unescaped);
      } else {
        throw e;
      }
    }

    const keyStyle = $("yamlKeyStyle")?.value || 'original';
    const keyTransform = getYamlKeyTransform(keyStyle);
    const yaml = jsonToYaml(parsed, 0, keyTransform);

    // Remove clickable wrapper if exists
    const wrapper = output.nextElementSibling;
    if (wrapper && wrapper.classList.contains('json-clickable-wrapper')) {
      wrapper.remove();
    }
    output.style.display = '';
    output.style.color = '';
    output.value = yaml;
    updateLineNumbers(output, $("jsonFormatOutputLines"));
    setMsg("已转换为 YAML 格式");
  } catch (e) {
    setMsg(`JSON 格式错误: ${e?.message || e}`, true);
  }
}

/* ===== JSON Loading Indicator ===== */
function showJsonLoading(wrapper) {
  if (!wrapper) return;

  // Remove existing loading indicator if any
  hideJsonLoading(wrapper);

  const loadingEl = document.createElement('div');
  loadingEl.className = 'json-loading';
  loadingEl.innerHTML = `
    <div class="json-loading-spinner"></div>
    <div class="json-loading-text">正在格式化...</div>
  `;
  wrapper.appendChild(loadingEl);
}

function hideJsonLoading(wrapper) {
  if (!wrapper) return;
  const loadingEl = wrapper.querySelector('.json-loading');
  if (loadingEl) {
    loadingEl.remove();
  }
}

window.autoJsonFormat = debounce(() => handleJsonFormat(true), 250);

/* ===== Copy Notification ===== */
function showCopyNotification(text) {
  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = `已复制: ${text.length > 30 ? text.substring(0, 30) + '...' : text}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

/* ===== Make JSON Output Clickable ===== */
function makeJsonClickable(textarea) {
  // Use optimized version for better performance
  if (typeof makeJsonClickableOptimized === 'function') {
    makeJsonClickableOptimized(textarea);
    return;
  }

  // Fallback to basic version
  if (!textarea || !textarea.value) return;

  let wrapper = textarea.nextElementSibling;
  if (!wrapper || !wrapper.classList.contains('json-clickable-wrapper')) {
    wrapper = document.createElement('div');
    wrapper.className = 'json-clickable-wrapper';
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
  }

  const jsonText = textarea.value;
  let parsedJson;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (e) {
    wrapper.textContent = jsonText;
    return;
  }

  wrapper.innerHTML = '';
  renderJsonNode(parsedJson, wrapper, '', 0);
}

function renderJsonNode(value, container, key, indent, isLast = true) {
  const line = document.createElement('div');
  line.className = 'json-line';

  // Set indentation using CSS padding
  line.style.paddingLeft = (indent * 20) + 'px';

  if (Array.isArray(value)) {
    // Array
    const hasItems = value.length > 0;

    // Toggle button
    if (hasItems) {
      const toggle = document.createElement('span');
      toggle.className = 'json-toggle expanded';
      toggle.onclick = function () {
        const isExpanded = this.classList.contains('expanded');
        if (isExpanded) {
          // Collapse: hide ALL descendants
          this.classList.remove('expanded');
          this.classList.add('collapsed');

          // Collect all descendants (not just direct children)
          const allDescendants = [];
          let current = line.nextElementSibling;
          const lineId = line.dataset.id;

          // Keep going until we find a line that's not a descendant
          while (current) {
            // Check if this line is a descendant of our line
            let parent = current;
            let isDescendant = false;

            // Walk up the parent chain
            while (parent && parent.dataset.parentId) {
              if (parent.dataset.parentId === lineId) {
                isDescendant = true;
                break;
              }
              // Find the parent line
              let prevSibling = parent.previousElementSibling;
              while (prevSibling && prevSibling.dataset.id !== parent.dataset.parentId) {
                prevSibling = prevSibling.previousElementSibling;
              }
              parent = prevSibling;
            }

            if (isDescendant) {
              allDescendants.push(current);
              current = current.nextElementSibling;
            } else {
              break;
            }
          }

          // Hide all descendants
          allDescendants.forEach(desc => desc.classList.add('json-collapsed'));

          // Show ellipsis
          const ellipsis = line.querySelector('.json-ellipsis');
          if (ellipsis) ellipsis.style.display = 'inline';
        } else {
          // Expand: show ALL descendants and expand them
          this.classList.remove('collapsed');
          this.classList.add('expanded');

          // Collect all descendants
          const allDescendants = [];
          let current = line.nextElementSibling;
          const lineId = line.dataset.id;

          while (current) {
            let parent = current;
            let isDescendant = false;

            while (parent && parent.dataset.parentId) {
              if (parent.dataset.parentId === lineId) {
                isDescendant = true;
                break;
              }
              let prevSibling = parent.previousElementSibling;
              while (prevSibling && prevSibling.dataset.id !== parent.dataset.parentId) {
                prevSibling = prevSibling.previousElementSibling;
              }
              parent = prevSibling;
            }

            if (isDescendant) {
              allDescendants.push(current);
              current = current.nextElementSibling;
            } else {
              break;
            }
          }

          // Show all descendants and expand their toggles
          allDescendants.forEach(desc => {
            desc.classList.remove('json-collapsed');
            const toggle = desc.querySelector('.json-toggle');
            if (toggle) {
              toggle.classList.remove('collapsed');
              toggle.classList.add('expanded');
            }
          });

          // Hide ellipsis
          const ellipsis = line.querySelector('.json-ellipsis');
          if (ellipsis) ellipsis.style.display = 'none';
        }
      };
      line.appendChild(toggle);
    } else {
      // Empty array, add spacing
      const spacer = document.createElement('span');
      spacer.textContent = '  ';
      line.appendChild(spacer);
    }

    // Key (if exists)
    if (key) {
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key-clickable';
      keySpan.textContent = `"${key}"`;
      keySpan.title = '点击复制此键的值';
      keySpan.onclick = async (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        await copyText(valueStr);
        showCopyNotification(valueStr);
      };
      line.appendChild(keySpan);

      const colon = document.createElement('span');
      colon.textContent = ': ';
      line.appendChild(colon);
    }

    // Opening bracket
    const bracket = document.createElement('span');
    bracket.className = 'json-bracket';
    bracket.textContent = '[';
    line.appendChild(bracket);

    // Count badge
    if (hasItems) {
      const count = document.createElement('span');
      count.className = 'json-count';
      count.textContent = `${value.length} item${value.length > 1 ? 's' : ''}`;
      line.appendChild(count);

      // Ellipsis (hidden by default)
      const ellipsis = document.createElement('span');
      ellipsis.className = 'json-ellipsis';
      ellipsis.textContent = '...';
      ellipsis.style.display = 'none';
      line.appendChild(ellipsis);

      // Add action buttons for arrays
      line.classList.add('has-actions');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'json-node-actions';

      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'json-action-btn copy';
      copyBtn.textContent = '复制';
      copyBtn.onclick = async (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        await copyText(valueStr);
        showCopyNotification('已复制数组内容');
      };
      actionsDiv.appendChild(copyBtn);

      // Download button
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'json-action-btn';
      downloadBtn.textContent = '下载';
      downloadBtn.onclick = (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        const blob = new Blob([valueStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `array_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showCopyNotification('已下载数组内容');
      };
      actionsDiv.appendChild(downloadBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'json-action-btn delete';
      deleteBtn.textContent = '删除';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        // Collect all descendants and the closing bracket
        const allDescendants = [];
        let current = line.nextElementSibling;
        const lineId = line.dataset.id;

        while (current) {
          let parent = current;
          let isDescendant = false;

          while (parent && parent.dataset.parentId) {
            if (parent.dataset.parentId === lineId) {
              isDescendant = true;
              break;
            }
            let prevSibling = parent.previousElementSibling;
            while (prevSibling && prevSibling.dataset.id !== parent.dataset.parentId) {
              prevSibling = prevSibling.previousElementSibling;
            }
            parent = prevSibling;
          }

          if (isDescendant) {
            allDescendants.push(current);
            current = current.nextElementSibling;
          } else {
            break;
          }
        }

        // Remove all descendants and the line itself
        allDescendants.forEach(desc => desc.remove());
        line.remove();
        showCopyNotification('已删除数组');
      };
      actionsDiv.appendChild(deleteBtn);

      line.appendChild(actionsDiv);
    }

    container.appendChild(line);

    // Generate unique ID for parent tracking
    const lineId = 'line_' + Math.random().toString(36).substr(2, 9);
    line.dataset.id = lineId;

    // Array items
    value.forEach((item, index) => {
      const childLine = renderJsonNode(item, container, '', indent + 1, index === value.length - 1);
      if (childLine) childLine.dataset.parentId = lineId;
    });

    // Closing bracket
    const closeLine = document.createElement('div');
    closeLine.className = 'json-line';
    closeLine.dataset.parentId = lineId;
    closeLine.style.paddingLeft = (indent * 20) + 'px';
    closeLine.textContent = ']' + (isLast ? '' : ',');
    container.appendChild(closeLine);

    return line;

  } else if (value !== null && typeof value === 'object') {
    // Object
    const keys = Object.keys(value);
    const hasKeys = keys.length > 0;

    // Toggle button
    if (hasKeys) {
      const toggle = document.createElement('span');
      toggle.className = 'json-toggle expanded';
      toggle.onclick = function () {
        const isExpanded = this.classList.contains('expanded');
        if (isExpanded) {
          // Collapse: hide ALL descendants
          this.classList.remove('expanded');
          this.classList.add('collapsed');

          // Collect all descendants
          const allDescendants = [];
          let current = line.nextElementSibling;
          const lineId = line.dataset.id;

          while (current) {
            let parent = current;
            let isDescendant = false;

            while (parent && parent.dataset.parentId) {
              if (parent.dataset.parentId === lineId) {
                isDescendant = true;
                break;
              }
              let prevSibling = parent.previousElementSibling;
              while (prevSibling && prevSibling.dataset.id !== parent.dataset.parentId) {
                prevSibling = prevSibling.previousElementSibling;
              }
              parent = prevSibling;
            }

            if (isDescendant) {
              allDescendants.push(current);
              current = current.nextElementSibling;
            } else {
              break;
            }
          }

          // Hide all descendants
          allDescendants.forEach(desc => desc.classList.add('json-collapsed'));

          // Show ellipsis
          const ellipsis = line.querySelector('.json-ellipsis');
          if (ellipsis) ellipsis.style.display = 'inline';
        } else {
          // Expand: show ALL descendants and expand them
          this.classList.remove('collapsed');
          this.classList.add('expanded');

          // Collect all descendants
          const allDescendants = [];
          let current = line.nextElementSibling;
          const lineId = line.dataset.id;

          while (current) {
            let parent = current;
            let isDescendant = false;

            while (parent && parent.dataset.parentId) {
              if (parent.dataset.parentId === lineId) {
                isDescendant = true;
                break;
              }
              let prevSibling = parent.previousElementSibling;
              while (prevSibling && prevSibling.dataset.id !== parent.dataset.parentId) {
                prevSibling = prevSibling.previousElementSibling;
              }
              parent = prevSibling;
            }

            if (isDescendant) {
              allDescendants.push(current);
              current = current.nextElementSibling;
            } else {
              break;
            }
          }

          // Show all descendants and expand their toggles
          allDescendants.forEach(desc => {
            desc.classList.remove('json-collapsed');
            const toggle = desc.querySelector('.json-toggle');
            if (toggle) {
              toggle.classList.remove('collapsed');
              toggle.classList.add('expanded');
            }
          });

          // Hide ellipsis
          const ellipsis = line.querySelector('.json-ellipsis');
          if (ellipsis) ellipsis.style.display = 'none';
        }
      };
      line.appendChild(toggle);
    } else {
      // Empty object, add spacing
      const spacer = document.createElement('span');
      spacer.textContent = '  ';
      line.appendChild(spacer);
    }

    // Key (if exists)
    if (key) {
      const keySpan = document.createElement('span');
      keySpan.className = 'json-key-clickable';
      keySpan.textContent = `"${key}"`;
      keySpan.title = '点击复制此键的值';
      keySpan.onclick = async (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        await copyText(valueStr);
        showCopyNotification(valueStr);
      };
      line.appendChild(keySpan);

      const colon = document.createElement('span');
      colon.textContent = ': ';
      line.appendChild(colon);
    }

    // Opening brace
    const brace = document.createElement('span');
    brace.className = 'json-brace';
    brace.textContent = '{';
    line.appendChild(brace);

    // Count badge
    if (hasKeys) {
      const count = document.createElement('span');
      count.className = 'json-count';
      count.textContent = `${keys.length} key${keys.length > 1 ? 's' : ''}`;
      line.appendChild(count);

      // Ellipsis (hidden by default)
      const ellipsis = document.createElement('span');
      ellipsis.className = 'json-ellipsis';
      ellipsis.textContent = '...';
      ellipsis.style.display = 'none';
      line.appendChild(ellipsis);

      // Add action buttons for objects
      line.classList.add('has-actions');
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'json-node-actions';

      // Copy button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'json-action-btn copy';
      copyBtn.textContent = '复制';
      copyBtn.onclick = async (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        await copyText(valueStr);
        showCopyNotification('已复制对象内容');
      };
      actionsDiv.appendChild(copyBtn);

      // Download button
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'json-action-btn';
      downloadBtn.textContent = '下载';
      downloadBtn.onclick = (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        const blob = new Blob([valueStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `object_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showCopyNotification('已下载对象内容');
      };
      actionsDiv.appendChild(downloadBtn);

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'json-action-btn delete';
      deleteBtn.textContent = '删除';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        // Collect all descendants and the closing brace
        const allDescendants = [];
        let current = line.nextElementSibling;
        const lineId = line.dataset.id;

        while (current) {
          let parent = current;
          let isDescendant = false;

          while (parent && parent.dataset.parentId) {
            if (parent.dataset.parentId === lineId) {
              isDescendant = true;
              break;
            }
            let prevSibling = parent.previousElementSibling;
            while (prevSibling && prevSibling.dataset.id !== parent.dataset.parentId) {
              prevSibling = prevSibling.previousElementSibling;
            }
            parent = prevSibling;
          }

          if (isDescendant) {
            allDescendants.push(current);
            current = current.nextElementSibling;
          } else {
            break;
          }
        }

        // Remove all descendants and the line itself
        allDescendants.forEach(desc => desc.remove());
        line.remove();
        showCopyNotification('已删除对象');
      };
      actionsDiv.appendChild(deleteBtn);

      line.appendChild(actionsDiv);
    }

    container.appendChild(line);

    // Generate unique ID for parent tracking
    const lineId = 'line_' + Math.random().toString(36).substr(2, 9);
    line.dataset.id = lineId;

    // Object properties
    keys.forEach((k, index) => {
      const childLine = renderJsonNode(value[k], container, k, indent + 1, index === keys.length - 1);
      if (childLine) childLine.dataset.parentId = lineId;
    });

    // Closing brace
    const closeLine = document.createElement('div');
    closeLine.className = 'json-line';
    closeLine.dataset.parentId = lineId;
    closeLine.style.paddingLeft = (indent * 20) + 'px';
    closeLine.textContent = '}' + (isLast ? '' : ',');
    container.appendChild(closeLine);

    return line;

  } else {
    // Primitive value
    // Key
    if (key) {
      const spacer = document.createElement('span');
      spacer.textContent = '  ';
      line.appendChild(spacer);

      const keySpan = document.createElement('span');
      keySpan.className = 'json-key-clickable';
      keySpan.textContent = `"${key}"`;
      keySpan.title = '点击复制此键的值';
      keySpan.onclick = async (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value);
        await copyText(valueStr);
        showCopyNotification(valueStr);
      };
      line.appendChild(keySpan);

      const colon = document.createElement('span');
      colon.textContent = ': ';
      line.appendChild(colon);
    }

    // Value with syntax highlighting
    const valueSpan = document.createElement('span');
    if (typeof value === 'string') {
      valueSpan.className = 'json-string';
      valueSpan.textContent = JSON.stringify(value);
    } else if (typeof value === 'number') {
      valueSpan.className = 'json-number';
      valueSpan.textContent = value;
    } else if (typeof value === 'boolean') {
      valueSpan.className = 'json-boolean';
      valueSpan.textContent = value;
    } else if (value === null) {
      valueSpan.className = 'json-null';
      valueSpan.textContent = 'null';
    }
    line.appendChild(valueSpan);

    if (!isLast) {
      const comma = document.createElement('span');
      comma.textContent = ',';
      line.appendChild(comma);
    }

    container.appendChild(line);
    return line;
  }
}

/* ===== Line Numbers for JSON Format Textareas ===== */
function updateLineNumbers(textarea, lineNumbersDiv) {
  if (!textarea || !lineNumbersDiv) return;

  const lines = textarea.value.split('\n');
  const lineCount = lines.length;

  // Generate line numbers
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  lineNumbersDiv.textContent = lineNumbers;
}

function syncScroll(textarea, lineNumbersDiv) {
  if (!textarea || !lineNumbersDiv) return;
  lineNumbersDiv.scrollTop = textarea.scrollTop;
}

// Initialize line numbers for JSON format textareas
document.addEventListener('DOMContentLoaded', () => {
  const jsonFormatInput = $('jsonFormatInput');
  const jsonFormatInputLines = $('jsonFormatInputLines');
  const jsonFormatOutput = $('jsonFormatOutput');
  const jsonFormatOutputLines = $('jsonFormatOutputLines');

  // Setup input textarea
  if (jsonFormatInput && jsonFormatInputLines) {
    // Update line numbers on input
    jsonFormatInput.addEventListener('input', () => {
      updateLineNumbers(jsonFormatInput, jsonFormatInputLines);
    });

    // Sync scroll
    jsonFormatInput.addEventListener('scroll', () => {
      syncScroll(jsonFormatInput, jsonFormatInputLines);
    });

    // Initial update
    updateLineNumbers(jsonFormatInput, jsonFormatInputLines);
  }

  // Setup output textarea
  if (jsonFormatOutput && jsonFormatOutputLines) {
    // Create a MutationObserver to watch for value changes
    const observer = new MutationObserver(() => {
      updateLineNumbers(jsonFormatOutput, jsonFormatOutputLines);
    });

    // Observe attribute changes (for readonly textarea)
    observer.observe(jsonFormatOutput, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });

    // Also listen to input events (though readonly, programmatic changes might trigger)
    jsonFormatOutput.addEventListener('input', () => {
      updateLineNumbers(jsonFormatOutput, jsonFormatOutputLines);
    });

    // Sync scroll
    jsonFormatOutput.addEventListener('scroll', () => {
      syncScroll(jsonFormatOutput, jsonFormatOutputLines);
    });

    // Initial update
    updateLineNumbers(jsonFormatOutput, jsonFormatOutputLines);

    // Watch for value changes via polling (backup method)
    let lastValue = jsonFormatOutput.value;
    setInterval(() => {
      if (jsonFormatOutput.value !== lastValue) {
        lastValue = jsonFormatOutput.value;
        updateLineNumbers(jsonFormatOutput, jsonFormatOutputLines);
      }
    }, 100);
  }
});

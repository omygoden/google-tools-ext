/* ===== Date Tools Functions ===== */

function updateCurrentTime() {
    const now = new Date();
    const tsSeconds = Math.floor(now.getTime() / 1000);
    const tsMillis = now.getTime();

    // Correctly update all three elements if they exist
    const elSec = $("currentTimestamp");
    const elMs = $("currentTimestampMs");
    const elDate = $("currentDateTime");

    if (elSec) elSec.textContent = tsSeconds;
    if (elMs) elMs.textContent = tsMillis;
    if (elDate) elDate.textContent = formatDateTime(now);
}

function formatDateTime(date, withMs = false) {
    if (!date || isNaN(date.getTime())) return "-";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    let res = `${y}-${m}-${d} ${h}:${min}:${s}`;
    if (withMs) {
        const ms = String(date.getMilliseconds()).padStart(3, '0');
        res += `.${ms}`;
    }
    return res;
}

// Better parsing that handles "YYYY-MM-DD HH:mm:ss" more reliably across browsers
function parseDateString(str) {
    if (!str) return null;
    // Replace '-' with '/' for Safari compatibility
    // Handle both 'HH:mm:ss' and 'HH:II:SS' (common mistake)
    const normalized = str.trim().replace(/-/g, '/').replace(/:(\d{2}):(\d{2})$/, (m, p1, p2) => `:${p1}:${p2}`);
    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
}

// Timestamp to Date
function handleTsToDate() {
    const input = ($("tsInput")?.value || "").trim();
    if (!input) return;

    try {
        let val = parseInt(input);
        if (isNaN(val)) throw new Error("输入不合法");

        // Auto-detect unit
        if (input.length <= 10) val *= 1000;

        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error("无效的时间戳");

        if ($("dateOutput")) $("dateOutput").value = formatDateTime(date, input.length > 10);
        setMsg("转换成功");
    } catch (e) {
        setMsg(e.message, true);
    }
}

// Date to Timestamp
function handleDateToTs() {
    const input = ($("dateInput")?.value || "").trim();
    if (!input) return;

    try {
        const date = parseDateString(input);
        if (!date) throw new Error("日期格式错误 (YYYY-MM-DD HH:mm:ss)");

        const s = Math.floor(date.getTime() / 1000);
        const ms = date.getTime();

        if ($("tsOutputSec")) $("tsOutputSec").value = s;
        if ($("tsOutputMs")) $("tsOutputMs").value = ms;
        setMsg("转换成功");
    } catch (e) {
        setMsg(e.message, true);
    }
}

// Date Arithmetic
function handleArithCalc() {
    try {
        const baseStr = ($("arithBaseDate")?.value || "").trim();
        let date = baseStr ? parseDateString(baseStr) : new Date();
        if (!date) throw new Error("基准日期格式错误");

        const val = parseInt($("arithValue")?.value || "0");
        const unit = $("arithUnit")?.value || "days";

        switch (unit) {
            case "days": date.setDate(date.getDate() + val); break;
            case "hours": date.setHours(date.getHours() + val); break;
            case "minutes": date.setMinutes(date.getMinutes() + val); break;
            case "months": date.setMonth(date.getMonth() + val); break;
            case "years": date.setFullYear(date.getFullYear() + val); break;
        }

        if ($("arithResult")) $("arithResult").value = formatDateTime(date);
        setMsg("计算成功");
    } catch (e) {
        setMsg(e.message, true);
    }
}

// Date Difference
function handleCalcDiff() {
    try {
        const startStr = ($("diffStart")?.value || "").trim();
        const endStr = ($("diffEnd")?.value || "").trim();
        if (!startStr) throw new Error("请输入起始时间");

        const start = parseDateString(startStr);
        const end = endStr ? parseDateString(endStr) : new Date();

        if (!start || !end) throw new Error("日期格式错误");

        const diffMs = Math.abs(end - start);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        const resultText = `相差: ${days} 天 ${hours} 小时 ${mins} 分钟\n(总计约 ${Math.floor(diffMs / 1000)} 秒)`;
        if ($("diffResult")) {
            $("diffResult").textContent = resultText;
            $("diffResult").style.color = "#007aff";
            $("diffResult").style.fontWeight = "600";
        }
    } catch (e) {
        setMsg(e.message, true);
    }
}

async function handleDateCopy(id) {
    const el = $(id);
    const val = el?.value || el?.textContent || "";
    if (!val) return;
    await copyText(val); // Defined in popup.js
    setMsg("已复制到剪贴板");
}

function initDateTools() {
    // Check if the IDs actually exist in the current document
    if (!$("currentTimestamp")) {
        console.warn("Date tool elements not found, skipping init.");
        return;
    }

    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    $("btnTsToDate")?.addEventListener("click", handleTsToDate);
    $("btnDateToTs")?.addEventListener("click", handleDateToTs);
    $("btnTsNow")?.addEventListener("click", () => {
        if ($("tsInput")) $("tsInput").value = Math.floor(Date.now() / 1000);
        handleTsToDate();
    });
    $("btnDateNow")?.addEventListener("click", () => {
        if ($("dateInput")) $("dateInput").value = formatDateTime(new Date());
        handleDateToTs();
    });

    // Arithmetic
    $("btnArithNow")?.addEventListener("click", () => {
        if ($("arithBaseDate")) $("arithBaseDate").value = formatDateTime(new Date());
    });
    $("btnArithCalc")?.addEventListener("click", handleArithCalc);
    $("btnCopyArith")?.addEventListener("click", () => handleDateCopy("arithResult"));

    // Diff
    $("btnCalcDiff")?.addEventListener("click", handleCalcDiff);

    // Copying
    $("currentTimestamp")?.addEventListener("click", () => handleDateCopy("currentTimestamp"));
    $("currentTimestampMs")?.addEventListener("click", () => handleDateCopy("currentTimestampMs"));
    $("btnCopyTsSec")?.addEventListener("click", () => handleDateCopy("tsOutputSec"));
    $("btnCopyTsMs")?.addEventListener("click", () => handleDateCopy("tsOutputMs"));
    $("btnCopyDateOut")?.addEventListener("click", () => handleDateCopy("dateOutput"));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDateTools);
} else {
    initDateTools();
}

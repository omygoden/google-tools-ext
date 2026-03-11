/* =========================
 * word-counter.js
 * 字数统计模块
 * ========================= */

(function () {
    'use strict';

    // =========================================================
    // GBK 字节长度估算（浏览器环境无法直接用 GBK 编码）
    // 规则：ASCII = 1 字节；汉字/全角符号 = 2 字节；其余 Unicode 估算
    // =========================================================
    function getGbkByteLength(str) {
        let len = 0;
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code <= 0x007F) {
                // ASCII
                len += 1;
            } else if (
                (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK 基本区
                (code >= 0x3400 && code <= 0x4DBF) ||   // CJK 扩展A
                (code >= 0xF900 && code <= 0xFAFF) ||   // CJK 兼容
                (code >= 0x2000 && code <= 0x2FFF) ||   // 通用标点、数学等
                (code >= 0x3000 && code <= 0x303F) ||   // CJK 符号与标点
                (code >= 0xFF00 && code <= 0xFFEF) ||   // 半宽全宽
                (code >= 0xAC00 && code <= 0xD7AF)      // 韩文
            ) {
                len += 2;
            } else if (code >= 0xD800 && code <= 0xDBFF) {
                // 代理对（emoji 等），占 4 个 GBK 字节（GBK不支持，实际会乱码，估算为4）
                len += 4;
                i++; // 跳过低代理
            } else {
                len += 2;
            }
        }
        return len;
    }

    // UTF-8 字节长度计算
    function getUtf8ByteLength(str) {
        return new TextEncoder().encode(str).length;
    }

    // 判断是否为汉字（CJK 统一表意字符）
    function isCjk(code) {
        return (
            (code >= 0x4E00 && code <= 0x9FFF) ||   // CJK 基本区
            (code >= 0x3400 && code <= 0x4DBF) ||   // CJK 扩展A
            (code >= 0x20000 && code <= 0x2A6DF) || // CJK 扩展B（代理对）
            (code >= 0xF900 && code <= 0xFAFF)      // CJK 兼容
        );
    }

    // 核心统计函数
    function countText(text) {
        if (!text) {
            return {
                totalChars: 0,         // 总字符数（包括空白）
                totalCharsNoSpace: 0,  // 总字符数（不含空白）
                utf8Bytes: 0,          // UTF-8 字节数
                gbkBytes: 0,           // GBK 字节数（估算）
                chineseChars: 0,       // 汉字数
                letters: 0,            // 字母数（英文字母）
                words: 0,              // 单词数（英文单词 + 中文按字计）
                digits: 0,             // 数字个数
                spaces: 0,             // 空格/空白符数
                lines: 0,              // 行数
                paragraphs: 0,         // 段落数（非空行）
                punctuation: 0,        // 标点符号数
                symbols: 0,            // 其他符号数
                emoji: 0,              // Emoji 数
                totalWords: 0,         // 广义总词数（中文字数 + 英文单词数）
            };
        }

        let totalChars = 0;
        let chineseChars = 0;
        let letters = 0;
        let digits = 0;
        let spaces = 0;
        let punctuation = 0;
        let symbols = 0;
        let emoji = 0;

        // 遍历字符（使用 for...of 正确处理代理对/emoji）
        const chars = [...text]; // 展开为实际字符数组（emoji 按1个算）
        totalChars = chars.length;

        for (const ch of chars) {
            const code = ch.codePointAt(0);

            // Emoji 检测（通过是否超过 BMP 或特定范围）
            if (code > 0xFFFF ||
                (code >= 0x1F300 && code <= 0x1FAFF) ||  // 各类 emoji
                (code >= 0x2600 && code <= 0x27BF) ||     // 杂项符号
                (code >= 0xFE00 && code <= 0xFE0F)) {     // 变体选择器
                emoji++;
                continue;
            }

            // 汉字
            if (isCjk(code)) {
                chineseChars++;
                continue;
            }

            // 英文字母
            if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A) ||
                // 其他语言字母（拉丁扩展等）
                (code >= 0xC0 && code <= 0x024F)) {
                letters++;
                continue;
            }

            // 数字（ASCII 数字 + 全角数字）
            if ((code >= 0x30 && code <= 0x39) ||
                (code >= 0xFF10 && code <= 0xFF19)) {
                digits++;
                continue;
            }

            // 空白符（空格、换行、制表符等）
            if (/\s/.test(ch)) {
                spaces++;
                continue;
            }

            // 标点符号（ASCII + 中文标点）
            if (/[.,!?;:'"()\[\]{}\-–—…·。，、！？；：""''（）【】《》「」『』〔〕]/.test(ch) ||
                (code >= 0x2000 && code <= 0x206F) ||  // 通用标点
                (code >= 0x3000 && code <= 0x303F)) {  // CJK 标点
                punctuation++;
                continue;
            }

            // 其他符号
            symbols++;
        }

        // 英文单词数（连续字母序列）
        const englishWords = (text.match(/[a-zA-Z\u00C0-\u024F]+/g) || []).length;

        // 广义词数 = 汉字数（每字为一词） + 英文单词数
        const totalWords = chineseChars + englishWords;

        // 行数
        const lines = text.split('\n').length;

        // 段落数（非空行）
        const paragraphs = text.split('\n').filter(line => line.trim().length > 0).length;

        // 不含空白符的字符数
        const totalCharsNoSpace = totalChars - spaces;

        // 字节数
        const utf8Bytes = getUtf8ByteLength(text);
        const gbkBytes = getGbkByteLength(text);

        return {
            totalChars,
            totalCharsNoSpace,
            utf8Bytes,
            gbkBytes,
            chineseChars,
            letters,
            words: englishWords,
            digits,
            spaces,
            lines,
            paragraphs,
            punctuation,
            symbols,
            emoji,
            totalWords,
        };
    }

    // 格式化数字（加千位分隔符）
    function fmtNum(n) {
        return n.toLocaleString('zh-CN');
    }

    // 渲染统计结果到页面
    function renderStats(stats) {
        const items = [
            { label: '总字数 (Words)', value: fmtNum(stats.totalWords), icon: '📝', desc: '汉字 + 英文单词', highlight: true },
            { label: '总字符数（含空白）', value: fmtNum(stats.totalChars), icon: '🔤', desc: '所有可见字符和空白' },
            { label: '总字符数（不含空白）', value: fmtNum(stats.totalCharsNoSpace), icon: '🔡', desc: '去除空格/换行后' },
            { label: '字节数 (UTF-8)', value: fmtNum(stats.utf8Bytes) + ' B', icon: '💾', desc: '标准 UTF-8 编码字节数' },
            { label: '字节数 (GBK 估算)', value: fmtNum(stats.gbkBytes) + ' B', icon: '📦', desc: 'GBK 编码估算字节数' },
            { label: '汉字数', value: fmtNum(stats.chineseChars), icon: '🀄', desc: 'CJK 统一表意字符' },
            { label: '英文字母', value: fmtNum(stats.letters), icon: '🔤', desc: '拉丁字母' },
            { label: '英文单词数', value: fmtNum(stats.words), icon: '📖', desc: '连续字母序列' },
            { label: '数字', value: fmtNum(stats.digits), icon: '🔢', desc: '0-9 及全角数字' },
            { label: '标点符号', value: fmtNum(stats.punctuation), icon: '❗', desc: '中英文标点' },
            { label: '其他符号', value: fmtNum(stats.symbols), icon: '✨', desc: '非字母数字标点的符号' },
            { label: 'Emoji', value: fmtNum(stats.emoji), icon: '😀', desc: '表情符号' },
            { label: '空格/空白符', value: fmtNum(stats.spaces), icon: '⬜', desc: '空格、制表符、换行符' },
            { label: '行数', value: fmtNum(stats.lines), icon: '📄', desc: '文本行数' },
            { label: '段落数', value: fmtNum(stats.paragraphs), icon: '📋', desc: '非空行段落数' },
        ];

        const container = document.getElementById('wcStatsGrid');
        if (!container) return;

        container.innerHTML = items.map(item => `
      <div class="wc-stat-card ${item.highlight ? 'wc-stat-highlight' : ''}">
        <div class="wc-stat-icon">${item.icon}</div>
        <div class="wc-stat-body">
          <div class="wc-stat-value">${item.value}</div>
          <div class="wc-stat-label">${item.label}</div>
          <div class="wc-stat-desc">${item.desc}</div>
        </div>
      </div>
    `).join('');
    }

    // 防抖
    function debounce(fn, wait) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), wait);
        };
    }

    // 初始化
    function initWordCounter() {
        const textarea = document.getElementById('wcInput');
        const clearBtn = document.getElementById('btnWcClear');
        const copyBtn = document.getElementById('btnWcCopy');
        const placeholder = document.getElementById('wcPlaceholder');
        const statsContainer = document.getElementById('wcStatsContainer');

        if (!textarea) return;

        function update() {
            const text = textarea.value;
            if (!text.trim()) {
                if (placeholder) placeholder.style.display = 'flex';
                if (statsContainer) statsContainer.style.display = 'none';
                return;
            }
            if (placeholder) placeholder.style.display = 'none';
            if (statsContainer) statsContainer.style.display = 'block';

            const stats = countText(text);
            renderStats(stats);
        }

        const debouncedUpdate = debounce(update, 150);

        textarea.addEventListener('input', debouncedUpdate);
        textarea.addEventListener('paste', () => setTimeout(debouncedUpdate, 0));

        clearBtn?.addEventListener('click', () => {
            textarea.value = '';
            update();
        });

        copyBtn?.addEventListener('click', async () => {
            const text = textarea.value;
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
                // 使用全局 setMsg 函数
                if (typeof setMsg === 'function') setMsg('已复制内容');
            } catch (e) {
                if (typeof setMsg === 'function') setMsg('复制失败', true);
            }
        });
    }

    // DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWordCounter);
    } else {
        initWordCounter();
    }
})();

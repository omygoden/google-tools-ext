/* =========================
 * code-counter.js
 * 代码统计模块 - 上传压缩包统计代码行数
 * ========================= */

(function () {
    'use strict';

    // ===== 支持的代码文件扩展名及分类 =====
    const LANG_MAP = {
        // Web
        'js': { name: 'JavaScript', color: '#f7df1e', group: 'Web' },
        'jsx': { name: 'JSX', color: '#61dafb', group: 'Web' },
        'ts': { name: 'TypeScript', color: '#3178c6', group: 'Web' },
        'tsx': { name: 'TSX', color: '#3178c6', group: 'Web' },
        'vue': { name: 'Vue', color: '#42b883', group: 'Web' },
        'svelte': { name: 'Svelte', color: '#ff3e00', group: 'Web' },
        'html': { name: 'HTML', color: '#e34f26', group: 'Web' },
        'htm': { name: 'HTML', color: '#e34f26', group: 'Web' },
        'css': { name: 'CSS', color: '#1572b6', group: 'Web' },
        'scss': { name: 'SCSS', color: '#cf649a', group: 'Web' },
        'sass': { name: 'Sass', color: '#cf649a', group: 'Web' },
        'less': { name: 'Less', color: '#1d365d', group: 'Web' },

        // Backend
        'go': { name: 'Go', color: '#00add8', group: 'Backend' },
        'py': { name: 'Python', color: '#3776ab', group: 'Backend' },
        'java': { name: 'Java', color: '#ed8b00', group: 'Backend' },
        'kt': { name: 'Kotlin', color: '#7f52ff', group: 'Backend' },
        'kts': { name: 'Kotlin Script', color: '#7f52ff', group: 'Backend' },
        'rs': { name: 'Rust', color: '#ce412b', group: 'Backend' },
        'rb': { name: 'Ruby', color: '#cc342d', group: 'Backend' },
        'php': { name: 'PHP', color: '#777bb4', group: 'Backend' },
        'c': { name: 'C', color: '#a8b9cc', group: 'Backend' },
        'h': { name: 'C Header', color: '#a8b9cc', group: 'Backend' },
        'cpp': { name: 'C++', color: '#00599c', group: 'Backend' },
        'cc': { name: 'C++', color: '#00599c', group: 'Backend' },
        'hpp': { name: 'C++ Header', color: '#00599c', group: 'Backend' },
        'cs': { name: 'C#', color: '#239120', group: 'Backend' },
        'swift': { name: 'Swift', color: '#fa7343', group: 'Backend' },
        'dart': { name: 'Dart', color: '#0175c2', group: 'Backend' },
        'scala': { name: 'Scala', color: '#dc322f', group: 'Backend' },
        'lua': { name: 'Lua', color: '#2c2d72', group: 'Backend' },
        'r': { name: 'R', color: '#276dc3', group: 'Backend' },
        'ex': { name: 'Elixir', color: '#6e4a7e', group: 'Backend' },
        'exs': { name: 'Elixir Script', color: '#6e4a7e', group: 'Backend' },
        'erl': { name: 'Erlang', color: '#b83998', group: 'Backend' },
        'clj': { name: 'Clojure', color: '#5881d8', group: 'Backend' },
        'zig': { name: 'Zig', color: '#f7a41d', group: 'Backend' },

        // Shell & Scripts
        'sh': { name: 'Shell', color: '#89e051', group: 'Script' },
        'bash': { name: 'Bash', color: '#89e051', group: 'Script' },
        'zsh': { name: 'Zsh', color: '#89e051', group: 'Script' },
        'bat': { name: 'Batch', color: '#c1f12e', group: 'Script' },
        'ps1': { name: 'PowerShell', color: '#012456', group: 'Script' },
        'pl': { name: 'Perl', color: '#39457e', group: 'Script' },

        // Data & Config
        'json': { name: 'JSON', color: '#292929', group: 'Config' },
        'yaml': { name: 'YAML', color: '#cb171e', group: 'Config' },
        'yml': { name: 'YAML', color: '#cb171e', group: 'Config' },
        'toml': { name: 'TOML', color: '#9c4221', group: 'Config' },
        'xml': { name: 'XML', color: '#0060ac', group: 'Config' },
        'ini': { name: 'INI', color: '#d1dbe0', group: 'Config' },
        'env': { name: 'Env', color: '#ecd53f', group: 'Config' },
        'properties': { name: 'Properties', color: '#2a6099', group: 'Config' },

        // Database
        'sql': { name: 'SQL', color: '#e38c00', group: 'Database' },
        'proto': { name: 'Protobuf', color: '#4285f4', group: 'Database' },
        'graphql': { name: 'GraphQL', color: '#e535ab', group: 'Database' },
        'gql': { name: 'GraphQL', color: '#e535ab', group: 'Database' },

        // Docs & Markup
        'md': { name: 'Markdown', color: '#083fa1', group: 'Docs' },
        'markdown': { name: 'Markdown', color: '#083fa1', group: 'Docs' },
        'rst': { name: 'reStructuredText', color: '#141414', group: 'Docs' },
        'tex': { name: 'LaTeX', color: '#3d6117', group: 'Docs' },
        'txt': { name: 'Text', color: '#999', group: 'Docs' },

        // DevOps & Build
        'dockerfile': { name: 'Dockerfile', color: '#2496ed', group: 'DevOps' },
        'makefile': { name: 'Makefile', color: '#427819', group: 'DevOps' },
        'gradle': { name: 'Gradle', color: '#02303a', group: 'DevOps' },
        'cmake': { name: 'CMake', color: '#064f8c', group: 'DevOps' },
        'tf': { name: 'Terraform', color: '#7b42bc', group: 'DevOps' },
    };

    // 需要忽略的目录
    const IGNORE_DIRS = new Set([
        'node_modules', '.git', '.svn', '.hg', 'vendor', 'dist', 'build',
        '__pycache__', '.idea', '.vscode', '.vs', 'target', 'bin', 'obj',
        'Pods', '.gradle', '.next', '.nuxt', '.cache', 'coverage',
        '.DS_Store', 'bower_components',
    ]);

    // 需要忽略的文件名
    const IGNORE_FILES = new Set([
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        'composer.lock', 'go.sum', 'Cargo.lock', 'Gemfile.lock',
    ]);

    // 获取文件扩展名
    function getExt(filename) {
        const base = filename.split('/').pop();
        // 特殊文件名处理
        const lowerBase = base.toLowerCase();
        if (lowerBase === 'dockerfile' || lowerBase.startsWith('dockerfile.')) return 'dockerfile';
        if (lowerBase === 'makefile' || lowerBase === 'gnumakefile') return 'makefile';
        if (lowerBase === '.env' || lowerBase.startsWith('.env.')) return 'env';

        const dotIdx = base.lastIndexOf('.');
        if (dotIdx < 0 || dotIdx === base.length - 1) return '';
        return base.substring(dotIdx + 1).toLowerCase();
    }

    // 判断路径是否应被忽略
    function shouldIgnore(filepath) {
        const parts = filepath.split('/');
        // 检查目录名
        for (const part of parts) {
            if (IGNORE_DIRS.has(part)) return true;
        }
        // 检查文件名
        const filename = parts[parts.length - 1];
        if (IGNORE_FILES.has(filename)) return true;
        // 忽略隐藏文件（以.开头但不是.env等）
        if (filename.startsWith('.') && !['env'].includes(getExt(filepath))) return true;
        return false;
    }

    // 统计单个文件的行数
    function countFileLines(content) {
        if (!content || content.length === 0) return { total: 0, code: 0, blank: 0, comment: 0 };

        const lines = content.split('\n');
        let total = lines.length;
        let blank = 0;
        let comment = 0;
        let inBlockComment = false;

        for (const rawLine of lines) {
            const line = rawLine.trim();

            if (line === '') {
                blank++;
                continue;
            }

            // 简单的块注释检测
            if (inBlockComment) {
                comment++;
                if (line.includes('*/')) {
                    inBlockComment = false;
                }
                continue;
            }

            if (line.startsWith('/*')) {
                comment++;
                if (!line.includes('*/') || line.indexOf('*/') < line.length - 2) {
                    inBlockComment = !line.endsWith('*/');
                }
                continue;
            }

            // 单行注释
            if (line.startsWith('//') || line.startsWith('#') || line.startsWith('--') || line.startsWith(';')) {
                comment++;
                continue;
            }
        }

        return {
            total,
            code: total - blank - comment,
            blank,
            comment,
        };
    }

    // 格式化数字
    function fmtNum(n) {
        return n.toLocaleString('zh-CN');
    }

    // 格式化文件大小
    function fmtSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    }

    // ===== 主处理函数 =====
    async function processZipFile(file, progressCallback) {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip 库未加载，请检查 jszip.min.js 文件是否存在');
        }

        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        const results = {}; // ext -> { name, color, group, files: [{name, total, code, blank, comment, size}], totalLines, codeLines, blankLines, commentLines, fileCount }
        let totalFiles = 0;
        let skippedFiles = 0;
        let processedCount = 0;

        // 获取所有文件列表
        const entries = [];
        zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir) {
                entries.push({ path: relativePath, entry: zipEntry });
            }
        });

        const totalEntries = entries.length;

        for (const { path, entry } of entries) {
            processedCount++;
            if (progressCallback) {
                progressCallback(processedCount, totalEntries, path);
            }

            if (shouldIgnore(path)) {
                skippedFiles++;
                continue;
            }

            const ext = getExt(path);
            if (!ext || !LANG_MAP[ext]) {
                skippedFiles++;
                continue;
            }

            const langInfo = LANG_MAP[ext];

            try {
                const content = await entry.async('string');
                const stats = countFileLines(content);
                const fileSize = content.length;

                if (!results[ext]) {
                    results[ext] = {
                        ...langInfo,
                        ext,
                        files: [],
                        totalLines: 0,
                        codeLines: 0,
                        blankLines: 0,
                        commentLines: 0,
                        fileCount: 0,
                        totalSize: 0,
                    };
                }

                results[ext].files.push({
                    name: path,
                    ...stats,
                    size: fileSize,
                });
                results[ext].totalLines += stats.total;
                results[ext].codeLines += stats.code;
                results[ext].blankLines += stats.blank;
                results[ext].commentLines += stats.comment;
                results[ext].fileCount++;
                results[ext].totalSize += fileSize;
                totalFiles++;

            } catch (e) {
                // 二进制文件会报错，跳过
                skippedFiles++;
            }
        }

        // 按代码行数排序
        const sortedResults = Object.values(results).sort((a, b) => b.codeLines - a.codeLines);

        // 汇总数据
        const summary = {
            totalFiles,
            skippedFiles,
            totalCodeLines: 0,
            totalBlankLines: 0,
            totalCommentLines: 0,
            totalLines: 0,
            totalSize: 0,
            languages: sortedResults.length,
        };

        for (const lang of sortedResults) {
            summary.totalCodeLines += lang.codeLines;
            summary.totalBlankLines += lang.blankLines;
            summary.totalCommentLines += lang.commentLines;
            summary.totalLines += lang.totalLines;
            summary.totalSize += lang.totalSize;
        }

        return { languages: sortedResults, summary };
    }

    // ===== 渲染函数 =====
    function renderSummary(summary) {
        const container = document.getElementById('ccSummaryGrid');
        if (!container) return;

        const items = [
            { label: '代码行数', value: fmtNum(summary.totalCodeLines), icon: '💻', desc: '不含空行和注释', highlight: true },
            { label: '总行数', value: fmtNum(summary.totalLines), icon: '📄', desc: '含空行和注释' },
            { label: '空行', value: fmtNum(summary.totalBlankLines), icon: '⬜', desc: '空白行' },
            { label: '注释行', value: fmtNum(summary.totalCommentLines), icon: '💬', desc: '注释行数' },
            { label: '文件数', value: fmtNum(summary.totalFiles), icon: '📁', desc: '代码文件' },
            { label: '语言数', value: fmtNum(summary.languages), icon: '🌐', desc: '编程语言种类' },
            { label: '总大小', value: fmtSize(summary.totalSize), icon: '💾', desc: '代码文件总大小' },
            { label: '跳过文件', value: fmtNum(summary.skippedFiles), icon: '🚫', desc: '非代码/被忽略' },
        ];

        container.innerHTML = items.map(item => `
            <div class="cc-stat-card ${item.highlight ? 'cc-stat-highlight' : ''}">
                <div class="cc-stat-icon">${item.icon}</div>
                <div class="cc-stat-body">
                    <div class="cc-stat-value">${item.value}</div>
                    <div class="cc-stat-label">${item.label}</div>
                    <div class="cc-stat-desc">${item.desc}</div>
                </div>
            </div>
        `).join('');
    }

    function renderLanguageTable(languages) {
        const tbody = document.getElementById('ccLangTableBody');
        if (!tbody) return;

        let html = '';
        for (const lang of languages) {
            const pct = languages.reduce((s, l) => s + l.codeLines, 0);
            const percent = pct > 0 ? ((lang.codeLines / pct) * 100).toFixed(1) : '0.0';

            html += `
                <tr class="cc-lang-row" data-ext="${lang.ext}">
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="cc-lang-dot" style="background: ${lang.color};"></span>
                            <span style="font-weight: 600;">${lang.name}</span>
                            <span style="font-size: 10px; color: #86868b;">.${lang.ext}</span>
                        </div>
                    </td>
                    <td style="text-align: right; font-variant-numeric: tabular-nums;">${fmtNum(lang.fileCount)}</td>
                    <td style="text-align: right; font-weight: 600; color: #007aff; font-variant-numeric: tabular-nums;">${fmtNum(lang.codeLines)}</td>
                    <td style="text-align: right; font-variant-numeric: tabular-nums;">${fmtNum(lang.totalLines)}</td>
                    <td style="text-align: right; font-variant-numeric: tabular-nums;">${fmtNum(lang.blankLines)}</td>
                    <td style="text-align: right; font-variant-numeric: tabular-nums;">${fmtNum(lang.commentLines)}</td>
                    <td>
                        <div class="cc-bar-container">
                            <div class="cc-bar-fill" style="width: ${percent}%; background: ${lang.color};"></div>
                        </div>
                        <span style="font-size: 10px; color: #86868b; margin-left: 4px;">${percent}%</span>
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML = html;

        // 添加点击展开文件列表
        tbody.querySelectorAll('.cc-lang-row').forEach(row => {
            row.addEventListener('click', () => {
                const ext = row.dataset.ext;
                toggleFileList(row, languages.find(l => l.ext === ext));
            });
        });
    }

    function toggleFileList(row, langData) {
        const existing = row.nextElementSibling;
        if (existing && existing.classList.contains('cc-file-detail-row')) {
            existing.remove();
            row.classList.remove('cc-expanded');
            return;
        }

        row.classList.add('cc-expanded');

        // 对文件按代码行数排序
        const sortedFiles = [...langData.files].sort((a, b) => b.code - a.code);

        const detailRow = document.createElement('tr');
        detailRow.className = 'cc-file-detail-row';
        detailRow.innerHTML = `
            <td colspan="7" style="padding: 0;">
                <div class="cc-file-list">
                    <table class="cc-file-table">
                        <thead>
                            <tr>
                                <th>文件路径</th>
                                <th style="text-align: right;">代码行</th>
                                <th style="text-align: right;">总行数</th>
                                <th style="text-align: right;">空行</th>
                                <th style="text-align: right;">注释</th>
                                <th style="text-align: right;">大小</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedFiles.map(f => `
                                <tr>
                                    <td title="${f.name}" style="max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${f.name}</td>
                                    <td style="text-align: right; font-weight: 600; color: #007aff;">${fmtNum(f.code)}</td>
                                    <td style="text-align: right;">${fmtNum(f.total)}</td>
                                    <td style="text-align: right;">${fmtNum(f.blank)}</td>
                                    <td style="text-align: right;">${fmtNum(f.comment)}</td>
                                    <td style="text-align: right;">${fmtSize(f.size)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </td>
        `;

        row.after(detailRow);
    }

    function renderLanguageChart(languages) {
        const container = document.getElementById('ccChartContainer');
        if (!container) return;

        const totalCode = languages.reduce((s, l) => s + l.codeLines, 0);
        if (totalCode === 0) { container.innerHTML = ''; return; }

        // 环形图
        let html = '<div class="cc-chart-wrapper">';

        // 饼图（用 CSS conic-gradient）
        const stops = [];
        let cumulative = 0;
        for (const lang of languages) {
            const pct = (lang.codeLines / totalCode) * 100;
            stops.push(`${lang.color} ${cumulative}% ${cumulative + pct}%`);
            cumulative += pct;
        }

        html += `
            <div class="cc-donut" style="background: conic-gradient(${stops.join(', ')});">
                <div class="cc-donut-hole">
                    <div class="cc-donut-total">${fmtNum(totalCode)}</div>
                    <div class="cc-donut-label">代码行</div>
                </div>
            </div>
        `;

        // 图例
        html += '<div class="cc-legend">';
        for (const lang of languages.slice(0, 10)) {
            const pct = ((lang.codeLines / totalCode) * 100).toFixed(1);
            html += `
                <div class="cc-legend-item">
                    <span class="cc-lang-dot" style="background: ${lang.color};"></span>
                    <span class="cc-legend-name">${lang.name}</span>
                    <span class="cc-legend-pct">${pct}%</span>
                </div>
            `;
        }
        if (languages.length > 10) {
            html += `<div class="cc-legend-item"><span style="color: #86868b; font-size: 11px;">… 还有 ${languages.length - 10} 种语言</span></div>`;
        }
        html += '</div>';

        html += '</div>';
        container.innerHTML = html;
    }

    // ===== 进度条 =====
    function updateProgress(current, total, filename) {
        const bar = document.getElementById('ccProgressBar');
        const text = document.getElementById('ccProgressText');
        const container = document.getElementById('ccProgressContainer');

        if (!bar || !text || !container) return;

        container.style.display = 'block';
        const pct = Math.round((current / total) * 100);
        bar.style.width = pct + '%';

        const shortName = filename.length > 50 ? '...' + filename.slice(-47) : filename;
        text.textContent = `正在分析 (${current}/${total}): ${shortName}`;
    }

    function hideProgress() {
        const container = document.getElementById('ccProgressContainer');
        if (container) container.style.display = 'none';
    }

    // ===== 初始化 =====
    function initCodeCounter() {
        const uploadBtn = document.getElementById('btnCcUpload');
        const fileInput = document.getElementById('ccFileInput');
        const dropZone = document.getElementById('ccDropZone');
        const clearBtn = document.getElementById('btnCcClear');
        const exportBtn = document.getElementById('btnCcExport');

        if (!fileInput) return;

        // 上传按钮
        uploadBtn?.addEventListener('click', () => fileInput.click());

        // 文件选择
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) await analyzeFile(file);
            fileInput.value = ''; // 重置以允许重复选择相同文件
        });

        // 拖拽区域
        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());

            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('cc-drop-active');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('cc-drop-active');
            });

            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.classList.remove('cc-drop-active');
                const file = e.dataTransfer.files[0];
                if (file) await analyzeFile(file);
            });
        }

        // 清空
        clearBtn?.addEventListener('click', () => {
            clearResults();
        });

        // 导出
        exportBtn?.addEventListener('click', () => {
            exportResults();
        });
    }

    let lastResults = null;

    async function analyzeFile(file) {
        // 验证文件类型
        const name = file.name.toLowerCase();
        if (!name.endsWith('.zip')) {
            if (typeof setMsg === 'function') setMsg('仅支持 .zip 格式的压缩包', true);
            return;
        }

        const placeholder = document.getElementById('ccPlaceholder');
        const resultsContainer = document.getElementById('ccResultsContainer');

        try {
            if (placeholder) placeholder.style.display = 'none';
            if (resultsContainer) resultsContainer.style.display = 'flex';

            // 显示文件名
            const filenameEl = document.getElementById('ccFileName');
            if (filenameEl) {
                filenameEl.textContent = `📦 ${file.name} (${fmtSize(file.size)})`;
                filenameEl.style.display = 'block';
            }

            const { languages, summary } = await processZipFile(file, updateProgress);

            lastResults = { languages, summary, fileName: file.name };

            hideProgress();

            if (summary.totalFiles === 0) {
                if (typeof setMsg === 'function') setMsg('未在压缩包中找到代码文件', true);
                clearResults();
                return;
            }

            renderSummary(summary);
            renderLanguageChart(languages);
            renderLanguageTable(languages);

            if (typeof setMsg === 'function') {
                setMsg(`分析完成 - ${fmtNum(summary.totalFiles)} 个文件, ${fmtNum(summary.totalCodeLines)} 行代码`);
            }

        } catch (e) {
            hideProgress();
            if (typeof setMsg === 'function') setMsg('分析失败: ' + (e.message || e), true);
            console.error('Code counter error:', e);
        }
    }

    function clearResults() {
        const placeholder = document.getElementById('ccPlaceholder');
        const resultsContainer = document.getElementById('ccResultsContainer');
        const filenameEl = document.getElementById('ccFileName');

        if (placeholder) placeholder.style.display = 'flex';
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (filenameEl) filenameEl.style.display = 'none';

        hideProgress();
        lastResults = null;
    }

    function exportResults() {
        if (!lastResults) {
            if (typeof setMsg === 'function') setMsg('请先上传压缩包并分析', true);
            return;
        }

        const { languages, summary, fileName } = lastResults;
        let text = `代码统计报告\n`;
        text += `======================\n`;
        text += `分析文件: ${fileName}\n`;
        text += `分析时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

        text += `=== 总体统计 ===\n`;
        text += `代码行数: ${fmtNum(summary.totalCodeLines)}\n`;
        text += `总行数:   ${fmtNum(summary.totalLines)}\n`;
        text += `空行:     ${fmtNum(summary.totalBlankLines)}\n`;
        text += `注释行:   ${fmtNum(summary.totalCommentLines)}\n`;
        text += `文件数:   ${fmtNum(summary.totalFiles)}\n`;
        text += `语言数:   ${fmtNum(summary.languages)}\n`;
        text += `总大小:   ${fmtSize(summary.totalSize)}\n\n`;

        text += `=== 各语言统计 ===\n`;
        text += `${'语言'.padEnd(20)}${'文件数'.padStart(8)}${'代码行'.padStart(10)}${'总行数'.padStart(10)}${'空行'.padStart(8)}${'注释'.padStart(8)}\n`;
        text += '-'.repeat(64) + '\n';

        for (const lang of languages) {
            const pct = ((lang.codeLines / summary.totalCodeLines) * 100).toFixed(1);
            text += `${(lang.name + ' (.' + lang.ext + ')').padEnd(20)}${String(lang.fileCount).padStart(8)}${String(lang.codeLines).padStart(10)}${String(lang.totalLines).padStart(10)}${String(lang.blankLines).padStart(8)}${String(lang.commentLines).padStart(8)}  (${pct}%)\n`;
        }

        // 复制到剪贴板
        navigator.clipboard.writeText(text).then(() => {
            if (typeof setMsg === 'function') setMsg('报告已复制到剪贴板');
        }).catch(() => {
            if (typeof setMsg === 'function') setMsg('复制失败', true);
        });
    }

    // DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCodeCounter);
    } else {
        initCodeCounter();
    }
})();

/* ===== Performance Optimizations for Large JSON ===== */

// Global cache for node relationships
const nodeCache = new Map();
let nodeIdCounter = 0;

// Optimized makeJsonClickable with DocumentFragment
function makeJsonClickableOptimized(textarea) {
    if (!textarea || !textarea.value) return;

    const startTime = performance.now();

    // Create wrapper
    let wrapper = textarea.nextElementSibling;
    if (!wrapper || !wrapper.classList.contains('json-clickable-wrapper')) {
        wrapper = document.createElement('div');
        wrapper.className = 'json-clickable-wrapper';
        textarea.style.display = 'none';
        textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
    }

    // Parse JSON
    const jsonText = textarea.value;
    let parsedJson;
    try {
        parsedJson = JSON.parse(jsonText);
    } catch (e) {
        wrapper.textContent = jsonText;
        return;
    }

    // Clear caches
    nodeCache.clear();
    nodeIdCounter = 0;

    // Use DocumentFragment for batch DOM insertion
    const fragment = document.createDocumentFragment();

    // Render to fragment
    renderJsonNodeOptimized(parsedJson, fragment, '', 0);

    // Single DOM update
    wrapper.innerHTML = '';
    wrapper.appendChild(fragment);

    console.log(`JSON rendered in ${(performance.now() - startTime).toFixed(2)}ms`);
}

// Optimized toggle function using cached relationships
function createOptimizedToggle(line, lineId) {
    return function () {
        const isExpanded = this.classList.contains('expanded');
        const startTime = performance.now();

        if (isExpanded) {
            // Collapse
            this.classList.remove('expanded');
            this.classList.add('collapsed');

            // Use cached children if available
            const descendants = getAllDescendants(line, lineId);

            // Batch class changes
            descendants.forEach(desc => desc.classList.add('json-collapsed'));

            const ellipsis = line.querySelector('.json-ellipsis');
            if (ellipsis) ellipsis.style.display = 'inline';
        } else {
            // Expand
            this.classList.remove('collapsed');
            this.classList.add('expanded');

            const descendants = getAllDescendants(line, lineId);

            // Batch class changes
            descendants.forEach(desc => {
                desc.classList.remove('json-collapsed');
                const toggle = desc.querySelector('.json-toggle');
                if (toggle) {
                    toggle.classList.remove('collapsed');
                    toggle.classList.add('expanded');
                }
            });

            const ellipsis = line.querySelector('.json-ellipsis');
            if (ellipsis) ellipsis.style.display = 'none';
        }

        console.log(`Toggle completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    };
}

// Fast descendant lookup
function getAllDescendants(line, lineId) {
    const descendants = [];
    let current = line.nextElementSibling;

    // Use a simple depth check instead of walking parent chain
    const lineDepth = parseInt(line.style.paddingLeft) || 0;

    while (current && current.classList.contains('json-line')) {
        const currentDepth = parseInt(current.style.paddingLeft) || 0;

        // If same or less depth, we've left this branch
        if (currentDepth <= lineDepth) break;

        descendants.push(current);
        current = current.nextElementSibling;
    }

    return descendants;
}

// Add action buttons and click handler to any line
function addLineActions(line, value, lineId) {
    // Create actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'json-node-actions';

    // Determine what to copy/download/delete based on line content
    const lineText = line.textContent;
    const hasArrayBracket = lineText.includes('[') || lineText.includes(']');
    const hasObjectBrace = lineText.includes('{') || lineText.includes('}');

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'json-action-btn copy';
    copyBtn.textContent = '复制';
    copyBtn.onclick = async (e) => {
        e.stopPropagation();
        const valueStr = JSON.stringify(value, null, 2);
        await copyText(valueStr);
        showCopyNotification('已复制内容');
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
        a.download = `data_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showCopyNotification('已下载内容');
    };
    actionsDiv.appendChild(downloadBtn);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'json-action-btn delete';
    deleteBtn.textContent = '删除';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();

        // If this line has brackets/braces, delete the whole structure
        if ((hasArrayBracket || hasObjectBrace) && lineId) {
            const descendants = getAllDescendants(line, lineId);
            descendants.forEach(desc => desc.remove());
        }

        // Always remove the line itself
        line.remove();
        showCopyNotification('已删除');
    };
    actionsDiv.appendChild(deleteBtn);

    line.appendChild(actionsDiv);

    // Add click handler to toggle actions
    line.onclick = (e) => {
        // Don't trigger if clicking on buttons
        if (e.target.tagName === 'BUTTON' || e.target.closest('.json-node-actions')) {
            return;
        }

        // Don't trigger if clicking on toggle button
        if (e.target.classList.contains('json-toggle')) {
            return;
        }

        e.stopPropagation();

        // Close all other active lines
        document.querySelectorAll('.json-line.active').forEach(activeLine => {
            if (activeLine !== line) {
                activeLine.classList.remove('active');
            }
        });

        // Toggle this line
        line.classList.toggle('active');
    };
}

// Optimized renderJsonNode
function renderJsonNodeOptimized(value, container, key, indent, isLast = true) {
    const line = document.createElement('div');
    line.className = 'json-line';
    line.style.paddingLeft = (indent * 20) + 'px';

    if (Array.isArray(value)) {
        renderArrayNode(value, line, container, key, indent, isLast);
    } else if (value !== null && typeof value === 'object') {
        renderObjectNode(value, line, container, key, indent, isLast);
    } else {
        renderPrimitiveNode(value, line, container, key, isLast);
    }
}

function renderArrayNode(value, line, container, key, indent, isLast) {
    const hasItems = value.length > 0;
    const lineId = 'line_' + (++nodeIdCounter);
    line.dataset.id = lineId;

    if (hasItems) {
        const toggle = document.createElement('span');
        toggle.className = 'json-toggle expanded';
        toggle.onclick = createOptimizedToggle(line, lineId);
        line.appendChild(toggle);
    } else {
        const spacer = document.createElement('span');
        spacer.textContent = '  ';
        line.appendChild(spacer);
    }

    if (key) {
        const keySpan = document.createElement('span');
        keySpan.className = 'json-key-clickable';
        keySpan.textContent = `"${key}"`;
        keySpan.title = '点击复制此键的值';
        keySpan.onclick = async (e) => {
            e.stopPropagation();
            await copyText(JSON.stringify(value, null, 2));
            showCopyNotification(JSON.stringify(value, null, 2));
        };
        line.appendChild(keySpan);
        line.appendChild(document.createTextNode(': '));
    }

    const bracket = document.createElement('span');
    bracket.className = 'json-bracket';
    bracket.textContent = '[';
    line.appendChild(bracket);

    if (hasItems) {
        const count = document.createElement('span');
        count.className = 'json-count';
        count.textContent = `${value.length} item${value.length > 1 ? 's' : ''}`;
        line.appendChild(count);

        const ellipsis = document.createElement('span');
        ellipsis.className = 'json-ellipsis';
        ellipsis.textContent = '...';
        ellipsis.style.display = 'none';
        line.appendChild(ellipsis);
    }

    // Add action buttons using the new function
    addLineActions(line, value, lineId);

    container.appendChild(line);

    value.forEach((item, index) => {
        const childLine = renderJsonNodeOptimized(item, container, '', indent + 1, index === value.length - 1);
        if (childLine && childLine.dataset) {
            childLine.dataset.parentId = lineId;
        }
    });

    const closeLine = document.createElement('div');
    closeLine.className = 'json-line';
    closeLine.dataset.parentId = lineId;
    closeLine.style.paddingLeft = (indent * 20) + 'px';
    closeLine.textContent = ']' + (isLast ? '' : ',');
    container.appendChild(closeLine);

    return line;
}

function renderObjectNode(value, line, container, key, indent, isLast) {
    const keys = Object.keys(value);
    const hasKeys = keys.length > 0;
    const lineId = 'line_' + (++nodeIdCounter);
    line.dataset.id = lineId;

    if (hasKeys) {
        const toggle = document.createElement('span');
        toggle.className = 'json-toggle expanded';
        toggle.onclick = createOptimizedToggle(line, lineId);
        line.appendChild(toggle);
    } else {
        const spacer = document.createElement('span');
        spacer.textContent = '  ';
        line.appendChild(spacer);
    }

    if (key) {
        const keySpan = document.createElement('span');
        keySpan.className = 'json-key-clickable';
        keySpan.textContent = `"${key}"`;
        keySpan.title = '点击复制此键的值';
        keySpan.onclick = async (e) => {
            e.stopPropagation();
            await copyText(JSON.stringify(value, null, 2));
            showCopyNotification(JSON.stringify(value, null, 2));
        };
        line.appendChild(keySpan);
        line.appendChild(document.createTextNode(': '));
    }

    const brace = document.createElement('span');
    brace.className = 'json-brace';
    brace.textContent = '{';
    line.appendChild(brace);

    if (hasKeys) {
        const count = document.createElement('span');
        count.className = 'json-count';
        count.textContent = `${keys.length} key${keys.length > 1 ? 's' : ''}`;
        line.appendChild(count);

        const ellipsis = document.createElement('span');
        ellipsis.className = 'json-ellipsis';
        ellipsis.textContent = '...';
        ellipsis.style.display = 'none';
        line.appendChild(ellipsis);
    }

    // Add action buttons using the new function
    addLineActions(line, value, lineId);

    container.appendChild(line);

    keys.forEach((k, index) => {
        const childLine = renderJsonNodeOptimized(value[k], container, k, indent + 1, index === keys.length - 1);
        if (childLine && childLine.dataset) {
            childLine.dataset.parentId = lineId;
        }
    });

    const closeLine = document.createElement('div');
    closeLine.className = 'json-line';
    closeLine.dataset.parentId = lineId;
    closeLine.style.paddingLeft = (indent * 20) + 'px';
    closeLine.textContent = '}' + (isLast ? '' : ',');
    container.appendChild(closeLine);

    return line;
}

function renderPrimitiveNode(value, line, container, key, isLast) {
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
            await copyText(JSON.stringify(value));
            showCopyNotification(JSON.stringify(value));
        };
        line.appendChild(keySpan);
        line.appendChild(document.createTextNode(': '));
    }

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
        line.appendChild(document.createTextNode(','));
    }

    // Add action buttons for primitive values too
    addLineActions(line, value, null);

    container.appendChild(line);
    return line;
}

/* =========================
 * Custom Tags Modal Handler
 * ========================= */

// Note: Variables sqlCustomTagsList, jsonCustomTagsList, and currentCustomTagsMode
// are declared in popup.js. We access them as global variables here.

/* ===== Modal functions ===== */
function openCustomTagsModal(mode) {
    window.currentCustomTagsMode = mode;
    const modal = document.getElementById('customTagsModal');
    const input = document.getElementById('customTagsInput');

    if (!modal || !input) return;

    // Load current tags
    const currentTags = mode === 'sql' ? window.sqlCustomTagsList : window.jsonCustomTagsList;
    input.value = currentTags.join(' ');

    modal.style.display = 'flex';
    input.focus();
}

function closeCustomTagsModal() {
    const modal = document.getElementById('customTagsModal');
    if (modal) modal.style.display = 'none';
}

function saveCustomTags() {
    const input = document.getElementById('customTagsInput');
    if (!input) return;

    // Parse input: split by space or comma, trim, filter empty
    const rawTags = input.value.split(/[\s,]+/).map(t => t.trim()).filter(Boolean);

    // Save to appropriate list
    if (window.currentCustomTagsMode === 'sql') {
        window.sqlCustomTagsList = rawTags;
        // Call autoSqlConvert if it exists
        if (typeof window.autoSqlConvert === 'function') {
            window.autoSqlConvert();
        }
    } else {
        window.jsonCustomTagsList = rawTags;
        // Call autoJsonConvert if it exists
        if (typeof window.autoJsonConvert === 'function') {
            window.autoJsonConvert();
        }
    }

    closeCustomTagsModal();
}

// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnSqlCustomTags')?.addEventListener('click', () => openCustomTagsModal('sql'));
    document.getElementById('btnJsonCustomTags')?.addEventListener('click', () => openCustomTagsModal('json'));
    document.getElementById('btnCancelCustomTags')?.addEventListener('click', closeCustomTagsModal);
    document.getElementById('btnSaveCustomTags')?.addEventListener('click', saveCustomTags);

    // Close modal on background click
    document.getElementById('customTagsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'customTagsModal') {
            closeCustomTagsModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('customTagsModal');
            if (modal && modal.style.display === 'flex') {
                closeCustomTagsModal();
            }
        }
    });
});

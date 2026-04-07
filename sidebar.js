/* Sidebar Toggle + Tooltips */
document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebarHeader = document.querySelector('.sidebar-header');
  if (!sidebar || !toggleBtn) return;

  /* ===== Collapse / Expand ===== */
  function setCollapsed(collapsed) {
    if (collapsed) {
      sidebar.classList.add('collapsed');
      toggleBtn.textContent = '▶';
    } else {
      sidebar.classList.remove('collapsed');
      toggleBtn.textContent = '◀';
    }
    try { localStorage.setItem('sidebar-collapsed', collapsed); } catch (e) { }
  }

  // Restore saved state
  try {
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      setCollapsed(true);
    }
  } catch (e) { }

  toggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    e.preventDefault();
    var isCollapsed = !sidebar.classList.contains('collapsed');
    setCollapsed(isCollapsed);
  });

  // Click on sidebar header (logo + title area) also toggles
  if (sidebarHeader) {
    sidebarHeader.addEventListener('click', function (e) {
      if (e.target === toggleBtn || toggleBtn.contains(e.target)) return;
      var isCollapsed = !sidebar.classList.contains('collapsed');
      setCollapsed(isCollapsed);
    });
  }

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle sidebar
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      var isCollapsed = !sidebar.classList.contains('collapsed');
      setCollapsed(isCollapsed);
    }
  });

  /* ===== JS Tooltip (bypasses overflow:hidden) ===== */
  var tooltip = document.createElement('div');
  tooltip.className = 'sidebar-js-tooltip';
  document.body.appendChild(tooltip);

  var tooltipTargets = sidebar.querySelectorAll('[data-tooltip]');
  var hideTimer = null;

  function showTooltip(el) {
    if (!sidebar.classList.contains('collapsed')) return;
    var text = el.getAttribute('data-tooltip');
    if (!text) return;
    tooltip.textContent = text;
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
    // Position to the right of the element
    var rect = el.getBoundingClientRect();
    tooltip.style.top = (rect.top + rect.height / 2) + 'px';
    tooltip.style.left = (rect.right + 8) + 'px';
  }

  function hideTooltip() {
    tooltip.style.opacity = '0';
    tooltip.style.visibility = 'hidden';
  }

  tooltipTargets.forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      clearTimeout(hideTimer);
      showTooltip(el);
    });
    el.addEventListener('mouseleave', function () {
      hideTimer = setTimeout(hideTooltip, 80);
    });
  });
});

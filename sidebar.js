/* Sidebar Toggle */
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  if (!sidebar || !toggleBtn) return;

  function setCollapsed(collapsed) {
    if (collapsed) {
      sidebar.classList.add('collapsed');
      toggleBtn.textContent = '▶';
    } else {
      sidebar.classList.remove('collapsed');
      toggleBtn.textContent = '◀';
    }
    try { localStorage.setItem('sidebar-collapsed', collapsed); } catch(e) {}
  }

  // Restore saved state
  try {
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
      setCollapsed(true);
    }
  } catch(e) {}

  toggleBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    var isCollapsed = !sidebar.classList.contains('collapsed');
    setCollapsed(isCollapsed);
  });

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle sidebar
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      var isCollapsed = !sidebar.classList.contains('collapsed');
      setCollapsed(isCollapsed);
    }
  });
});

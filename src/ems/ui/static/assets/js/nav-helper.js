// Navigation helper for Settings and Pages

function addBreadcrumb(pageName, pageType = 'settings') {
  const container = document.querySelector('.max-w-7xl');
  if (!container) return;
  
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'flex items-center gap-3 mb-4';
  breadcrumb.innerHTML = `
    <a href="/ui" class="text-blue-600 dark:text-blue-400 hover:underline">← Dashboard</a>
    <span class="text-gray-400">|</span>
    <a href="/ui" onclick="showView('${pageType}'); return false;" class="text-blue-600 dark:text-blue-400 hover:underline">${pageType === 'settings' ? 'Settings' : 'Pages'}</a>
    <span class="text-gray-400">|</span>
    <span class="text-gray-600 dark:text-gray-400">${pageName}</span>
  `;
  
  const h1 = container.querySelector('h1');
  if (h1 && !container.querySelector('.flex.items-center.gap-3')) {
    container.insertBefore(breadcrumb, h1);
  }
}

function addSettingsNav() {
  const container = document.querySelector('.max-w-7xl');
  if (!container) return;
  
  const nav = document.createElement('div');
  nav.className = 'bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6';
  nav.innerHTML = `
    <div class="text-sm text-gray-500 mb-2">Quick Navigation</div>
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
      <a href="/ui/settings/org" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Org</a>
      <a href="/ui/settings/rbac" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">RBAC</a>
      <a href="/ui/settings/identity" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Identity</a>
      <a href="/ui/settings/profiles" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Profiles</a>
      <a href="/ui/settings/network" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Network</a>
      <a href="/ui/settings/automation-policies" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Auto</a>
      <a href="/ui/settings/ems-policies" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">EMS</a>
      <a href="/ui/settings/tariffs" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Tariffs</a>
      <a href="/ui/settings/reports" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Reports</a>
      <a href="/ui/settings/storage" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Storage</a>
      <a href="/ui/settings/integrations" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">API</a>
      <a href="/ui/settings/ota" class="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">OTA</a>
    </div>
  `;
  
  const h1 = container.querySelector('h1');
  if (h1 && !container.querySelector('.grid.grid-cols-2')) {
    container.insertBefore(nav, h1);
  }
}

// Auto-apply to current page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('/ui/settings/')) {
    const pageName = path.split('/').pop();
    const pageNames = {
      'org': 'Organizasyon',
      'rbac': 'RBAC', 
      'identity': 'Kimlik & Güvenlik',
      'profiles': 'Profiller',
      'network': 'Ağ & Protokoller',
      'automation-policies': 'Otomasyon Politikaları',
      'ems-policies': 'EMS Politikaları',
      'tariffs': 'Tarifeler',
      'reports': 'Raporlama',
      'storage': 'Veri Saklama',
      'integrations': 'Entegrasyonlar',
      'ota': 'OTA & Bakım',
      'alert-templates': 'Alarm Şablonları',
      'calibration': 'Kalibrasyon',
      'compliance': 'Uyumluluk',
      'ui-prefs': 'UI Tercihleri',
      'health': 'Sağlık'
    };
    
    addBreadcrumb(pageNames[pageName] || pageName, 'settings');
    addSettingsNav();
    
  } else if (path.includes('/ui/pages/')) {
    const pageName = path.split('/').pop();
    const pageNames = {
      'alerts-center': 'Alarm Merkezi',
      'transformer-grid': 'Trafo & Şebeke',
      'health-sla': 'Sağlık & SLA'
    };
    
    addBreadcrumb(pageNames[pageName] || pageName, 'pages');
  }
});

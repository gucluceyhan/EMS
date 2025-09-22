// Integrations CRUD operations

let apiKeys = [
  { id: 1, name: 'Production API', key: '****abcd', scope: 'read', ip: '10.0.0.0/8', expiry: '2026-01-01' },
  { id: 2, name: 'Dashboard API', key: '****efgh', scope: 'read,write', ip: '192.168.1.0/24', expiry: '2025-12-31' },
];

let webhooks = [
  { id: 1, name: 'Alert Webhook', url: 'https://example.com/webhook', secret: '****xyz', events: 'alarms,controls' },
];

function renderAPIKeys() {
  const tbody = document.querySelector('#apiKeysTable tbody') || document.querySelector('tbody');
  if (!tbody) return;
  
  tbody.innerHTML = apiKeys.map(k => `
    <tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2">${k.name}</td>
      <td class="px-3 py-2">${k.key}</td>
      <td class="px-3 py-2">${k.scope}</td>
      <td class="px-3 py-2">${k.ip}</td>
      <td class="px-3 py-2">${k.expiry}</td>
      <td class="px-3 py-2">
        <button onclick="editAPIKey(${k.id})" class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Edit</button>
        <button onclick="deleteAPIKey(${k.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
      </td>
    </tr>
  `).join('');
}

function newAPIKey() {
  const name = prompt('API Key adı:') || 'New API Key';
  const scope = prompt('Scope (read/write):') || 'read';
  const ip = prompt('IP restriction (CIDR):') || '0.0.0.0/0';
  
  const newId = Math.max(...apiKeys.map(k => k.id)) + 1;
  const key = '****' + Math.random().toString(36).substr(2, 4);
  
  apiKeys.push({
    id: newId,
    name,
    key,
    scope,
    ip,
    expiry: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
  });
  
  renderAPIKeys();
  showSuccess('Yeni API key oluşturuldu.');
}

function editAPIKey(id) {
  const key = apiKeys.find(k => k.id === id);
  if (!key) return;
  
  const newScope = prompt('Scope:', key.scope);
  const newIP = prompt('IP restriction:', key.ip);
  
  if (newScope !== null) key.scope = newScope;
  if (newIP !== null) key.ip = newIP;
  
  renderAPIKeys();
  showSuccess('API key güncellendi.');
}

function deleteAPIKey(id) {
  if (!confirm('Bu API key\'i silmek istediğinizden emin misiniz?')) return;
  
  apiKeys = apiKeys.filter(k => k.id !== id);
  renderAPIKeys();
  showSuccess('API key silindi.');
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 z-50';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAPIKeys();
  
  // Add "Yeni Key" button functionality
  const newBtn = document.querySelector('button[class*="bg-brand-600"]');
  if (newBtn && newBtn.textContent.includes('Yeni Key')) {
    newBtn.onclick = newAPIKey;
  }
});

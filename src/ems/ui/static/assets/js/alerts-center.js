// Alerts Center with full CRUD operations

let alerts = [
  { id: 1, time: new Date().toLocaleString('tr-TR'), device: 'TMŞ-3', type: 'Trip', severity: 'High', message: 'Overcurrent', status: 'active' },
  { id: 2, time: new Date(Date.now()-3600000).toLocaleString('tr-TR'), device: 'TMŞ-1', type: 'Undervoltage', severity: 'Medium', message: 'L2 195V', status: 'acked' },
  { id: 3, time: new Date(Date.now()-7200000).toLocaleString('tr-TR'), device: 'INV-1', type: 'Overtemp', severity: 'Low', message: 'Cabinet 65°C', status: 'resolved' },
];

function renderAlerts() {
  const tbody = document.getElementById('alertsTBody');
  if (!tbody) return;
  
  const badge = (s) => {
    const colors = {
      'High': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
      'Medium': 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
      'Low': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
    };
    return `<span class="inline-flex px-2 py-0.5 rounded-full text-xs ${colors[s]}">${s}</span>`;
  };
  
  const statusBadge = (s) => {
    const colors = {
      'active': 'bg-red-100 text-red-800',
      'acked': 'bg-amber-100 text-amber-800', 
      'resolved': 'bg-gray-100 text-gray-800'
    };
    return `<span class="inline-flex px-2 py-0.5 rounded-full text-xs ${colors[s]}">${s}</span>`;
  };
  
  tbody.innerHTML = alerts.map(a => `
    <tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2">${a.time}</td>
      <td class="px-3 py-2">${a.device}</td>
      <td class="px-3 py-2">${a.type}</td>
      <td class="px-3 py-2">${badge(a.severity)}</td>
      <td class="px-3 py-2">${a.message}</td>
      <td class="px-3 py-2">
        ${a.status === 'active' ? `<button onclick="ackAlert(${a.id})" class="px-2 py-1 text-xs rounded-md bg-blue-600 text-white">Ack</button>` : ''}
        ${a.status === 'acked' ? `<button onclick="resolveAlert(${a.id})" class="px-2 py-1 text-xs rounded-md bg-green-600 text-white">Resolve</button>` : ''}
        <button onclick="deleteAlert(${a.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
      </td>
    </tr>
  `).join('');
}

function ackAlert(id) {
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.status = 'acked';
    renderAlerts();
    showSuccess(`Alarm ${alert.device} acknowledged.`);
  }
}

function resolveAlert(id) {
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.status = 'resolved';
    renderAlerts();
    showSuccess(`Alarm ${alert.device} resolved.`);
  }
}

function deleteAlert(id) {
  if (!confirm('Bu alarmı silmek istediğinizden emin misiniz?')) return;
  
  alerts = alerts.filter(a => a.id !== id);
  renderAlerts();
  showSuccess('Alarm silindi.');
}

function filterAlerts() {
  const search = document.getElementById('alertSearch')?.value.toLowerCase() || '';
  const severity = document.getElementById('sev')?.value || 'All';
  
  let filtered = alerts;
  
  if (search) {
    filtered = filtered.filter(a => 
      a.device.toLowerCase().includes(search) || 
      a.message.toLowerCase().includes(search)
    );
  }
  
  if (severity !== 'All') {
    filtered = filtered.filter(a => a.severity === severity);
  }
  
  // Re-render with filtered data
  const tbody = document.getElementById('alertsTBody');
  if (tbody) {
    const badge = (s) => {
      const colors = {
        'High': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
        'Medium': 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
        'Low': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'
      };
      return `<span class="inline-flex px-2 py-0.5 rounded-full text-xs ${colors[s]}">${s}</span>`;
    };
    
    tbody.innerHTML = filtered.map(a => `
      <tr class="border-b border-gray-200 dark:border-gray-800">
        <td class="px-3 py-2">${a.time}</td>
        <td class="px-3 py-2">${a.device}</td>
        <td class="px-3 py-2">${a.type}</td>
        <td class="px-3 py-2">${badge(a.severity)}</td>
        <td class="px-3 py-2">${a.message}</td>
        <td class="px-3 py-2">
          ${a.status === 'active' ? `<button onclick="ackAlert(${a.id})" class="px-2 py-1 text-xs rounded-md bg-blue-600 text-white">Ack</button>` : ''}
          ${a.status === 'acked' ? `<button onclick="resolveAlert(${a.id})" class="px-2 py-1 text-xs rounded-md bg-green-600 text-white">Resolve</button>` : ''}
          <button onclick="deleteAlert(${a.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
        </td>
      </tr>
    `).join('');
  }
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 z-50';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAlerts();
  
  // Bind search and filter
  const search = document.getElementById('alertSearch');
  if (search) search.addEventListener('input', filterAlerts);
  
  const sevFilter = document.getElementById('sev');
  if (sevFilter) sevFilter.addEventListener('change', filterAlerts);
});
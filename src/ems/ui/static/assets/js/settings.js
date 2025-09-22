// Minimal placeholder interactions for Settings pages
document.addEventListener('DOMContentLoaded', () => {
  // Profiles list mock
  const tbody = document.getElementById('profilesTBody');
  if (tbody) {
    const rows = [
      { vendor: 'Generic', model: 'SunSpec-103', proto: 'Modbus', ver: '1.2' },
      { vendor: 'IEC', model: '62053', proto: 'Modbus', ver: '1.0' },
    ];
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-200 dark:border-gray-800';
      tr.innerHTML = `<td class="px-3 py-2">${r.vendor}</td>
                      <td class="px-3 py-2">${r.model}</td>
                      <td class="px-3 py-2">${r.proto}</td>
                      <td class="px-3 py-2">${r.ver}</td>
                      <td class="px-3 py-2"><button class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Detay</button></td>`;
      tbody.appendChild(tr);
    });
  }
});



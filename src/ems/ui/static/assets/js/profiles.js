// Profiles Library – minimal scaffold (UI only)

document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('profilesTBody');
  if (!tbody) return;
  const items = [
    { vendor: 'Generic', model: 'SunSpec-103', proto: 'Modbus', version: '1.2', signals: 120 },
    { vendor: 'IEC', model: '62053', proto: 'Modbus', version: '1.0', signals: 64 },
  ];
  const row = (p) => `<tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2">${p.vendor}</td>
      <td class="px-3 py-2">${p.model}</td>
      <td class="px-3 py-2">${p.proto}</td>
      <td class="px-3 py-2">${p.version}</td>
      <td class="px-3 py-2">
        <button class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Diff</button>
        <button class="px-2 py-1 text-xs rounded-md ml-1 bg-brand-600 text-white">Migrate</button>
      </td>
    </tr>`;
  tbody.innerHTML = items.map(row).join('');
});




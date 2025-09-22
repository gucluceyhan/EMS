document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('rbacTBody');
  if (!tbody) return;
  const rows = [
    { role: 'Global Admin', map: true, ctrl: true, samp: true, publish: true, secrets: true, dual: true },
    { role: 'Regional Manager', map: true, ctrl: true, samp: true, publish: true, secrets: false, dual: true },
    { role: 'Site Operator', map: true, ctrl: true, samp: false, publish: false, secrets: false, dual: true },
    { role: 'Viewer', map: false, ctrl: false, samp: false, publish: false, secrets: false, dual: false },
    { role: 'Security', map: false, ctrl: false, samp: false, publish: false, secrets: false, dual: true },
  ];
  const chip = (v)=> `<span class="inline-flex px-2 py-0.5 rounded-full text-xs ${v?'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300':'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}">${v?'ON':'OFF'}</span>`;
  tbody.innerHTML = rows.map(r => `
    <tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2 font-medium">${r.role}</td>
      <td class="px-3 py-2">${chip(r.map)}</td>
      <td class="px-3 py-2">${chip(r.ctrl)}</td>
      <td class="px-3 py-2">${chip(r.samp)}</td>
      <td class="px-3 py-2">${chip(r.publish)}</td>
      <td class="px-3 py-2">${chip(r.secrets)}</td>
      <td class="px-3 py-2">${chip(r.dual)}</td>
    </tr>`).join('');
});



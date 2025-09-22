document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('alertsTBody');
  if (!tbody) return;
  const rows = [
    { t:'2025-09-22 10:00', dev:'TMŞ-3', type:'Trip', sev:'High', msg:'Overcurrent' },
    { t:'2025-09-22 09:42', dev:'TMŞ-1', type:'Undervoltage', sev:'Medium', msg:'L2 195V' },
  ];
  const badge = (s)=>`<span class="inline-flex px-2 py-0.5 rounded-full text-xs ${s==='High'?'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300':s==='Medium'?'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300':'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300'}">${s}</span>`;
  tbody.innerHTML = rows.map(r=>`<tr class="border-b border-gray-200 dark:border-gray-800"><td class="px-3 py-2">${r.t}</td><td class="px-3 py-2">${r.dev}</td><td class="px-3 py-2">${r.type}</td><td class="px-3 py-2">${badge(r.sev)}</td><td class="px-3 py-2">${r.msg}</td><td class="px-3 py-2"><button class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Ack</button></td></tr>`).join('');
});



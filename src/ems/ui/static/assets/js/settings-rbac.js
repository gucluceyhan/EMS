// RBAC with CRUD operations

let roles = [
  { id: 1, role: 'Global Admin', map: true, ctrl: true, samp: true, publish: true, secrets: true, dual: true },
  { id: 2, role: 'Regional Manager', map: true, ctrl: true, samp: true, publish: true, secrets: false, dual: true },
  { id: 3, role: 'Site Operator', map: true, ctrl: true, samp: false, publish: false, secrets: false, dual: true },
  { id: 4, role: 'Viewer', map: false, ctrl: false, samp: false, publish: false, secrets: false, dual: false },
  { id: 5, role: 'Security', map: false, ctrl: false, samp: false, publish: false, secrets: false, dual: true },
];

function renderRoles() {
  const tbody = document.getElementById('rbacTBody');
  if (!tbody) return;
  
  const chip = (v) => `<span class="inline-flex px-2 py-0.5 rounded-full text-xs ${v?'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300':'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}">${v?'ON':'OFF'}</span>`;
  
  tbody.innerHTML = roles.map(r => `
    <tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2 font-medium">${r.role}</td>
      <td class="px-3 py-2">${chip(r.map)}</td>
      <td class="px-3 py-2">${chip(r.ctrl)}</td>
      <td class="px-3 py-2">${chip(r.samp)}</td>
      <td class="px-3 py-2">${chip(r.publish)}</td>
      <td class="px-3 py-2">${chip(r.secrets)}</td>
      <td class="px-3 py-2">${chip(r.dual)}</td>
      <td class="px-3 py-2">
        <button onclick="editRole(${r.id})" class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Edit</button>
        <button onclick="deleteRole(${r.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
      </td>
    </tr>
  `).join('');
}

function newRole() {
  const name = prompt('Rol adı:') || 'Custom Role';
  const newId = Math.max(...roles.map(r => r.id)) + 1;
  
  roles.push({
    id: newId,
    role: name,
    map: false,
    ctrl: false,
    samp: false,
    publish: false,
    secrets: false,
    dual: false
  });
  
  renderRoles();
  showSuccess('Yeni rol eklendi.');
}

function editRole(id) {
  const role = roles.find(r => r.id === id);
  if (!role) return;
  
  const newName = prompt('Rol adı:', role.role);
  if (newName !== null) {
    role.role = newName;
    
    // Simple permission toggles
    role.map = confirm('Mapping Edit izni?');
    role.ctrl = confirm('Execute Control izni?');
    role.samp = confirm('Change Sampling izni?');
    role.publish = confirm('Publish Profile izni?');
    role.secrets = confirm('Secrets Access izni?');
    role.dual = confirm('Dual Approval izni?');
    
    renderRoles();
    showSuccess('Rol güncellendi.');
  }
}

function deleteRole(id) {
  const role = roles.find(r => r.id === id);
  if (!role) return;
  
  if (!confirm(`"${role.role}" rolünü silmek istediğinizden emin misiniz?`)) return;
  
  roles = roles.filter(r => r.id !== id);
  renderRoles();
  showSuccess('Rol silindi.');
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 z-50';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderRoles();
  
  // Add "Yeni Rol" button functionality
  const newRoleBtn = document.querySelector('button[class*="bg-brand-600"]');
  if (newRoleBtn && newRoleBtn.textContent.includes('Yeni Rol')) {
    newRoleBtn.onclick = newRole;
  }
});
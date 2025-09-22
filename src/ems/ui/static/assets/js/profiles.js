// Profiles Library with full CRUD operations

let profiles = [
  { id: 1, vendor: 'Generic', model: 'SunSpec-103', proto: 'Modbus', version: '1.2', signals: 120 },
  { id: 2, vendor: 'IEC', model: '62053', proto: 'Modbus', version: '1.0', signals: 64 },
];

function renderProfiles() {
  const tbody = document.getElementById('profilesTBody');
  if (!tbody) return;
  
  const row = (p) => `<tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2">${p.vendor}</td>
      <td class="px-3 py-2">${p.model}</td>
      <td class="px-3 py-2">${p.proto}</td>
      <td class="px-3 py-2">${p.version}</td>
      <td class="px-3 py-2">
        <button onclick="editProfile(${p.id})" class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Edit</button>
        <button onclick="diffProfile(${p.id})" class="px-2 py-1 text-xs rounded-md ml-1 border border-gray-200 dark:border-gray-700">Diff</button>
        <button onclick="migrateProfile(${p.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-blue-600 text-white">Migrate</button>
        <button onclick="deleteProfile(${p.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
      </td>
    </tr>`;
  tbody.innerHTML = profiles.map(row).join('');
}

function newProfile() {
  const vendor = prompt('Vendor:') || 'Generic';
  const model = prompt('Model:') || 'Unknown';
  const proto = prompt('Protocol:') || 'Modbus';
  const version = prompt('Version:') || '1.0';
  
  const newId = Math.max(...profiles.map(p => p.id)) + 1;
  profiles.push({ id: newId, vendor, model, proto, version, signals: 50 });
  renderProfiles();
  showSuccess('Yeni profil eklendi.');
}

function editProfile(id) {
  const profile = profiles.find(p => p.id === id);
  if (!profile) return;
  
  const newVendor = prompt('Vendor:', profile.vendor);
  const newModel = prompt('Model:', profile.model);
  
  if (newVendor !== null) profile.vendor = newVendor;
  if (newModel !== null) profile.model = newModel;
  
  renderProfiles();
  showSuccess('Profil güncellendi.');
}

function deleteProfile(id) {
  if (!confirm('Bu profili silmek istediğinizden emin misiniz?')) return;
  
  profiles = profiles.filter(p => p.id !== id);
  renderProfiles();
  showSuccess('Profil silindi.');
}

function diffProfile(id) {
  const profile = profiles.find(p => p.id === id);
  alert(`Diff: ${profile.vendor} ${profile.model}\n- 5 sites affected\n- 12 devices using this profile`);
}

function migrateProfile(id) {
  const profile = profiles.find(p => p.id === id);
  if (confirm(`${profile.vendor} ${profile.model} profilini migrate et?`)) {
    showSuccess('Migration başlatıldı (mock).');
  }
}

function importProfile() {
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = '.json,.yaml';
  file.onchange = (e) => {
    const fileName = e.target.files[0]?.name || 'unknown';
    showSuccess(`Profil import edildi: ${fileName} (mock)`);
  };
  file.click();
}

function showSuccess(message) {
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 z-50';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
  renderProfiles();
  
  const btnNew = document.getElementById('btnNewProfile');
  if (btnNew) btnNew.onclick = newProfile;
  
  const btnImport = document.getElementById('btnImportProfile');
  if (btnImport) btnImport.onclick = importProfile;
  
  const search = document.getElementById('profileSearch');
  if (search) {
    search.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtered = profiles.filter(p => 
        p.vendor.toLowerCase().includes(query) || 
        p.model.toLowerCase().includes(query)
      );
      const tbody = document.getElementById('profilesTBody');
      if (tbody) {
        const row = (p) => `<tr class="border-b border-gray-200 dark:border-gray-800">
            <td class="px-3 py-2">${p.vendor}</td>
            <td class="px-3 py-2">${p.model}</td>
            <td class="px-3 py-2">${p.proto}</td>
            <td class="px-3 py-2">${p.version}</td>
            <td class="px-3 py-2">
              <button onclick="editProfile(${p.id})" class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Edit</button>
              <button onclick="diffProfile(${p.id})" class="px-2 py-1 text-xs rounded-md ml-1 border border-gray-200 dark:border-gray-700">Diff</button>
              <button onclick="migrateProfile(${p.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-blue-600 text-white">Migrate</button>
              <button onclick="deleteProfile(${p.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
            </td>
          </tr>`;
        tbody.innerHTML = filtered.map(row).join('');
      }
    });
  }
});




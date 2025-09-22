// Tariffs CRUD operations

let tariffRules = [
  { id: 1, season: 'Yaz', timeRange: '10:00–18:00', price: '2.1 TRY/kWh', type: 'peak' },
  { id: 2, season: 'Yaz', timeRange: '18:00–22:00', price: '1.8 TRY/kWh', type: 'mid' },
  { id: 3, season: 'Kış', timeRange: '07:00–19:00', price: '1.9 TRY/kWh', type: 'peak' },
];

function renderTariffs() {
  const tbody = document.querySelector('tbody');
  if (!tbody) return;
  
  tbody.innerHTML = tariffRules.map(t => `
    <tr class="border-b border-gray-200 dark:border-gray-800">
      <td class="px-3 py-2">${t.season}</td>
      <td class="px-3 py-2">${t.timeRange}</td>
      <td class="px-3 py-2">${t.price}</td>
      <td class="px-3 py-2">
        <button onclick="editTariff(${t.id})" class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Edit</button>
        <button onclick="deleteTariff(${t.id})" class="px-2 py-1 text-xs rounded-md ml-1 bg-red-600 text-white">Delete</button>
      </td>
    </tr>
  `).join('');
}

function newTariff() {
  const season = prompt('Sezon (Yaz/Kış):') || 'Yaz';
  const timeRange = prompt('Saat aralığı:') || '00:00–23:59';
  const price = prompt('Fiyat (TRY/kWh):') || '1.5';
  
  const newId = Math.max(...tariffRules.map(t => t.id)) + 1;
  tariffRules.push({ id: newId, season, timeRange, price, type: 'custom' });
  renderTariffs();
  showSuccess('Yeni tarife kuralı eklendi.');
}

function editTariff(id) {
  const tariff = tariffRules.find(t => t.id === id);
  if (!tariff) return;
  
  const newPrice = prompt('Yeni fiyat:', tariff.price);
  if (newPrice !== null) {
    tariff.price = newPrice;
    renderTariffs();
    showSuccess('Tarife güncellendi.');
  }
}

function deleteTariff(id) {
  if (!confirm('Bu tarife kuralını silmek istediğinizden emin misiniz?')) return;
  
  tariffRules = tariffRules.filter(t => t.id !== id);
  renderTariffs();
  showSuccess('Tarife kuralı silindi.');
}

function importCSV() {
  const file = document.createElement('input');
  file.type = 'file';
  file.accept = '.csv';
  file.onchange = (e) => {
    const fileName = e.target.files[0]?.name || 'unknown.csv';
    showSuccess(`Tarife CSV import edildi: ${fileName} (mock)`);
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
  renderTariffs();
  
  // Bind CSV upload button
  const csvBtn = document.querySelector('button[class*="border"]');
  if (csvBtn && csvBtn.textContent.includes('CSV')) {
    csvBtn.onclick = importCSV;
  }
  
  // Add "Yeni Kural" button
  const container = document.querySelector('.bg-white');
  if (container) {
    const newBtn = document.createElement('button');
    newBtn.className = 'mt-3 px-3 py-2 rounded-md bg-blue-600 text-white';
    newBtn.textContent = 'Yeni Tarife Kuralı';
    newBtn.onclick = newTariff;
    container.appendChild(newBtn);
  }
});

// Settings pages form handling and interactions

document.addEventListener('DOMContentLoaded', () => {
  // Profiles table (if exists)
  const tbody = document.getElementById('profilesTBody');
  if (tbody) {
    const rows = [
      { vendor: 'Generic', model: 'SunSpec-103', proto: 'Modbus', ver: '1.2' },
      { vendor: 'IEC', model: '62053', proto: 'Modbus', ver: '1.0' },
    ];
    tbody.innerHTML = '';
    rows.forEach((r) => {
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

  // Organization form save
  const btnSaveOrg = document.getElementById('btnSaveOrg');
  if (btnSaveOrg) {
    btnSaveOrg.addEventListener('click', () => {
      const form = btnSaveOrg.closest('.bg-white');
      const inputs = form.querySelectorAll('input, select');
      const data = {};
      
      inputs.forEach(input => {
        const label = input.closest('label')?.textContent || input.placeholder || 'field';
        data[label] = input.value;
      });
      
      // Save to localStorage
      localStorage.setItem('ems_org_settings', JSON.stringify(data));
      
      // Show success message
      const result = document.getElementById('saveResult');
      if (result) {
        result.className = 'mt-2 text-sm text-green-600 dark:text-green-400';
        result.textContent = '✓ Organizasyon ayarları başarıyla kaydedildi.';
        result.classList.remove('hidden');
        setTimeout(() => result.classList.add('hidden'), 3000);
      }
    });
  }

  // Generic save handler for other settings pages
  const saveButtons = document.querySelectorAll('button');
  saveButtons.forEach(btn => {
    if (btn.textContent.includes('Kaydet') || btn.textContent.includes('Save')) {
      btn.addEventListener('click', () => {
        const form = btn.closest('.bg-white') || btn.closest('body');
        const inputs = form.querySelectorAll('input, select, textarea');
        const data = {};
        
        inputs.forEach(input => {
          const label = input.closest('label')?.textContent?.split('<')[0] || 
                       input.placeholder || 
                       input.id || 
                       'field';
          if (input.type === 'checkbox') {
            data[label] = input.checked;
          } else {
            data[label] = input.value;
          }
        });
        
        // Save to localStorage with page-specific key
        const pageKey = `ems_settings_${window.location.pathname.split('/').pop()}`;
        localStorage.setItem(pageKey, JSON.stringify(data));
        
        // Show success feedback
        let result = document.getElementById('saveResult');
        if (!result) {
          result = document.createElement('div');
          result.id = 'saveResult';
          btn.parentNode.appendChild(result);
        }
        
        result.className = 'mt-2 text-sm text-green-600 dark:text-green-400';
        result.textContent = '✓ Ayarlar başarıyla kaydedildi.';
        result.classList.remove('hidden');
        setTimeout(() => result.classList.add('hidden'), 3000);
        
        // Optional: Send to API
        if (window.location.pathname.includes('org')) {
          console.log('Org settings saved:', data);
        }
      });
    }
  });

  // Load saved settings on page load
  const pageKey = `ems_settings_${window.location.pathname.split('/').pop()}`;
  const saved = localStorage.getItem(pageKey);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const label = input.closest('label')?.textContent?.split('<')[0] || 
                     input.placeholder || 
                     input.id;
        if (data[label] !== undefined) {
          if (input.type === 'checkbox') {
            input.checked = data[label];
          } else {
            input.value = data[label];
          }
        }
      });
    } catch (e) {
      console.warn('Failed to load saved settings:', e);
    }
  }
});
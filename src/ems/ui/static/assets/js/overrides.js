// Overrides visualization: info bar + revert-to-profile

class OverridesManager {
  constructor() {
    this.profileDefaults = {};
    this.siteOverrides = {};
    this.deviceOverrides = {};
  }

  loadOverrides(deviceId) {
    // Mock load from localStorage/API
    const stored = localStorage.getItem(`overrides_${deviceId}`);
    return stored ? JSON.parse(stored) : {};
  }

  saveOverrides(deviceId, overrides) {
    localStorage.setItem(`overrides_${deviceId}`, JSON.stringify(overrides));
  }

  renderInfoBar(deviceId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const overrides = this.loadOverrides(deviceId);
    const overrideCount = Object.keys(overrides).length;
    const profileName = overrides._profile || 'Generic SunSpec-103 v1.2';

    container.innerHTML = `
      <div class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div class="flex items-center gap-2">
          <span class="text-blue-800 dark:text-blue-300 text-sm">
            📋 Using ${profileName}
          </span>
          ${overrideCount > 0 ? `
            <span class="inline-flex px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
              ${overrideCount} overrides
            </span>
          ` : `
            <span class="inline-flex px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
              Profile defaults
            </span>
          `}
        </div>
        <button onclick="OverridesManager.showOverridesModal('${deviceId}')" class="px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-300">
          Manage Overrides
        </button>
      </div>
    `;
  }

  static showOverridesModal(deviceId) {
    const modal = document.getElementById('overridesModal') || this.createOverridesModal();
    const manager = new OverridesManager();
    const overrides = manager.loadOverrides(deviceId);
    
    document.getElementById('overridesTitle').textContent = `Overrides: ${deviceId}`;
    
    // Mock profile fields
    const fields = [
      { name: 'poll_interval_s', profileDefault: 60, current: overrides.poll_interval_s || 60, unit: 's' },
      { name: 'timeout_ms', profileDefault: 2000, current: overrides.timeout_ms || 2000, unit: 'ms' },
      { name: 'retries', profileDefault: 3, current: overrides.retries || 3, unit: '' },
      { name: 'scale_factor', profileDefault: 1.0, current: overrides.scale_factor || 1.0, unit: '' }
    ];

    const tbody = document.getElementById('overridesTBody');
    tbody.innerHTML = fields.map(f => {
      const isOverridden = f.current !== f.profileDefault;
      const badge = isOverridden ? 
        '<span class="inline-flex px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">Overridden</span>' :
        '<span class="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">Default</span>';
      
      return `
        <tr class="border-b border-gray-200 dark:border-gray-800">
          <td class="px-3 py-2 font-medium">${f.name}</td>
          <td class="px-3 py-2 text-gray-500">${f.profileDefault} ${f.unit}</td>
          <td class="px-3 py-2">
            <input type="number" value="${f.current}" data-field="${f.name}" 
                   class="w-24 bg-transparent border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm" />
            ${f.unit}
          </td>
          <td class="px-3 py-2">${badge}</td>
          <td class="px-3 py-2">
            <button onclick="OverridesManager.revertField('${deviceId}', '${f.name}', ${f.profileDefault})" 
                    class="px-2 py-1 text-xs rounded border border-gray-200 dark:border-gray-700">
              Revert
            </button>
          </td>
        </tr>
      `;
    }).join('');

    modal.classList.remove('hidden');
  }

  static revertField(deviceId, fieldName, profileDefault) {
    const manager = new OverridesManager();
    const overrides = manager.loadOverrides(deviceId);
    delete overrides[fieldName];
    manager.saveOverrides(deviceId, overrides);
    
    // Update input value
    const input = document.querySelector(`input[data-field="${fieldName}"]`);
    if (input) input.value = profileDefault;
    
    // Refresh info bar
    manager.renderInfoBar(deviceId, 'deviceInfoBar');
    
    // Re-render modal
    this.showOverridesModal(deviceId);
  }

  static createOverridesModal() {
    const modal = document.createElement('div');
    modal.id = 'overridesModal';
    modal.className = 'fixed inset-0 hidden flex items-center justify-center bg-black/50 z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h4 id="overridesTitle" class="font-semibold">Device Overrides</h4>
          <button onclick="document.getElementById('overridesModal').classList.add('hidden')" 
                  class="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-sm">Close</button>
        </div>
        <div class="p-4 overflow-y-auto max-h-[70vh]">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-800 text-white uppercase tracking-wide text-xs">
              <tr>
                <th class="px-3 py-2 text-left">Field</th>
                <th class="px-3 py-2 text-left">Profile Default</th>
                <th class="px-3 py-2 text-left">Current Value</th>
                <th class="px-3 py-2 text-left">Status</th>
                <th class="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody id="overridesTBody"></tbody>
          </table>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }
}

// Global access
window.OverridesManager = OverridesManager;

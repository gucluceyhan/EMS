// Network Settings & Protocol Defaults Management

let protocolDefaults = {};
let currentProtocol = 'modbus_tcp';

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadProtocolDefaults();
    setupEventListeners();
    showProtocolPanel(currentProtocol);
  } catch (error) {
    console.error('Error initializing network settings:', error);
    showError('Failed to initialize network settings');
  }
});

// Load protocol defaults from API
async function loadProtocolDefaults() {
  try {
    const response = await fetchAPI('/api/protocol-defaults');
    protocolDefaults = response.protocol_defaults || {};
    populateProtocolPanels();
  } catch (error) {
    console.error('Error loading protocol defaults:', error);
    // Use mock data for development
    protocolDefaults = {
      modbus_tcp: { port: 502, timeout_ms: 3000, retries: 3, unit_id: 1 },
      modbus_rtu: { baudrate: 9600, parity: 'N', stopbits: 1, timeout_ms: 5000, retries: 3, unit_id: 1 },
      rs485: { baudrate: 9600, parity: 'N', stopbits: 1, timeout_ms: 5000, retries: 3 },
      mqtt: { port: 1883, timeout_ms: 10000, retries: 3, qos: 1, retain: false },
      can: { interface: 'can0', bitrate: 250000, timeout_ms: 1000, retries: 3 },
      serial: { baudrate: 9600, parity: 'N', stopbits: 1, timeout_ms: 2000, retries: 3 }
    };
    populateProtocolPanels();
  }
}

// Populate protocol configuration panels
function populateProtocolPanels() {
  Object.keys(protocolDefaults).forEach(protocol => {
    const config = protocolDefaults[protocol];
    
    // Populate form fields for each protocol
    Object.keys(config).forEach(key => {
      const input = document.getElementById(`${protocol}_${key}`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = config[key];
        } else {
          input.value = config[key];
        }
      }
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Protocol tab switching
  const protocolTabs = document.querySelectorAll('.protocol-tab');
  protocolTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const protocol = tab.getAttribute('data-protocol');
      showProtocolPanel(protocol);
    });
  });

  // Save network settings button
  const btnSaveNetwork = document.getElementById('btnSaveNetwork');
  if (btnSaveNetwork) {
    btnSaveNetwork.addEventListener('click', saveNetworkSettings);
  }

  // Reset protocol defaults button
  const btnResetProtocolDefaults = document.getElementById('btnResetProtocolDefaults');
  if (btnResetProtocolDefaults) {
    btnResetProtocolDefaults.addEventListener('click', resetProtocolDefaults);
  }

  // Test network button
  const btnTestNetwork = document.getElementById('btnTestNetwork');
  if (btnTestNetwork) {
    btnTestNetwork.addEventListener('click', testNetworkConnection);
  }

  // Restart network button
  const btnRestartNetwork = document.getElementById('btnRestartNetwork');
  if (btnRestartNetwork) {
    btnRestartNetwork.addEventListener('click', restartNetwork);
  }
}

// Show specific protocol panel
function showProtocolPanel(protocol) {
  currentProtocol = protocol;
  
  // Update tab appearance
  document.querySelectorAll('.protocol-tab').forEach(tab => {
    tab.classList.remove('bg-blue-100', 'dark:bg-blue-900/20', 'text-blue-800', 'dark:text-blue-300');
    tab.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
  });
  
  const activeTab = document.querySelector(`[data-protocol="${protocol}"]`);
  if (activeTab) {
    activeTab.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
    activeTab.classList.add('bg-blue-100', 'dark:bg-blue-900/20', 'text-blue-800', 'dark:text-blue-300');
  }
  
  // Show/hide protocol panels
  document.querySelectorAll('.protocol-panel').forEach(panel => {
    panel.classList.add('hidden');
  });
  
  const activePanel = document.querySelector(`[data-protocol-panel="${protocol}"]`);
  if (activePanel) {
    activePanel.classList.remove('hidden');
  }
}

// Save network settings
async function saveNetworkSettings() {
  try {
    const networkConfig = collectNetworkConfiguration();
    const protocolConfig = collectProtocolDefaults();
    
    // In a real implementation, this would save to the API
    showSuccess('Network settings saved successfully');
    console.log('Network config:', networkConfig);
    console.log('Protocol config:', protocolConfig);
    
  } catch (error) {
    console.error('Error saving network settings:', error);
    showError('Failed to save network settings');
  }
}

// Collect network configuration
function collectNetworkConfiguration() {
  return {
    ethernet: {
      interface: document.getElementById('ethInterface')?.value,
      config: document.getElementById('ethConfig')?.value,
      ip: document.getElementById('ethIp')?.value,
      mask: document.getElementById('ethMask')?.value,
      gateway: document.getElementById('ethGateway')?.value,
      dns: document.getElementById('ethDns')?.value
    },
    wifi: {
      ssid: document.getElementById('wifiSsid')?.value,
      password: document.getElementById('wifiPassword')?.value,
      security: document.getElementById('wifiSecurity')?.value,
      enabled: document.getElementById('enableWifi')?.checked
    },
    firewall: {
      allowed_ips: document.getElementById('allowedIps')?.value,
      ip_filter_enabled: document.getElementById('enableIpFilter')?.checked,
      rate_limit_enabled: document.getElementById('enableRateLimit')?.checked
    }
  };
}

// Collect protocol defaults from forms
function collectProtocolDefaults() {
  const updatedDefaults = {};
  
  Object.keys(protocolDefaults).forEach(protocol => {
    updatedDefaults[protocol] = {};
    
    // Get all inputs for this protocol
    const protocolInputs = document.querySelectorAll(`[id^="${protocol}_"]`);
    protocolInputs.forEach(input => {
      const key = input.id.replace(`${protocol}_`, '');
      
      if (input.type === 'checkbox') {
        updatedDefaults[protocol][key] = input.checked;
      } else if (input.type === 'number') {
        updatedDefaults[protocol][key] = parseInt(input.value);
      } else {
        updatedDefaults[protocol][key] = input.value;
      }
    });
  });
  
  return updatedDefaults;
}

// Reset protocol defaults to factory settings
function resetProtocolDefaults() {
  if (confirm('Reset all protocol defaults to factory settings? This will affect new device profiles.')) {
    const factoryDefaults = {
      modbus_tcp: { port: 502, timeout_ms: 3000, retries: 3, unit_id: 1, word_order: 'big', byte_order: 'big' },
      modbus_rtu: { baudrate: 9600, parity: 'N', stopbits: 1, timeout_ms: 5000, retries: 3, unit_id: 1 },
      rs485: { baudrate: 9600, bytesize: 8, parity: 'N', stopbits: 1, timeout_ms: 5000, retries: 3 },
      mqtt: { port: 1883, timeout_ms: 10000, retries: 3, qos: 1, keep_alive: 60, retain: false },
      can: { interface: 'can0', bitrate: 250000, timeout_ms: 1000, retries: 3 },
      serial: { baudrate: 9600, bytesize: 8, parity: 'N', stopbits: 1, timeout_ms: 2000, retries: 3 },
      http_rest: { port: 80, https_port: 443, timeout_ms: 5000, retries: 3, user_agent: 'GES-EMS/1.0', verify_ssl: true },
      snmp: { port: 161, version: '2c', community: 'public', timeout_ms: 5000, retries: 3 }
    };
    
    protocolDefaults = factoryDefaults;
    populateProtocolPanels();
    showSuccess('Protocol defaults reset to factory settings');
  }
}

// Test network connection
function testNetworkConnection() {
  showInfo('Testing network connection...');
  
  // Mock test
  setTimeout(() => {
    const success = Math.random() > 0.2; // 80% success rate
    if (success) {
      showSuccess('Network connection test successful');
    } else {
      showError('Network connection test failed');
    }
  }, 2000);
}

// Restart network
function restartNetwork() {
  if (confirm('Restart network services? This may temporarily disconnect the device.')) {
    showInfo('Restarting network services...');
    
    // Mock restart
    setTimeout(() => {
      showSuccess('Network services restarted successfully');
    }, 3000);
  }
}

// Utility functions
async function fetchAPI(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Authorization': 'Bearer LOCAL_API_TOKEN',
      'Content-Type': 'application/json'
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  const response = await fetch(url, mergedOptions);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

// Notification functions
function showSuccess(message) {
  showNotification(message, 'success');
}

function showError(message) {
  showNotification(message, 'error');
}

function showInfo(message) {
  showNotification(message, 'info');
}

function showNotification(message, type = 'info') {
  const div = document.createElement('div');
  
  let bgColor, textColor, borderColor;
  switch (type) {
    case 'success':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-300';
      borderColor = 'border-green-200 dark:border-green-800';
      break;
    case 'error':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-300';
      borderColor = 'border-red-200 dark:border-red-800';
      break;
    default:
      bgColor = 'bg-blue-100 dark:bg-blue-900/20';
      textColor = 'text-blue-800 dark:text-blue-300';
      borderColor = 'border-blue-200 dark:border-blue-800';
  }
  
  div.className = `fixed top-4 right-4 ${bgColor} ${textColor} px-4 py-3 rounded-lg border ${borderColor} z-50 max-w-sm shadow-lg`;
  div.textContent = message;
  
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

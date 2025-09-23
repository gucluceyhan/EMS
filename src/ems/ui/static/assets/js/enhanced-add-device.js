// Enhanced Add Device Modal with Device Type Selection and Profile Integration

// Import capabilities configuration from profiles-new.js
// Note: These should be kept in sync with profiles-new.js
const ENHANCED_CAPABILITIES = window.ENHANCED_CAPABILITIES || {
  power: {
    title: "Power Control",
    capabilities: [
      { key: "set_active_power_limit", label: "Active Power Limit" },
      { key: "set_reactive_power_limit", label: "Reactive Power Limit" },
      { key: "power_factor_control", label: "Power Factor Control" },
      { key: "frequency_response", label: "Frequency Response" },
      { key: "voltage_regulation", label: "Voltage Regulation" }
    ]
  },
  breaker: {
    title: "Breaker/Switch Control",
    capabilities: [
      { key: "open_breaker", label: "Open Breaker" },
      { key: "close_breaker", label: "Close Breaker" },
      { key: "emergency_stop", label: "Emergency Stop" },
      { key: "remote_reset", label: "Remote Reset" }
    ]
  },
  bms: {
    title: "BMS Control",
    capabilities: [
      { key: "battery_charge_control", label: "Charge Control" },
      { key: "battery_discharge_control", label: "Discharge Control" },
      { key: "cell_balancing", label: "Cell Balancing" },
      { key: "thermal_management", label: "Thermal Management" }
    ]
  },
  monitoring: {
    title: "Monitoring Capabilities",
    capabilities: [
      { key: "energy_measurement", label: "Energy Measurement" },
      { key: "power_quality_analysis", label: "Power Quality Analysis" },
      { key: "harmonic_analysis", label: "Harmonic Analysis" },
      { key: "fault_detection", label: "Fault Detection" }
    ]
  },
  communication: {
    title: "Communication Features",
    capabilities: [
      { key: "time_synchronization", label: "Time Synchronization" },
      { key: "firmware_update", label: "Firmware Update" },
      { key: "configuration_backup", label: "Configuration Backup" },
      { key: "event_logging", label: "Event Logging" }
    ]
  }
};

const DEVICE_TYPE_CAPABILITIES = window.DEVICE_TYPE_CAPABILITIES || {
  inverter: ["power", "breaker", "monitoring", "communication"],
  meter: ["monitoring", "communication"],
  weather: ["monitoring", "communication"],
  tracker: ["monitoring", "communication"],
  bms: ["power", "bms", "monitoring", "communication"],
  breaker: ["breaker", "monitoring", "communication"],
  facility: ["monitoring", "communication"],
  security: ["monitoring", "communication"],
  power_analyzer: ["monitoring", "communication"],
  generic_modbus: ["monitoring", "communication"]
};

// Global state for add device modal
let addDeviceState = {
  step: 0,
  deviceType: null,
  profileTemplate: null,
  deviceData: {},
  availableProfiles: [],
  availablePointMaps: []
};

const ADD_DEVICE_STEPS = [
  'Device Type',
  'Profile Selection', 
  'Basic Information',
  'Connection Details',
  'Point Map Configuration',
  'Capabilities',
  'Validation'
];

// Initialize enhanced add device system
function initializeEnhancedAddDevice() {
  loadDeviceTypesAndProfiles();
  setupAddDeviceEventListeners();
}

// Load device types and profiles
async function loadDeviceTypesAndProfiles() {
  try {
    const [deviceTypesResp, profilesResp, pointMapsResp] = await Promise.all([
      fetchAPI('/api/device-types'),
      fetchAPI('/api/profiles'),
      fetchAPI('/api/pointmaps')
    ]);
    
    addDeviceState.deviceTypes = deviceTypesResp.device_types || [];
    addDeviceState.availableProfiles = profilesResp.profiles || [];
    addDeviceState.availablePointMaps = pointMapsResp.pointmaps || [];
  } catch (error) {
    console.error('Error loading device data:', error);
    // Use mock data
    addDeviceState.deviceTypes = [
      { value: "inverter", label: "Solar Inverter", icon: "⚡" },
      { value: "meter", label: "Energy Meter", icon: "📊" },
      { value: "weather", label: "Weather Station", icon: "🌤" }
    ];
    addDeviceState.availableProfiles = [];
    addDeviceState.availablePointMaps = [];
  }
}

// Setup event listeners for add device modal
function setupAddDeviceEventListeners() {
  // Replace existing add device button handlers
  document.addEventListener('click', (e) => {
    const target = e.target;
    
    // Handle add device buttons with device type hints
    if (target.id === 'btnAddInverter') {
      openEnhancedAddModal('inverter');
    } else if (target.id === 'btnAddGrid') {
      openEnhancedAddModal('meter');
    } else if (target.id === 'btnAddBms') {
      openEnhancedAddModal('bms');
    } else if (target.id === 'btnAddBreaker') {
      openEnhancedAddModal('breaker');
    } else if (target.id === 'btnAddAnalyzer') {
      openEnhancedAddModal('power_analyzer');
    } else if (target.id === 'btnAddFacility') {
      openEnhancedAddModal('facility');
    } else if (target.id === 'btnAddSecurity') {
      openEnhancedAddModal('security');
    }
  });

  // Modal navigation
  const btnAddNext = document.getElementById('addNext');
  const btnAddBack = document.getElementById('addBack');
  const btnAddSave = document.getElementById('addSave');
  const btnAddClose = document.getElementById('addDeviceClose');

  if (btnAddNext) btnAddNext.addEventListener('click', nextAddDeviceStep);
  if (btnAddBack) btnAddBack.addEventListener('click', previousAddDeviceStep);
  if (btnAddSave) btnAddSave.addEventListener('click', saveNewEnhancedDevice);
  if (btnAddClose) btnAddClose.addEventListener('click', closeEnhancedAddModal);
}

// Open enhanced add device modal
function openEnhancedAddModal(suggestedDeviceType = null) {
  addDeviceState = {
    step: 0,
    deviceType: suggestedDeviceType,
    profileTemplate: null,
    deviceData: {},
    deviceTypes: addDeviceState.deviceTypes || [],
    availableProfiles: addDeviceState.availableProfiles || [],
    availablePointMaps: addDeviceState.availablePointMaps || []
  };

  const modal = document.getElementById('addDeviceModal');
  const title = document.getElementById('addDeviceTitle');
  
  if (suggestedDeviceType) {
    const deviceTypeInfo = addDeviceState.deviceTypes.find(dt => dt.value === suggestedDeviceType);
    title.textContent = `Add ${deviceTypeInfo?.label || 'Device'}`;
  } else {
    title.textContent = 'Add New Device';
  }

  modal.classList.remove('hidden');
  renderAddDeviceSteps();
  renderAddDeviceStepContent();
}

// Close enhanced add modal
function closeEnhancedAddModal() {
  const modal = document.getElementById('addDeviceModal');
  modal.classList.add('hidden');
  addDeviceState = { step: 0, deviceType: null, profileTemplate: null, deviceData: {} };
}

// Navigate to next step
function nextAddDeviceStep() {
  if (!validateCurrentStep()) return;
  
  if (addDeviceState.step < ADD_DEVICE_STEPS.length - 1) {
    addDeviceState.step++;
    renderAddDeviceSteps();
    renderAddDeviceStepContent();
  }
}

// Navigate to previous step
function previousAddDeviceStep() {
  if (addDeviceState.step > 0) {
    addDeviceState.step--;
    renderAddDeviceSteps();
    renderAddDeviceStepContent();
  }
}

// Validate current step
function validateCurrentStep() {
  const currentStep = ADD_DEVICE_STEPS[addDeviceState.step];
  
  switch (currentStep) {
    case 'Device Type':
      if (!addDeviceState.deviceType) {
        showError('Please select a device type');
        return false;
      }
      break;
      
    case 'Basic Information':
      const deviceId = document.getElementById('deviceId')?.value;
      const plantId = document.getElementById('plantId')?.value;
      const make = document.getElementById('deviceMake')?.value;
      const model = document.getElementById('deviceModel')?.value;
      
      if (!deviceId || !plantId || !make || !model) {
        showError('Please fill in all required basic information fields');
        return false;
      }
      
      // Store in state
      addDeviceState.deviceData.id = deviceId;
      addDeviceState.deviceData.plant_id = plantId;
      addDeviceState.deviceData.make = make;
      addDeviceState.deviceData.model = model;
      break;
  }
  
  return true;
}

// Render add device steps
function renderAddDeviceSteps() {
  const stepsContainer = document.getElementById('addSteps');
  if (!stepsContainer) return;
  
  stepsContainer.innerHTML = '';
  
  ADD_DEVICE_STEPS.forEach((stepName, index) => {
    const button = document.createElement('button');
    button.className = `px-3 py-1 rounded-md text-xs ${
      index === addDeviceState.step 
        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' 
        : index < addDeviceState.step 
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`;
    button.textContent = `${index + 1}. ${stepName}`;
    button.addEventListener('click', () => {
      if (index <= addDeviceState.step) {
        addDeviceState.step = index;
        renderAddDeviceSteps();
        renderAddDeviceStepContent();
      }
    });
    stepsContainer.appendChild(button);
  });
  
  // Update navigation buttons
  const btnBack = document.getElementById('addBack');
  const btnNext = document.getElementById('addNext');
  const btnSave = document.getElementById('addSave');
  
  if (btnBack) btnBack.classList.toggle('hidden', addDeviceState.step === 0);
  if (btnNext) btnNext.classList.toggle('hidden', addDeviceState.step === ADD_DEVICE_STEPS.length - 1);
  if (btnSave) btnSave.classList.toggle('hidden', addDeviceState.step !== ADD_DEVICE_STEPS.length - 1);
}

// Render step content
function renderAddDeviceStepContent() {
  const stepBody = document.getElementById('addStepBody');
  if (!stepBody) return;
  
  const currentStep = ADD_DEVICE_STEPS[addDeviceState.step];
  
  switch (currentStep) {
    case 'Device Type':
      renderDeviceTypeSelection(stepBody);
      break;
    case 'Profile Selection':
      renderProfileSelection(stepBody);
      break;
    case 'Basic Information':
      renderBasicInformation(stepBody);
      break;
    case 'Connection Details':
      renderConnectionDetails(stepBody);
      break;
    case 'Point Map Configuration':
      renderPointMapConfiguration(stepBody);
      break;
    case 'Capabilities':
      renderCapabilitiesConfiguration(stepBody);
      break;
    case 'Validation':
      renderValidationSummary(stepBody);
      break;
  }
}

// Step 1: Device Type Selection
function renderDeviceTypeSelection(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Select Device Type</h4>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" id="deviceTypeGrid">
        ${addDeviceState.deviceTypes.map(deviceType => `
          <div class="device-type-card p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700 ${
            addDeviceState.deviceType === deviceType.value 
              ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
          }" data-device-type="${deviceType.value}">
            <div class="text-center">
              <div class="text-2xl mb-2">${deviceType.icon}</div>
              <div class="font-medium text-sm text-gray-900 dark:text-gray-100">${deviceType.label}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  // Add click handlers
  container.querySelectorAll('.device-type-card').forEach(card => {
    card.addEventListener('click', () => {
      const deviceType = card.getAttribute('data-device-type');
      selectDeviceType(deviceType);
    });
  });
}

// Step 2: Profile Selection
function renderProfileSelection(container) {
  const relevantProfiles = addDeviceState.availableProfiles.filter(
    profile => profile.device_type === addDeviceState.deviceType
  );
  
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Select Profile Template (Optional)</h4>
      <p class="text-sm text-gray-500">Choose a profile template to pre-fill configuration, or skip to configure manually.</p>
      
      ${relevantProfiles.length > 0 ? `
        <div class="grid grid-cols-1 gap-3" id="profileTemplateGrid">
          <div class="profile-template-card p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700 ${
            !addDeviceState.profileTemplate ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
          }" data-profile-id="">
            <div class="flex items-start gap-3">
              <div class="text-lg">⚙️</div>
              <div>
                <div class="font-medium text-gray-900 dark:text-gray-100">Manual Configuration</div>
                <div class="text-sm text-gray-500">Configure device manually without using a template</div>
              </div>
            </div>
          </div>
          ${relevantProfiles.map(profile => `
            <div class="profile-template-card p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-blue-300 dark:hover:border-blue-700 ${
              addDeviceState.profileTemplate?.id === profile.id 
                ? 'border-blue-500 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700'
            }" data-profile-id="${profile.id}">
              <div class="flex items-start gap-3">
                <div class="text-lg">${addDeviceState.deviceTypes.find(dt => dt.value === profile.device_type)?.icon || '📟'}</div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900 dark:text-gray-100">${profile.name}</div>
                  <div class="text-sm text-gray-500">${profile.description}</div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                      ${profile.protocol?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span class="text-xs text-gray-500">${profile.poll_interval_s}s polling</span>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="text-center py-8">
          <div class="text-4xl mb-2">📝</div>
          <div class="font-medium text-gray-900 dark:text-gray-100">No Profiles Available</div>
          <div class="text-sm text-gray-500">You'll configure this device manually</div>
        </div>
      `}
    </div>
  `;
  
  // Add click handlers
  container.querySelectorAll('.profile-template-card').forEach(card => {
    card.addEventListener('click', () => {
      const profileId = card.getAttribute('data-profile-id');
      selectProfileTemplate(profileId);
    });
  });
}

// Step 3: Basic Information
function renderBasicInformation(container) {
  const deviceTypeInfo = addDeviceState.deviceTypes.find(dt => dt.value === addDeviceState.deviceType);
  
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Basic Device Information</h4>
      
      <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <div class="text-xl">${deviceTypeInfo?.icon || '📟'}</div>
        <div>
          <div class="font-medium text-blue-900 dark:text-blue-100">Device Type: ${deviceTypeInfo?.label || 'Unknown'}</div>
          ${addDeviceState.profileTemplate ? `
            <div class="text-sm text-blue-700 dark:text-blue-300">Using profile: ${addDeviceState.profileTemplate.name}</div>
          ` : ''}
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Device ID *</span>
          <input id="deviceId" type="text" placeholder="e.g., site-inv-01" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
          <p class="text-xs text-gray-500 mt-1">Unique identifier for this device</p>
        </label>
        
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Plant ID *</span>
          <input id="plantId" type="text" value="${addDeviceState.deviceData.plant_id || ''}" placeholder="e.g., ankara-sincan-ges" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
          <p class="text-xs text-gray-500 mt-1">Site/plant identifier</p>
        </label>
        
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Manufacturer *</span>
          <input id="deviceMake" type="text" value="${addDeviceState.profileTemplate?.tags?.join(', ') || ''}" placeholder="e.g., Huawei, ABB, SMA" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
        </label>
        
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Model *</span>
          <input id="deviceModel" type="text" placeholder="e.g., SUN2000-100KTL-M1" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
        </label>
        
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Serial Number</span>
          <input id="deviceSerial" type="text" placeholder="Optional" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
        </label>
        
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Location/Description</span>
          <input id="deviceLocation" type="text" placeholder="e.g., String 1-10, Bay A" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
        </label>
      </div>
    </div>
  `;
}

// Step 4: Connection Details
function renderConnectionDetails(container) {
  const protocol = addDeviceState.profileTemplate?.protocol || 'modbus_tcp';
  
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Connection Configuration</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Protocol</span>
          <select id="connectionProtocol" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
            <!-- Options will be populated -->
          </select>
        </label>
        
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Poll Interval (seconds)</span>
          <input id="pollIntervalDevice" type="number" value="${addDeviceState.profileTemplate?.poll_interval_s || 60}" min="5" max="3600" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
        </label>
      </div>
      
      <div id="connectionSpecificFields">
        <!-- Protocol-specific connection fields will be rendered here -->
      </div>
    </div>
  `;
  
  // Populate protocol dropdown
  const protocolSelect = document.getElementById('connectionProtocol');
  if (protocolSelect && addDeviceState.protocols) {
    protocolSelect.innerHTML = '';
    addDeviceState.protocols.forEach(p => {
      const option = document.createElement('option');
      option.value = p.value;
      option.textContent = p.label;
      option.selected = p.value === protocol;
      protocolSelect.appendChild(option);
    });
    
    protocolSelect.addEventListener('change', () => {
      renderConnectionSpecificFields(protocolSelect.value);
    });
  }
  
  renderConnectionSpecificFields(protocol);
}

// Render protocol-specific connection fields
function renderConnectionSpecificFields(protocol) {
  const container = document.getElementById('connectionSpecificFields');
  if (!container) return;
  
  let fields = '';
  
  switch (protocol) {
    case 'modbus_tcp':
      fields = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Host/IP Address *</span>
            <input id="conn_host" type="text" placeholder="192.168.1.100" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Port</span>
            <input id="conn_port" type="number" value="502" min="1" max="65535" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Unit ID</span>
            <input id="conn_unit_id" type="number" value="1" min="1" max="255" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Timeout (ms)</span>
            <input id="conn_timeout" type="number" value="3000" min="1000" max="30000" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
        </div>
      `;
      break;
      
    case 'modbus_rtu':
    case 'rs485':
      fields = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Serial Port *</span>
            <input id="conn_serial_port" type="text" placeholder="/dev/ttyUSB0" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Baud Rate</span>
            <select id="conn_baudrate" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="9600">9600</option>
              <option value="19200">19200</option>
              <option value="38400">38400</option>
              <option value="57600">57600</option>
              <option value="115200">115200</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Parity</span>
            <select id="conn_parity" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="N">None</option>
              <option value="E">Even</option>
              <option value="O">Odd</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Stop Bits</span>
            <select id="conn_stopbits" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </label>
        </div>
      `;
      break;
      
    case 'mqtt':
      fields = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Broker Host *</span>
            <input id="conn_host" type="text" placeholder="mqtt.example.com" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" required />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Port</span>
            <input id="conn_port" type="number" value="1883" min="1" max="65535" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Topic Prefix</span>
            <input id="conn_topic_prefix" type="text" placeholder="devices/site1" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">QoS Level</span>
            <select id="conn_qos" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="0">0 - At most once</option>
              <option value="1" selected>1 - At least once</option>
              <option value="2">2 - Exactly once</option>
            </select>
          </label>
        </div>
      `;
      break;
  }
  
  container.innerHTML = fields;
}

// Step 5: Point Map Configuration
function renderPointMapConfiguration(container) {
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Point Map Configuration</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Point Map File</span>
          <div class="flex gap-2 mt-1">
            <select id="devicePointMap" class="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="">Select point map...</option>
              ${addDeviceState.availablePointMaps.map(pm => `
                <option value="${pm.path}" ${addDeviceState.profileTemplate?.default_point_map === pm.path ? 'selected' : ''}>
                  ${pm.name}
                </option>
              `).join('')}
            </select>
            <button id="btnCreateNewPointMap" type="button" class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Create New
            </button>
          </div>
        </label>
        
        <div class="block">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Point Map Status</span>
          <div id="devicePointMapStatus" class="mt-1 px-3 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-md">
            No point map selected
          </div>
        </div>
      </div>
      
      <div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Point Map Preview</span>
        <div id="devicePointMapPreview" class="mt-1 bg-gray-50 dark:bg-gray-900 rounded-md p-3 text-xs font-mono max-h-48 overflow-y-auto text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
          No point map selected
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners
  const pointMapSelect = document.getElementById('devicePointMap');
  if (pointMapSelect) {
    pointMapSelect.addEventListener('change', (e) => {
      updateDevicePointMapPreview(e.target.value);
    });
  }
  
  const btnCreateNewPointMap = document.getElementById('btnCreateNewPointMap');
  if (btnCreateNewPointMap) {
    btnCreateNewPointMap.addEventListener('click', openPointMapCreator);
  }
  
  // Auto-load preview if profile template has point map
  if (addDeviceState.profileTemplate?.default_point_map) {
    updateDevicePointMapPreview(addDeviceState.profileTemplate.default_point_map);
  }
}

// Step 6: Capabilities Configuration
function renderCapabilitiesConfiguration(container) {
  // Get device type specific capabilities
  const deviceType = addDeviceState.deviceType;
  const applicableCategories = DEVICE_TYPE_CAPABILITIES[deviceType] || ['monitoring', 'communication'];
  
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Device Capabilities</h4>
      <p class="text-sm text-gray-500">Configure what this device can do. Only relevant capabilities for ${addDeviceState.deviceTypes.find(dt => dt.value === deviceType)?.label} are shown.</p>
      
      <div id="deviceCapabilitiesContainer" class="space-y-4">
        ${applicableCategories.map(categoryKey => {
          const category = ENHANCED_CAPABILITIES[categoryKey];
          if (!category) return '';
          
          return `
            <div class="capabilities-category" data-category="${categoryKey}">
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">${category.title}</h5>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                ${category.capabilities.map(capability => `
                  <label class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <input type="checkbox" id="device_cap_${capability.key}" ${(addDeviceState.profileTemplate?.capabilities?.[capability.key]) ? 'checked' : ''} />
                    ${capability.label}
                  </label>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// Step 7: Validation Summary
function renderValidationSummary(container) {
  const deviceData = addDeviceState.deviceData;
  const deviceTypeInfo = addDeviceState.deviceTypes.find(dt => dt.value === addDeviceState.deviceType);
  
  container.innerHTML = `
    <div class="space-y-4">
      <h4 class="font-medium text-gray-900 dark:text-gray-100">Device Configuration Summary</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <h5 class="font-medium text-gray-700 dark:text-gray-300">Basic Information</h5>
          <div class="space-y-2 text-sm">
            <div><strong>Device ID:</strong> ${deviceData.id || 'Not set'}</div>
            <div><strong>Plant ID:</strong> ${deviceData.plant_id || 'Not set'}</div>
            <div><strong>Type:</strong> ${deviceTypeInfo?.label || 'Unknown'}</div>
            <div><strong>Make:</strong> ${deviceData.make || 'Not set'}</div>
            <div><strong>Model:</strong> ${deviceData.model || 'Not set'}</div>
          </div>
        </div>
        
        <div class="space-y-3">
          <h5 class="font-medium text-gray-700 dark:text-gray-300">Configuration</h5>
          <div class="space-y-2 text-sm">
            <div><strong>Protocol:</strong> ${document.getElementById('connectionProtocol')?.value || 'Not set'}</div>
            <div><strong>Poll Interval:</strong> ${document.getElementById('pollIntervalDevice')?.value || '60'}s</div>
            <div><strong>Point Map:</strong> ${document.getElementById('devicePointMap')?.value || 'Not selected'}</div>
            <div><strong>Profile Template:</strong> ${addDeviceState.profileTemplate?.name || 'Manual configuration'}</div>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
        <div class="flex items-start gap-2">
          <div class="text-green-600 dark:text-green-400">✓</div>
          <div class="text-sm text-green-800 dark:text-green-300">
            <strong>Ready to Save</strong><br />
            The device configuration looks good. Click "Save Device" to add it to your system.
          </div>
        </div>
      </div>
    </div>
  `;
}

// Device type selection handler
function selectDeviceType(deviceType) {
  addDeviceState.deviceType = deviceType;
  
  // Update visual selection
  document.querySelectorAll('.device-type-card').forEach(card => {
    card.classList.remove('border-blue-500', 'dark:border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
    card.classList.add('border-gray-200', 'dark:border-gray-700');
  });
  
  const selectedCard = document.querySelector(`[data-device-type="${deviceType}"]`);
  if (selectedCard) {
    selectedCard.classList.remove('border-gray-200', 'dark:border-gray-700');
    selectedCard.classList.add('border-blue-500', 'dark:border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  }
}

// Profile template selection handler
function selectProfileTemplate(profileId) {
  addDeviceState.profileTemplate = profileId ? 
    addDeviceState.availableProfiles.find(p => p.id === profileId) : null;
  
  // Update visual selection
  document.querySelectorAll('.profile-template-card').forEach(card => {
    card.classList.remove('border-blue-500', 'dark:border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
    card.classList.add('border-gray-200', 'dark:border-gray-700');
  });
  
  const selectedCard = document.querySelector(`[data-profile-id="${profileId}"]`);
  if (selectedCard) {
    selectedCard.classList.remove('border-gray-200', 'dark:border-gray-700');
    selectedCard.classList.add('border-blue-500', 'dark:border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  }
}

// Update point map preview for device
async function updateDevicePointMapPreview(pointMapPath) {
  const preview = document.getElementById('devicePointMapPreview');
  const status = document.getElementById('devicePointMapStatus');
  
  if (!preview) return;
  
  if (!pointMapPath) {
    preview.innerHTML = '<div class="text-gray-500">No point map selected</div>';
    if (status) {
      status.textContent = 'No point map selected';
      status.className = 'mt-1 px-3 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-md';
    }
    return;
  }
  
  try {
    const pointMapName = pointMapPath.split('/').pop().replace('.yaml', '');
    const response = await fetchAPI(`/api/pointmaps/${pointMapName}`);
    const content = response.content;
    
    // Update status
    if (status) {
      status.textContent = `✓ ${pointMapName}.yaml`;
      status.className = 'mt-1 px-3 py-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-md';
    }
    
    // Generate preview
    let previewText = '';
    if (content.metadata) {
      previewText += `# ${content.metadata.name || 'Unknown'}\n`;
      previewText += `# Version: ${content.metadata.version || 'N/A'}\n\n`;
    }
    
    if (content.points && Array.isArray(content.points)) {
      previewText += `Points (${content.points.length} total):\n`;
      content.points.slice(0, 8).forEach(point => {
        previewText += `${point.name}: fc=${point.fc || 'N/A'}, addr=${point.address || 'N/A'}\n`;
      });
      
      if (content.points.length > 8) {
        previewText += `... and ${content.points.length - 8} more points\n`;
      }
    }
    
    preview.textContent = previewText || 'Point map content is empty';
  } catch (error) {
    console.error('Error loading point map preview:', error);
    preview.innerHTML = '<div class="text-red-500">Error loading point map preview</div>';
    if (status) {
      status.textContent = '⚠ Point map not found';
      status.className = 'mt-1 px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md';
    }
  }
}

// Open point map creator from device add flow
function openPointMapCreator() {
  // Similar to profiles-new.js but customized for device creation context
  showInfo('Point map creator integration needed');
}

// Save new enhanced device
async function saveNewEnhancedDevice() {
  try {
    const deviceConfig = collectDeviceConfiguration();
    
    // Validate
    if (!deviceConfig.id || !deviceConfig.plant_id || !deviceConfig.make || !deviceConfig.model) {
      showError('Please fill in all required fields');
      return;
    }
    
    // In real implementation, this would call the API to save the device
    console.log('Saving device configuration:', deviceConfig);
    
    // Mock save to localStorage for demo
    const devices = JSON.parse(localStorage.getItem('customDevices') || '[]');
    devices.push(deviceConfig);
    localStorage.setItem('customDevices', JSON.stringify(devices));
    
    closeEnhancedAddModal();
    showSuccess(`Device "${deviceConfig.id}" added successfully`);
    
    // Refresh device list if available
    if (typeof refreshAll === 'function') {
      refreshAll();
    }
  } catch (error) {
    console.error('Error saving device:', error);
    showError('Failed to save device configuration');
  }
}

// Collect complete device configuration
function collectDeviceConfiguration() {
  const basic = {
    id: document.getElementById('deviceId')?.value,
    plant_id: document.getElementById('plantId')?.value,
    type: addDeviceState.deviceType,
    make: document.getElementById('deviceMake')?.value,
    model: document.getElementById('deviceModel')?.value,
    protocol: document.getElementById('connectionProtocol')?.value,
    poll_interval_s: parseInt(document.getElementById('pollIntervalDevice')?.value || 60),
    point_map: document.getElementById('devicePointMap')?.value || null,
    profile_id: addDeviceState.profileTemplate?.id || null
  };
  
  // Collect connection details
  const connection = {};
  const protocol = basic.protocol;
  
  switch (protocol) {
    case 'modbus_tcp':
      connection.host = document.getElementById('conn_host')?.value;
      connection.port = parseInt(document.getElementById('conn_port')?.value || 502);
      connection.unit_id = parseInt(document.getElementById('conn_unit_id')?.value || 1);
      connection.timeout_ms = parseInt(document.getElementById('conn_timeout')?.value || 3000);
      break;
      
    case 'modbus_rtu':
    case 'rs485':
      connection.serial_port = document.getElementById('conn_serial_port')?.value;
      connection.baudrate = parseInt(document.getElementById('conn_baudrate')?.value || 9600);
      connection.parity = document.getElementById('conn_parity')?.value || 'N';
      connection.stopbits = parseInt(document.getElementById('conn_stopbits')?.value || 1);
      break;
      
    case 'mqtt':
      connection.host = document.getElementById('conn_host')?.value;
      connection.port = parseInt(document.getElementById('conn_port')?.value || 1883);
      connection.topic_prefix = document.getElementById('conn_topic_prefix')?.value;
      connection.qos = parseInt(document.getElementById('conn_qos')?.value || 1);
      break;
  }
  
  // Collect capabilities
  const capabilities = {};
  const capabilityCheckboxes = document.querySelectorAll('#deviceCapabilitiesContainer input[type="checkbox"]');
  capabilityCheckboxes.forEach(checkbox => {
    const key = checkbox.id.replace('device_cap_', '');
    capabilities[key] = checkbox.checked;
  });
  
  return {
    ...basic,
    connection,
    capabilities,
    timeout_ms: connection.timeout_ms || 3000,
    retries: 3,
    created_at: new Date().toISOString()
  };
}

// Utility function for API calls
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on a page that needs enhanced add device
  if (document.getElementById('addDeviceModal')) {
    initializeEnhancedAddDevice();
  }
});

// Export for use by main UI
window.EnhancedAddDevice = {
  openModal: openEnhancedAddModal,
  closeModal: closeEnhancedAddModal
};

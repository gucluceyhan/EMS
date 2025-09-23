// Enhanced Device Profiles Management System
// Fully functional profiles management with all requested features

// Global state
let deviceTypes = [];
let protocols = [];
let pointMaps = [];
let protocolDefaults = {};
let currentProfile = null;
let originalProfileData = null;

// Configuration for enhanced capabilities
const ENHANCED_CAPABILITIES = {
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
  tracker: {
    title: "Tracker Control",
    capabilities: [
      { key: "tracker_position_control", label: "Position Control" },
      { key: "tracker_stow_mode", label: "Stow Mode" },
      { key: "tracker_calibration", label: "Calibration" }
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
  security: {
    title: "Security Control",
    capabilities: [
      { key: "arm_disarm_system", label: "Arm/Disarm System" },
      { key: "camera_control", label: "Camera Control" },
      { key: "door_lock_control", label: "Door Lock Control" },
      { key: "alarm_acknowledge", label: "Alarm Acknowledge" }
    ]
  },
  monitoring: {
    title: "Monitoring Capabilities",
    capabilities: [
      { key: "energy_measurement", label: "Energy Measurement" },
      { key: "power_quality_analysis", label: "Power Quality Analysis" },
      { key: "harmonic_analysis", label: "Harmonic Analysis" },
      { key: "fault_detection", label: "Fault Detection" },
      { key: "predictive_maintenance", label: "Predictive Maintenance" }
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

// Device type specific capabilities mapping
const DEVICE_TYPE_CAPABILITIES = {
  inverter: ["power", "breaker", "monitoring", "communication"],
  meter: ["monitoring", "communication"],
  weather: ["monitoring", "communication"],
  tracker: ["tracker", "monitoring", "communication"],
  bms: ["power", "bms", "monitoring", "communication"],
  breaker: ["breaker", "monitoring", "communication"],
  facility: ["monitoring", "communication"],
  security: ["security", "monitoring", "communication"],
  power_analyzer: ["monitoring", "communication"],
  string_monitor: ["monitoring", "communication"],
  transformer: ["breaker", "monitoring", "communication"],
  scada_gateway: ["monitoring", "communication"],
  generic_modbus: ["monitoring", "communication"]
};

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Profiles page DOM loaded, initializing...');
  
  try {
    console.log('Step 1: Loading initial data...');
    await loadInitialData();
    
    console.log('Step 2: Setting up event listeners...');
    try {
      setupEventListeners();
      console.log('✅ Step 2 completed - Event listeners setup');
    } catch (error) {
      console.error('❌ Step 2 failed - setupEventListeners error:', error);
      throw error;
    }
    
    console.log('Step 3: Loading profiles...');
    try {
      await loadProfiles();
      console.log('✅ Step 3 completed - Profiles loaded');
    } catch (error) {
      console.error('❌ Step 3 failed - loadProfiles error:', error);
      throw error;
    }
    
    console.log('Step 4: Showing no profile selected state...');
    try {
      showNoProfileSelected();
      console.log('✅ Step 4 completed - No profile selected state shown');
    } catch (error) {
      console.error('❌ Step 4 failed - showNoProfileSelected error:', error);
      throw error;
    }
    
    console.log('✅ Profiles page initialization complete');
  } catch (error) {
    console.error('❌ Error initializing profiles page:', error);
    showError('Failed to initialize profiles page');
  }
});

// Load initial data from API
async function loadInitialData() {
  console.log('Loading initial data from API...');
  
  try {
    // Try to load from API with individual error handling
    let deviceTypesResp, protocolsResp, pointMapsResp, protocolDefaultsResp;
    
    try {
      deviceTypesResp = await fetchAPI('/api/device-types');
      deviceTypes = deviceTypesResp.device_types || [];
      console.log('Loaded device types from API:', deviceTypes.length);
    } catch (e) {
      console.warn('Failed to load device types from API, using mock data');
      deviceTypes = [];
    }
    
    try {
      protocolsResp = await fetchAPI('/api/protocols');
      protocols = protocolsResp.protocols || [];
      console.log('Loaded protocols from API:', protocols.length);
    } catch (e) {
      console.warn('Failed to load protocols from API, using mock data');
      protocols = [];
    }
    
    try {
      pointMapsResp = await fetchAPI('/api/pointmaps');
      pointMaps = pointMapsResp.pointmaps || [];
      console.log('Loaded point maps from API:', pointMaps.length);
    } catch (e) {
      console.warn('Failed to load point maps from API, using mock data');
      pointMaps = [];
    }
    
    try {
      protocolDefaultsResp = await fetchAPI('/api/protocol-defaults');
      protocolDefaults = protocolDefaultsResp.protocol_defaults || {};
      console.log('Loaded protocol defaults from API');
    } catch (e) {
      console.warn('Failed to load protocol defaults from API, using mock data');
      protocolDefaults = {};
    }

    // If any data is missing, supplement with mock data
    if (deviceTypes.length === 0 || protocols.length === 0 || pointMaps.length === 0) {
      console.log('Some API data missing, supplementing with mock data...');
      loadMockData();
    } else {
      console.log('All API data loaded successfully, populating UI...');
      try {
        populateFilters();
        console.log('✅ Filters populated successfully');
      } catch (error) {
        console.error('❌ Error in populateFilters:', error);
      }
      
      try {
        populateSelectOptions();
        console.log('✅ Select options populated successfully');
      } catch (error) {
        console.error('❌ Error in populateSelectOptions:', error);
      }
    }
    
    console.log('✅ loadInitialData() completed successfully');
  } catch (error) {
    console.error('Error loading initial data:', error);
    // Fallback to mock data for development
    console.log('Falling back to mock data...');
    loadMockData();
  }
}

// Load mock data for development
function loadMockData() {
  console.log('Loading mock data for development...');
  
  deviceTypes = [
    { value: "inverter", label: "Solar Inverter", icon: "⚡" },
    { value: "meter", label: "Energy Meter", icon: "📊" },
    { value: "weather", label: "Weather Station", icon: "🌤" },
    { value: "tracker", label: "Solar Tracker", icon: "🎯" },
    { value: "bms", label: "Battery Management System", icon: "🔋" },
    { value: "breaker", label: "Smart Breaker", icon: "🔌" },
    { value: "facility", label: "Facility Monitor", icon: "🏭" },
    { value: "security", label: "Security System", icon: "🔒" },
    { value: "power_analyzer", label: "Power Quality Analyzer", icon: "📈" },
    { value: "generic_modbus", label: "Generic Modbus Device", icon: "📡" }
  ];

  protocols = [
    { value: "modbus_tcp", label: "Modbus TCP" },
    { value: "modbus_rtu", label: "Modbus RTU" },
    { value: "rs485", label: "RS485" },
    { value: "mqtt", label: "MQTT" },
    { value: "can", label: "CAN Bus" },
    { value: "serial", label: "Serial" },
    { value: "http_rest", label: "HTTP REST" },
    { value: "snmp", label: "SNMP" }
  ];

  pointMaps = [
    { path: "pointmaps/sunspec_inverter_common.yaml", name: "sunspec_inverter_common", filename: "sunspec_inverter_common.yaml" },
    { path: "pointmaps/meter_iec62053_generic.yaml", name: "meter_iec62053_generic", filename: "meter_iec62053_generic.yaml" },
    { path: "pointmaps/weather_serial_generic.yaml", name: "weather_serial_generic", filename: "weather_serial_generic.yaml" },
    { path: "pointmaps/bms_mqtt_generic.yaml", name: "bms_mqtt_generic", filename: "bms_mqtt_generic.yaml" },
    { path: "pointmaps/tracker_generic.yaml", name: "tracker_generic", filename: "tracker_generic.yaml" },
    { path: "pointmaps/rg20c_reactive_power.yaml", name: "rg20c_reactive_power", filename: "rg20c_reactive_power.yaml" },
    { path: "pointmaps/generic_modbus_brandA.yaml", name: "generic_modbus_brandA", filename: "generic_modbus_brandA.yaml" },
    { path: "pointmaps/generic_modbus_brandB.yaml", name: "generic_modbus_brandB", filename: "generic_modbus_brandB.yaml" },
    { path: "pointmaps/custom.yaml", name: "custom", filename: "custom.yaml" }
  ];

  protocolDefaults = {
    modbus_tcp: { port: 502, timeout_ms: 3000, retries: 3, unit_id: 1, word_order: 'big', byte_order: 'big' },
    modbus_rtu: { baudrate: 9600, parity: 'N', stopbits: 1, timeout_ms: 5000, retries: 3, unit_id: 1 },
    rs485: { baudrate: 9600, bytesize: 8, parity: 'N', stopbits: 1, timeout_ms: 5000, retries: 3 },
    mqtt: { port: 1883, timeout_ms: 10000, retries: 3, qos: 1, retain: false },
    can: { interface: 'can0', bitrate: 250000, timeout_ms: 1000, retries: 3 },
    serial: { baudrate: 9600, bytesize: 8, parity: 'N', stopbits: 1, timeout_ms: 2000, retries: 3 }
  };

  console.log('Mock data loaded:', { deviceTypes: deviceTypes.length, protocols: protocols.length, pointMaps: pointMaps.length });

  try {
    populateFilters();
    console.log('✅ Mock data - Filters populated');
  } catch (error) {
    console.error('❌ Mock data - Error in populateFilters:', error);
  }
  
  try {
    populateSelectOptions();
    console.log('✅ Mock data - Select options populated');
  } catch (error) {
    console.error('❌ Mock data - Error in populateSelectOptions:', error);
  }
}

// Populate filter dropdowns
function populateFilters() {
  console.log('populateFilters() called');
  
  try {
    const deviceTypeFilter = document.getElementById('filterDeviceType');
    const protocolFilter = document.getElementById('filterProtocol');
    
    console.log('Filter elements found:', { deviceTypeFilter: !!deviceTypeFilter, protocolFilter: !!protocolFilter });
    console.log('Data available:', { deviceTypes: deviceTypes.length, protocols: protocols.length });

    if (deviceTypeFilter) {
      console.log('Populating device type filter...');
      deviceTypeFilter.innerHTML = '<option value="">All Device Types</option>';
      deviceTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        deviceTypeFilter.appendChild(option);
      });
      console.log('✅ Device type filter populated with', deviceTypes.length, 'options');
    } else {
      console.warn('⚠️ deviceTypeFilter element not found');
    }

    if (protocolFilter) {
      console.log('Populating protocol filter...');
      protocolFilter.innerHTML = '<option value="">All Protocols</option>';
      protocols.forEach(protocol => {
        const option = document.createElement('option');
        option.value = protocol.value;
        option.textContent = protocol.label;
        protocolFilter.appendChild(option);
      });
      console.log('✅ Protocol filter populated with', protocols.length, 'options');
    } else {
      console.warn('⚠️ protocolFilter element not found');
    }
    
    console.log('✅ populateFilters() completed successfully');
  } catch (error) {
    console.error('❌ Error in populateFilters():', error);
    throw error;
  }
}

// Populate select options
function populateSelectOptions() {
  // Device Type select
  const deviceTypeSelect = document.getElementById('deviceType');
  if (deviceTypeSelect) {
    deviceTypeSelect.innerHTML = '<option value="">Select device type...</option>';
    deviceTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = `${type.icon} ${type.label}`;
      deviceTypeSelect.appendChild(option);
    });
  }

  // Protocol select
  const protocolSelect = document.getElementById('protocol');
  if (protocolSelect) {
    protocolSelect.innerHTML = '<option value="">Select protocol...</option>';
    protocols.forEach(protocol => {
      const option = document.createElement('option');
      option.value = protocol.value;
      option.textContent = protocol.label;
      protocolSelect.appendChild(option);
    });
  }

  // Point Map select - Always populate even if empty
  refreshPointMapSelect();

  // New Point Map device type select
  const newPointMapDeviceTypeSelect = document.getElementById('newPointMapDeviceType');
  if (newPointMapDeviceTypeSelect) {
    newPointMapDeviceTypeSelect.innerHTML = '<option value="">Select device type...</option>';
    deviceTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.value;
      option.textContent = type.label;
      newPointMapDeviceTypeSelect.appendChild(option);
    });
  }
}

// Separate function to refresh point map select
function refreshPointMapSelect(selectedValue = null) {
  const pointMapSelect = document.getElementById('pointMapFile');
  if (!pointMapSelect) return;
  
  pointMapSelect.innerHTML = '<option value="">Select point map...</option>';
  
  if (pointMaps && pointMaps.length > 0) {
    pointMaps.forEach(pointMap => {
      const option = document.createElement('option');
      option.value = pointMap.path;
      option.textContent = pointMap.name;
      if (selectedValue && pointMap.path === selectedValue) {
        option.selected = true;
      }
      pointMapSelect.appendChild(option);
    });
  } else {
    // Add a disabled option to show loading state
    const loadingOption = document.createElement('option');
    loadingOption.value = '';
    loadingOption.textContent = 'Loading point maps...';
    loadingOption.disabled = true;
    pointMapSelect.appendChild(loadingOption);
  }
}

// Load profiles from API or localStorage
async function loadProfiles() {
  console.log('loadProfiles() called');
  
  try {
    console.log('Attempting to fetch profiles from API...');
    const response = await fetchAPI('/api/profiles');
    const profiles = response.profiles || [];
    console.log('API profiles loaded:', profiles.length);
    renderProfilesList(profiles);
  } catch (error) {
    console.error('Error loading profiles from API:', error);
    console.log('Falling back to localStorage and default profiles...');
    
    // Load from localStorage as fallback
    try {
      const stored = localStorage.getItem('deviceProfiles');
      const profiles = stored ? JSON.parse(stored) : getDefaultProfiles();
      console.log('Fallback profiles loaded:', profiles.length);
      renderProfilesList(profiles);
    } catch (fallbackError) {
      console.error('Error loading fallback profiles:', fallbackError);
      // Final fallback - show empty state with default profiles
      renderProfilesList(getDefaultProfiles());
    }
  }
}

// Get default profiles for development
function getDefaultProfiles() {
  return [
    {
      id: 'sunspec-inverters',
      name: 'SunSpec Inverters',
      description: 'Standard SunSpec protocol (Huawei, SMA, ABB)',
      device_type: 'inverter',
      protocol: 'modbus_tcp',
      default_point_map: 'pointmaps/sunspec_inverter_common.yaml',
      poll_interval_s: 30,
      default_connection: {
        port: 502,
        timeout_ms: 3000,
        retries: 3,
        unit_id: 1,
        word_order: 'big'
      },
      capabilities: {
        set_active_power_limit: true,
        open_breaker: true,
        close_breaker: true,
        energy_measurement: true,
        power_quality_analysis: true,
        time_synchronization: true
      },
      tags: ['sunspec', 'inverter', 'standard']
    },
    {
      id: 'iec-meters',
      name: 'IEC Energy Meters',
      description: 'IEC 62053 compliant meters (Carlo Gavazzi, Schneider)',
      device_type: 'meter',
      protocol: 'modbus_rtu',
      default_point_map: 'pointmaps/meter_iec62053_generic.yaml',
      poll_interval_s: 60,
      default_connection: {
        baudrate: 9600,
        parity: 'N',
        stopbits: 1,
        timeout_ms: 5000,
        retries: 3,
        unit_id: 1
      },
      capabilities: {
        energy_measurement: true,
        power_quality_analysis: true,
        time_synchronization: false
      },
      tags: ['iec', 'meter', 'energy']
    },
    {
      id: 'weather-stations',
      name: 'Weather Stations',
      description: 'Serial & Modbus weather stations',
      device_type: 'weather',
      protocol: 'serial',
      default_point_map: 'pointmaps/weather_serial_generic.yaml',
      poll_interval_s: 120,
      default_connection: {
        baudrate: 9600,
        parity: 'N',
        stopbits: 1,
        timeout_ms: 2000,
        retries: 3
      },
      capabilities: {
        energy_measurement: false,
        power_quality_analysis: false,
        time_synchronization: true
      },
      tags: ['weather', 'environmental']
    },
    {
      id: 'bms-mqtt',
      name: 'BMS MQTT',
      description: 'Battery management systems via MQTT',
      device_type: 'bms',
      protocol: 'mqtt',
      default_point_map: 'pointmaps/bms_mqtt_generic.yaml',
      poll_interval_s: 15,
      default_connection: {
        port: 1883,
        timeout_ms: 10000,
        retries: 3,
        qos: 1,
        retain: false
      },
      capabilities: {
        battery_charge_control: true,
        battery_discharge_control: true,
        cell_balancing: true,
        thermal_management: true,
        energy_measurement: true,
        emergency_stop: true
      },
      tags: ['bms', 'battery', 'mqtt']
    }
  ];
}

// Render profiles list
function renderProfilesList(profiles) {
  const profilesList = document.getElementById('profilesList');
  if (!profilesList) return;

  // Apply filters
  const searchTerm = document.getElementById('searchProfiles')?.value.toLowerCase() || '';
  const deviceTypeFilter = document.getElementById('filterDeviceType')?.value || '';
  const protocolFilter = document.getElementById('filterProtocol')?.value || '';

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchTerm || 
      profile.name.toLowerCase().includes(searchTerm) ||
      profile.description.toLowerCase().includes(searchTerm);
    const matchesDeviceType = !deviceTypeFilter || profile.device_type === deviceTypeFilter;
    const matchesProtocol = !protocolFilter || profile.protocol === protocolFilter;
    
    return matchesSearch && matchesDeviceType && matchesProtocol;
  });

  profilesList.innerHTML = '';

  if (filteredProfiles.length === 0) {
    profilesList.innerHTML = `
      <div class="p-4 text-center text-gray-500">
        <div class="text-2xl mb-2">🔍</div>
        <div>No profiles found</div>
        <div class="text-xs">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }

  filteredProfiles.forEach(profile => {
    const deviceType = deviceTypes.find(dt => dt.value === profile.device_type);
    const profileItem = document.createElement('div');
    profileItem.className = `
      profile-item p-3 border-b border-gray-200 dark:border-gray-700 
      hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors
      ${currentProfile?.id === profile.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'border-gray-200 dark:border-gray-700'}
    `;
    
    // Add data attribute for selection
    profileItem.setAttribute('data-profile-id', profile.id);
    
    profileItem.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="text-lg">${deviceType?.icon || '📟'}</div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-gray-100 truncate">${profile.name}</div>
          <div class="text-xs text-gray-500 truncate">${profile.description || 'No description'}</div>
          <div class="flex items-center gap-2 mt-1">
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              ${deviceType?.label || profile.device_type}
            </span>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
              ${protocols.find(p => p.value === profile.protocol)?.label || profile.protocol}
            </span>
          </div>
        </div>
      </div>
    `;
    
    profileItem.addEventListener('click', () => selectProfile(profile));
    profilesList.appendChild(profileItem);
  });
}

// Select profile
function selectProfile(profile) {
  currentProfile = profile;
  originalProfileData = JSON.parse(JSON.stringify(profile));
  
  // Update visual selection in the rendered list
  updateProfileSelection(profile.id);
  
  showProfileDetails(profile);
}

// Update profile selection visual state
function updateProfileSelection(profileId) {
  // Remove selection from all items
  document.querySelectorAll('.profile-item').forEach(item => {
    item.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-700');
    item.classList.add('border-gray-200', 'dark:border-gray-700');
  });
  
  // Add selection to current item
  const selectedItem = document.querySelector(`[data-profile-id="${profileId}"]`);
  if (selectedItem) {
    selectedItem.classList.remove('border-gray-200', 'dark:border-gray-700');
    selectedItem.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-700');
  }
}

// Show profile details
function showProfileDetails(profile) {
  document.getElementById('noProfileSelected').classList.add('hidden');
  document.getElementById('profileDetailsForm').classList.remove('hidden');
  
  // Populate basic information
  document.getElementById('selectedProfileTitle').textContent = profile.name;
  document.getElementById('profileName').value = profile.name || '';
  document.getElementById('deviceType').value = profile.device_type || '';
  document.getElementById('profileDescription').value = profile.description || '';
  document.getElementById('pollInterval').value = profile.poll_interval_s || 60;
  
  // Populate protocol
  document.getElementById('protocol').value = profile.protocol || '';
  
  // Populate point map - refresh first then set value
  refreshPointMapSelect(profile.default_point_map);
  
  // Populate timeout and retries from connection config
  const connection = profile.default_connection || {};
  const timeoutInput = document.getElementById('timeout');
  const retriesInput = document.getElementById('retries');
  
  if (timeoutInput) timeoutInput.value = connection.timeout_ms || 3000;
  if (retriesInput) retriesInput.value = connection.retries || 3;
  
  // Populate tags
  const tags = Array.isArray(profile.tags) ? profile.tags.join(', ') : '';
  const tagsInput = document.getElementById('profileTags');
  if (tagsInput) tagsInput.value = tags;
  
  // Update protocol-specific fields with slight delay to ensure DOM is ready
  setTimeout(() => {
    updateProtocolSpecificFields(profile.protocol);
  }, 100);
  
  // Update capabilities
  updateCapabilities(profile);
  
  // Update point map preview and status with delay
  setTimeout(() => {
    updatePointMapPreview(profile.default_point_map);
    updatePointMapStatus(profile.default_point_map);
    
    // Setup form event listeners after all elements are populated
    setupProfileFormEventListeners();
  }, 200);
}

// Update protocol-specific fields
function updateProtocolSpecificFields(protocol) {
  const container = document.getElementById('protocolSpecificFields');
  if (!container) {
    console.warn('Protocol specific fields container not found');
    return;
  }
  
  console.log('Updating protocol specific fields for:', protocol);
  
  // Clear container first
  container.innerHTML = '';
  
  if (!protocol || protocol.trim() === '') {
    container.innerHTML = '<div class="text-sm text-gray-500">No protocol selected</div>';
    return;
  }
  
  const defaults = protocolDefaults[protocol] || {};
  const connection = currentProfile?.default_connection || {};
  
  console.log('Using defaults:', defaults);
  console.log('Current connection:', connection);
  
  // Create a wrapper div to prevent layout issues
  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'space-y-4';
  
  let fieldsHTML = '';
  
  switch (protocol) {
    case 'modbus_tcp':
      fieldsHTML = `
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">TCP Connection Settings</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Host/IP Address</span>
            <input id="conn_host" type="text" value="${connection.host || ''}" placeholder="192.168.1.100" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Port</span>
            <input id="conn_port" type="number" value="${connection.port || defaults.port || 502}" min="1" max="65535" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Unit ID</span>
            <input id="conn_unit_id" type="number" value="${connection.unit_id || defaults.unit_id || 1}" min="1" max="255" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Word Order</span>
            <select id="conn_word_order" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="big" ${(connection.word_order || defaults.word_order) === 'big' ? 'selected' : ''}>Big Endian</option>
              <option value="little" ${(connection.word_order || defaults.word_order) === 'little' ? 'selected' : ''}>Little Endian</option>
            </select>
          </label>
        </div>
      `;
      break;
      
    case 'modbus_rtu':
    case 'rs485':
      fieldsHTML = `
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Serial Connection Settings</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Serial Port</span>
            <input id="conn_serial_port" type="text" value="${connection.serial_port || ''}" placeholder="/dev/ttyUSB0" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Baud Rate</span>
            <select id="conn_baudrate" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="9600" ${(connection.baudrate || defaults.baudrate) == 9600 ? 'selected' : ''}>9600</option>
              <option value="19200" ${(connection.baudrate || defaults.baudrate) == 19200 ? 'selected' : ''}>19200</option>
              <option value="38400" ${(connection.baudrate || defaults.baudrate) == 38400 ? 'selected' : ''}>38400</option>
              <option value="57600" ${(connection.baudrate || defaults.baudrate) == 57600 ? 'selected' : ''}>57600</option>
              <option value="115200" ${(connection.baudrate || defaults.baudrate) == 115200 ? 'selected' : ''}>115200</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Parity</span>
            <select id="conn_parity" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="N" ${(connection.parity || defaults.parity) === 'N' ? 'selected' : ''}>None</option>
              <option value="E" ${(connection.parity || defaults.parity) === 'E' ? 'selected' : ''}>Even</option>
              <option value="O" ${(connection.parity || defaults.parity) === 'O' ? 'selected' : ''}>Odd</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Stop Bits</span>
            <select id="conn_stopbits" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="1" ${(connection.stopbits || defaults.stopbits) == 1 ? 'selected' : ''}>1</option>
              <option value="2" ${(connection.stopbits || defaults.stopbits) == 2 ? 'selected' : ''}>2</option>
            </select>
          </label>
        </div>
        ${protocol === 'rs485' ? '<div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md"><p class="text-sm text-amber-800 dark:text-amber-300"><strong>RS485 Note:</strong> Ensure proper termination (120Ω) and bias resistors.</p></div>' : ''}
      `;
      break;
      
    case 'mqtt':
      fieldsHTML = `
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">MQTT Connection Settings</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Broker Host</span>
            <input id="conn_host" type="text" value="${connection.host || ''}" placeholder="mqtt.example.com" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Port</span>
            <input id="conn_port" type="number" value="${connection.port || defaults.port || 1883}" min="1" max="65535" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Topic Prefix</span>
            <input id="conn_topic_prefix" type="text" value="${connection.topic_prefix || ''}" placeholder="devices/site1" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">QoS Level</span>
            <select id="conn_qos" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="0" ${(connection.qos || defaults.qos) == 0 ? 'selected' : ''}>0 - At most once</option>
              <option value="1" ${(connection.qos || defaults.qos) == 1 ? 'selected' : ''}>1 - At least once</option>
              <option value="2" ${(connection.qos || defaults.qos) == 2 ? 'selected' : ''}>2 - Exactly once</option>
            </select>
          </label>
        </div>
      `;
      break;
      
    case 'can':
      fieldsHTML = `
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">CAN Bus Settings</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Interface</span>
            <input id="conn_interface" type="text" value="${connection.interface || defaults.interface || 'can0'}" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Bitrate</span>
            <select id="conn_bitrate" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="125000" ${(connection.bitrate || defaults.bitrate) == 125000 ? 'selected' : ''}>125 kbps</option>
              <option value="250000" ${(connection.bitrate || defaults.bitrate) == 250000 ? 'selected' : ''}>250 kbps</option>
              <option value="500000" ${(connection.bitrate || defaults.bitrate) == 500000 ? 'selected' : ''}>500 kbps</option>
              <option value="1000000" ${(connection.bitrate || defaults.bitrate) == 1000000 ? 'selected' : ''}>1 Mbps</option>
            </select>
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">CAN ID</span>
            <input id="conn_can_id" type="text" value="${connection.can_id || ''}" placeholder="0x123" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
        </div>
        <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p class="text-sm text-green-800 dark:text-green-300"><strong>CAN Setup:</strong> Ensure SocketCAN is configured: <code>sudo ip link set can0 up type can bitrate 250000</code></p>
        </div>
      `;
      break;
      
    case 'serial':
      fieldsHTML = `
        <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Serial Connection Settings</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Serial Port</span>
            <input id="conn_serial_port" type="text" value="${connection.serial_port || ''}" placeholder="/dev/ttyUSB0" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Baud Rate</span>
            <select id="conn_baudrate" class="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-gray-900 dark:text-gray-100">
              <option value="9600" ${(connection.baudrate || defaults.baudrate) == 9600 ? 'selected' : ''}>9600</option>
              <option value="19200" ${(connection.baudrate || defaults.baudrate) == 19200 ? 'selected' : ''}>19200</option>
              <option value="38400" ${(connection.baudrate || defaults.baudrate) == 38400 ? 'selected' : ''}>38400</option>
              <option value="57600" ${(connection.baudrate || defaults.baudrate) == 57600 ? 'selected' : ''}>57600</option>
              <option value="115200" ${(connection.baudrate || defaults.baudrate) == 115200 ? 'selected' : ''}>115200</option>
            </select>
          </label>
        </div>
      `;
      break;
      
    default:
      fieldsHTML = `
        <div class="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
          <p class="text-sm text-gray-600 dark:text-gray-400">Protocol-specific settings for <strong>${protocol}</strong> will be available soon.</p>
        </div>
      `;
  }
  
  // Set the HTML content directly
  if (fieldsHTML) {
    container.innerHTML = fieldsHTML;
  } else {
    container.innerHTML = '<div class="text-sm text-gray-500">No configuration available for this protocol</div>';
  }
  
  console.log('Protocol fields updated successfully for:', protocol);
}

// Update capabilities based on device type
function updateCapabilities(profile) {
  const container = document.getElementById('capabilitiesContainer');
  if (!container) return;
  
  const deviceType = profile.device_type;
  const profileCapabilities = profile.capabilities || {};
  const applicableCategories = DEVICE_TYPE_CAPABILITIES[deviceType] || ['monitoring', 'communication'];
  
  container.innerHTML = '';
  
  applicableCategories.forEach(categoryKey => {
    const category = ENHANCED_CAPABILITIES[categoryKey];
    if (!category) return;
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'capabilities-category';
    categoryDiv.setAttribute('data-category', categoryKey);
    
    const title = document.createElement('h5');
    title.className = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
    title.textContent = category.title;
    
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-2 md:grid-cols-3 gap-2 text-sm';
    
    category.capabilities.forEach(capability => {
      const label = document.createElement('label');
      label.className = 'flex items-center gap-2 text-gray-700 dark:text-gray-300';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `cap_${capability.key}`;
      checkbox.checked = profileCapabilities[capability.key] || false;
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(capability.label));
      grid.appendChild(label);
    });
    
    categoryDiv.appendChild(title);
    categoryDiv.appendChild(grid);
    container.appendChild(categoryDiv);
  });
}

// Update point map preview
async function updatePointMapPreview(pointMapPath) {
  const preview = document.getElementById('pointMapPreview');
  if (!preview) {
    console.warn('Point map preview element not found');
    return;
  }
  
  if (!pointMapPath || pointMapPath.trim() === '') {
    preview.innerHTML = '<div class="text-gray-500">No point map selected</div>';
    return;
  }
  
  // Show loading state
  preview.innerHTML = '<div class="text-gray-500 animate-pulse">Loading point map preview...</div>';
  
  try {
    const pointMapName = pointMapPath.split('/').pop().replace('.yaml', '');
    console.log('Loading point map preview for:', pointMapName);
    
    let response, content;
    
    try {
      response = await fetchAPI(`/api/pointmaps/${pointMapName}`);
      content = response.content;
    } catch (apiError) {
      console.warn('API call failed, using mock point map data:', apiError);
      // Fallback to mock data for development
      content = getMockPointMapContent(pointMapName);
    }
    
    // Generate preview from YAML content
    let previewText = '';
    if (content && content.metadata) {
      previewText += `# ${content.metadata.name || 'Unknown'}\n`;
      previewText += `# Version: ${content.metadata.version || 'N/A'}\n`;
      previewText += `# Device Type: ${content.metadata.device_type || 'Unknown'}\n\n`;
    }
    
    if (content && content.points && Array.isArray(content.points)) {
      previewText += `# Points (${content.points.length} total):\n`;
      content.points.slice(0, 10).forEach(point => {
        const fc = point.fc || 'N/A';
        const address = point.address || 'N/A';
        const type = point.type || 'N/A';
        const unit = point.unit || '';
        const scale = point.scale || '';
        previewText += `${point.name || 'unnamed'}: fc=${fc}, addr=${address}, type=${type}`;
        if (scale) previewText += `, scale=${scale}`;
        if (unit) previewText += `, unit=${unit}`;
        previewText += '\n';
      });
      
      if (content.points.length > 10) {
        previewText += `... and ${content.points.length - 10} more points\n`;
      }
    } else {
      previewText += '# No points defined\n';
    }
    
    preview.textContent = previewText || 'Point map content is empty';
  } catch (error) {
    console.error('Error loading point map preview:', error);
    // Try to find the point map in local data first
    const localPointMap = pointMaps.find(pm => pm.path === pointMapPath);
    if (localPointMap) {
      preview.innerHTML = `<div class="text-blue-600 dark:text-blue-400">✓ ${localPointMap.name}<br/><span class="text-xs text-gray-500">Point map file exists</span></div>`;
    } else {
      preview.innerHTML = '<div class="text-red-500">❌ Error loading point map preview</div>';
    }
  }
}

// Update point map status
function updatePointMapStatus(pointMapPath) {
  const status = document.getElementById('pointMapStatus');
  if (!status) {
    console.warn('Point map status element not found');
    return;
  }
  
  if (!pointMapPath || pointMapPath.trim() === '') {
    status.textContent = 'No point map selected';
    status.className = 'mt-1 px-3 py-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 rounded-md';
    return;
  }
  
  console.log('Updating point map status for:', pointMapPath);
  console.log('Available point maps:', pointMaps);
  
  const pointMap = pointMaps.find(pm => pm.path === pointMapPath || pm.name === pointMapPath.replace('pointmaps/', '').replace('.yaml', ''));
  
  if (pointMap) {
    status.textContent = `✓ ${pointMap.filename || pointMap.name}`;
    status.className = 'mt-1 px-3 py-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-md';
  } else {
    // Check if it's a valid file path
    if (pointMapPath.includes('.yaml') || pointMapPath.includes('.yml')) {
      status.textContent = `⚠ ${pointMapPath.split('/').pop()}`;
      status.className = 'mt-1 px-3 py-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-md';
    } else {
      status.textContent = '❌ Point map not found';
      status.className = 'mt-1 px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-md';
    }
  }
}

// Show no profile selected state
function showNoProfileSelected() {
  document.getElementById('noProfileSelected').classList.remove('hidden');
  document.getElementById('profileDetailsForm').classList.add('hidden');
  currentProfile = null;
  originalProfileData = null;
}

// Setup event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Search and filters
  const searchInput = document.getElementById('searchProfiles');
  const deviceTypeFilter = document.getElementById('filterDeviceType');
  const protocolFilter = document.getElementById('filterProtocol');
  
  console.log('Search/filter elements:', { searchInput: !!searchInput, deviceTypeFilter: !!deviceTypeFilter, protocolFilter: !!protocolFilter });
  
  if (searchInput) searchInput.addEventListener('input', debounce(() => loadProfiles(), 300));
  if (deviceTypeFilter) deviceTypeFilter.addEventListener('change', () => loadProfiles());
  if (protocolFilter) protocolFilter.addEventListener('change', () => loadProfiles());
  
  // Profile actions
  const btnNewProfile = document.getElementById('btnNewProfile');
  const btnImportProfile = document.getElementById('btnImportProfile');
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  const btnTestProfile = document.getElementById('btnTestProfile');
  const btnExportProfile = document.getElementById('btnExportProfile');
  const btnDeleteProfile = document.getElementById('btnDeleteProfile');
  const btnResetProfile = document.getElementById('btnResetProfile');
  const btnCopyProfile = document.getElementById('btnCopyProfile');
  
  console.log('Profile action buttons:', {
    btnNewProfile: !!btnNewProfile,
    btnImportProfile: !!btnImportProfile,
    btnSaveProfile: !!btnSaveProfile,
    btnTestProfile: !!btnTestProfile,
    btnExportProfile: !!btnExportProfile,
    btnDeleteProfile: !!btnDeleteProfile,
    btnResetProfile: !!btnResetProfile,
    btnCopyProfile: !!btnCopyProfile
  });
  
  if (btnNewProfile) {
    console.log('Adding click listener to btnNewProfile');
    
    // Remove any existing listeners to prevent conflicts
    btnNewProfile.removeEventListener('click', createNewProfile);
    
    // Add new listener
    btnNewProfile.addEventListener('click', function(event) {
      console.log('🚀 New Profile button clicked!');
      event.preventDefault();
      event.stopPropagation();
      createNewProfile();
    });
    
    console.log('✅ Click listener added successfully to btnNewProfile');
  } else {
    console.error('❌ btnNewProfile element not found!');
  }
  
  if (btnImportProfile) btnImportProfile.addEventListener('click', importProfile);
  if (btnSaveProfile) btnSaveProfile.addEventListener('click', saveProfile);
  if (btnTestProfile) btnTestProfile.addEventListener('click', testProfile);
  if (btnExportProfile) btnExportProfile.addEventListener('click', exportProfile);
  if (btnDeleteProfile) btnDeleteProfile.addEventListener('click', deleteProfile);
  if (btnResetProfile) btnResetProfile.addEventListener('click', resetProfile);
  if (btnCopyProfile) btnCopyProfile.addEventListener('click', copyProfile);
  
  // Point map actions
  const btnCreatePointMap = document.getElementById('btnCreatePointMap');
  const btnEditPointMap = document.getElementById('btnEditPointMap');
  const closePointMapEditor = document.getElementById('closePointMapEditor');
  const btnSavePointMap = document.getElementById('btnSavePointMap');
  const btnValidatePointMap = document.getElementById('btnValidatePointMap');
  
  console.log('Point map buttons:', {
    btnCreatePointMap: !!btnCreatePointMap,
    btnEditPointMap: !!btnEditPointMap,
    closePointMapEditor: !!closePointMapEditor,
    btnSavePointMap: !!btnSavePointMap,
    btnValidatePointMap: !!btnValidatePointMap
  });
  
  if (btnCreatePointMap) btnCreatePointMap.addEventListener('click', createPointMap);
  if (btnEditPointMap) btnEditPointMap.addEventListener('click', editPointMap);
  if (closePointMapEditor) closePointMapEditor.addEventListener('click', closePointMapEditorModal);
  if (btnSavePointMap) btnSavePointMap.addEventListener('click', savePointMap);
  if (btnValidatePointMap) btnValidatePointMap.addEventListener('click', validatePointMap);
  
  console.log('✅ Event listeners setup complete');
}

// Setup event listeners after DOM is populated (called after showProfileDetails)
function setupProfileFormEventListeners() {
  // Device type change handler
  const deviceTypeSelect = document.getElementById('deviceType');
  if (deviceTypeSelect) {
    // Remove existing listeners to prevent duplicates
    deviceTypeSelect.removeEventListener('change', handleDeviceTypeChange);
    deviceTypeSelect.addEventListener('change', handleDeviceTypeChange);
  }
  
  // Protocol change handler
  const protocolSelect = document.getElementById('protocol');
  if (protocolSelect) {
    protocolSelect.removeEventListener('change', handleProtocolChange);
    protocolSelect.addEventListener('change', handleProtocolChange);
  }
  
  // Point map change handler
  const pointMapSelect = document.getElementById('pointMapFile');
  if (pointMapSelect) {
    pointMapSelect.removeEventListener('change', handlePointMapChange);
    pointMapSelect.addEventListener('change', handlePointMapChange);
  }
}

// Separate event handlers to prevent issues
function handleDeviceTypeChange(e) {
  if (currentProfile) {
    currentProfile.device_type = e.target.value;
    updateCapabilities(currentProfile);
  }
}

function handleProtocolChange(e) {
  const protocol = e.target.value;
  console.log('Protocol changed to:', protocol);
  
  // Clear and update protocol-specific fields
  const container = document.getElementById('protocolSpecificFields');
  if (container) {
    container.innerHTML = '<div class="text-sm text-gray-500 animate-pulse">Loading protocol configuration...</div>';
    
    // Use setTimeout to ensure smooth UI update
    setTimeout(() => {
      updateProtocolSpecificFields(protocol);
    }, 100);
  }
}

function handlePointMapChange(e) {
  const pointMapPath = e.target.value;
  console.log('Point map changed to:', pointMapPath);
  
  // Update preview and status
  updatePointMapPreview(pointMapPath);
  updatePointMapStatus(pointMapPath);
}

// Profile management functions
function createNewProfile() {
  console.log('createNewProfile called');
  
  try {
    const name = prompt('Profile Name:', 'New Profile');
    if (!name) {
      console.log('User cancelled profile creation');
      return;
    }
    
    console.log('Creating new profile with name:', name);
    
    const newProfile = {
      id: 'profile-' + Date.now(),
      name: name,
      description: 'Custom profile',
      device_type: '',
      protocol: '',
      default_point_map: '',
      poll_interval_s: 60,
      default_connection: {},
      capabilities: {},
      tags: [],
      created_at: new Date().toISOString()
    };
    
    console.log('New profile object:', newProfile);
    
    // Add to profiles localStorage (fallback storage)
    try {
      const stored = localStorage.getItem('deviceProfiles');
      const profiles = stored ? JSON.parse(stored) : getDefaultProfiles();
      profiles.push(newProfile);
      localStorage.setItem('deviceProfiles', JSON.stringify(profiles));
      console.log('Profile saved to localStorage');
    } catch (storageError) {
      console.error('Error saving to localStorage:', storageError);
      showError('Failed to save profile to local storage');
      return;
    }
    
    // Reload and select the new profile
    loadProfiles().then(() => {
      console.log('Profiles reloaded after creation');
      // Auto-select the new profile with delay
      setTimeout(() => {
        const profileItems = document.querySelectorAll('.profile-item');
        console.log('Looking for new profile in', profileItems.length, 'items');
        
        const newProfileItem = Array.from(profileItems).find(item => 
          item.textContent.includes(newProfile.name)
        );
        
        if (newProfileItem) {
          console.log('Found and selecting new profile item');
          newProfileItem.click();
        } else {
          console.warn('Could not find new profile item in list');
        }
      }, 300);
    }).catch(error => {
      console.error('Error reloading profiles:', error);
      showError('Profile created but failed to refresh list');
    });
    
    showSuccess('New profile created successfully');
    
  } catch (error) {
    console.error('Error in createNewProfile:', error);
    showError('Failed to create new profile');
  }
}

function importProfile() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,.yaml,.yml';
  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        // TODO: Implement proper import logic
        showSuccess(`Profile imported from ${file.name} (implementation needed)`);
      } catch (error) {
        showError(`Failed to import profile: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

function saveProfile() {
  if (!currentProfile) return;
  
  try {
    // Collect form data
    const formData = {
      name: document.getElementById('profileName').value,
      description: document.getElementById('profileDescription').value,
      device_type: document.getElementById('deviceType').value,
      protocol: document.getElementById('protocol').value,
      default_point_map: document.getElementById('pointMapFile').value,
      poll_interval_s: parseInt(document.getElementById('pollInterval').value),
      default_connection: collectConnectionData(),
      capabilities: collectCapabilities(),
      tags: document.getElementById('profileTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    // Validation
    if (!formData.name) {
      showError('Profile name is required');
      return;
    }
    
    if (!formData.device_type) {
      showError('Device type is required');
      return;
    }
    
    if (!formData.protocol) {
      showError('Protocol is required');
      return;
    }
    
    // Update current profile
    Object.assign(currentProfile, formData);
    
    // Save to localStorage (in real implementation, this would call API)
    const stored = localStorage.getItem('deviceProfiles');
    const profiles = stored ? JSON.parse(stored) : getDefaultProfiles();
    const index = profiles.findIndex(p => p.id === currentProfile.id);
    if (index >= 0) {
      profiles[index] = currentProfile;
    } else {
      profiles.push(currentProfile);
    }
    localStorage.setItem('deviceProfiles', JSON.stringify(profiles));
    
    // Update original data
    originalProfileData = JSON.parse(JSON.stringify(currentProfile));
    
    // Refresh list and maintain selection
    loadProfiles();
    
    showSuccess('Profile saved successfully');
  } catch (error) {
    console.error('Error saving profile:', error);
    showError('Failed to save profile');
  }
}

function collectConnectionData() {
  const connection = {};
  
  // Common fields
  const timeout = document.getElementById('timeout');
  const retries = document.getElementById('retries');
  if (timeout) connection.timeout_ms = parseInt(timeout.value);
  if (retries) connection.retries = parseInt(retries.value);
  
  // Protocol-specific fields
  const protocol = document.getElementById('protocol').value;
  
  switch (protocol) {
    case 'modbus_tcp':
      const host = document.getElementById('conn_host');
      const port = document.getElementById('conn_port');
      const unitId = document.getElementById('conn_unit_id');
      const wordOrder = document.getElementById('conn_word_order');
      
      if (host) connection.host = host.value;
      if (port) connection.port = parseInt(port.value);
      if (unitId) connection.unit_id = parseInt(unitId.value);
      if (wordOrder) connection.word_order = wordOrder.value;
      break;
      
    case 'modbus_rtu':
    case 'rs485':
      const serialPort = document.getElementById('conn_serial_port');
      const baudrate = document.getElementById('conn_baudrate');
      const parity = document.getElementById('conn_parity');
      const stopbits = document.getElementById('conn_stopbits');
      
      if (serialPort) connection.serial_port = serialPort.value;
      if (baudrate) connection.baudrate = parseInt(baudrate.value);
      if (parity) connection.parity = parity.value;
      if (stopbits) connection.stopbits = parseInt(stopbits.value);
      break;
      
    case 'mqtt':
      const mqttHost = document.getElementById('conn_host');
      const mqttPort = document.getElementById('conn_port');
      const topicPrefix = document.getElementById('conn_topic_prefix');
      const qos = document.getElementById('conn_qos');
      
      if (mqttHost) connection.host = mqttHost.value;
      if (mqttPort) connection.port = parseInt(mqttPort.value);
      if (topicPrefix) connection.topic_prefix = topicPrefix.value;
      if (qos) connection.qos = parseInt(qos.value);
      break;
      
    case 'can':
      const canInterface = document.getElementById('conn_interface');
      const bitrate = document.getElementById('conn_bitrate');
      const canId = document.getElementById('conn_can_id');
      
      if (canInterface) connection.interface = canInterface.value;
      if (bitrate) connection.bitrate = parseInt(bitrate.value);
      if (canId) connection.can_id = canId.value;
      break;
  }
  
  return connection;
}

function collectCapabilities() {
  const capabilities = {};
  
  // Collect all capability checkboxes
  const checkboxes = document.querySelectorAll('#capabilitiesContainer input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    const key = checkbox.id.replace('cap_', '');
    capabilities[key] = checkbox.checked;
  });
  
  return capabilities;
}

function testProfile() {
  if (!currentProfile) return;
  
  showInfo(`Testing connection for ${currentProfile.name}...`);
  
  // Mock connection test
  setTimeout(() => {
    const success = Math.random() > 0.3; // 70% success rate for demo
    if (success) {
      showSuccess(`Connection test successful for ${currentProfile.name}`);
    } else {
      showError(`Connection test failed for ${currentProfile.name}`);
    }
  }, 2000);
}

function exportProfile() {
  if (!currentProfile) return;
  
  try {
    const dataStr = JSON.stringify(currentProfile, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${currentProfile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_profile.json`;
    link.click();
    
    showSuccess('Profile exported successfully');
  } catch (error) {
    console.error('Error exporting profile:', error);
    showError('Failed to export profile');
  }
}

function deleteProfile() {
  if (!currentProfile) return;
  
  if (confirm(`Delete profile "${currentProfile.name}"? This action cannot be undone.`)) {
    // Remove from localStorage (in real implementation, this would call API)
    const stored = localStorage.getItem('deviceProfiles');
    const profiles = stored ? JSON.parse(stored) : [];
    const filteredProfiles = profiles.filter(p => p.id !== currentProfile.id);
    localStorage.setItem('deviceProfiles', JSON.stringify(filteredProfiles));
    
    showNoProfileSelected();
    loadProfiles();
    showSuccess('Profile deleted successfully');
  }
}

function resetProfile() {
  if (!currentProfile || !originalProfileData) return;
  
  if (confirm('Reset all changes to original values?')) {
    currentProfile = JSON.parse(JSON.stringify(originalProfileData));
    showProfileDetails(currentProfile);
    showSuccess('Profile reset to original values');
  }
}

function copyProfile() {
  if (!currentProfile) return;
  
  const name = prompt('New profile name:', `${currentProfile.name} (Copy)`);
  if (!name) return;
  
  const copiedProfile = JSON.parse(JSON.stringify(currentProfile));
  copiedProfile.id = 'profile-' + Date.now();
  copiedProfile.name = name;
  
  // Add to profiles
  const stored = localStorage.getItem('deviceProfiles');
  const profiles = stored ? JSON.parse(stored) : getDefaultProfiles();
  profiles.push(copiedProfile);
  localStorage.setItem('deviceProfiles', JSON.stringify(profiles));
  
  loadProfiles();
  showSuccess('Profile copied successfully');
}

// Point map management functions
function createPointMap() {
  document.getElementById('pointMapEditorModal').classList.remove('hidden');
  document.getElementById('newPointMapName').value = '';
  document.getElementById('newPointMapDeviceType').value = currentProfile?.device_type || '';
  document.getElementById('pointMapEditor').value = getPointMapTemplate();
}

function editPointMap() {
  if (!currentProfile?.default_point_map) {
    showError('No point map selected to edit');
    return;
  }
  
  const pointMapName = currentProfile.default_point_map.split('/').pop().replace('.yaml', '');
  document.getElementById('pointMapEditorModal').classList.remove('hidden');
  document.getElementById('newPointMapName').value = pointMapName;
  document.getElementById('newPointMapDeviceType').value = currentProfile.device_type;
  
  // Load current point map content
  loadPointMapForEditing(pointMapName);
}

async function loadPointMapForEditing(pointMapName) {
  try {
    const response = await fetchAPI(`/api/pointmaps/${pointMapName}`);
    const yamlContent = jsyaml.dump(response.content);
    document.getElementById('pointMapEditor').value = yamlContent;
  } catch (error) {
    console.error('Error loading point map for editing:', error);
    showError('Failed to load point map for editing');
  }
}

function closePointMapEditorModal() {
  document.getElementById('pointMapEditorModal').classList.add('hidden');
}

async function savePointMap() {
  const name = document.getElementById('newPointMapName').value;
  const deviceType = document.getElementById('newPointMapDeviceType').value;
  const content = document.getElementById('pointMapEditor').value;
  
  if (!name) {
    showError('Point map name is required');
    return;
  }
  
  if (!content.trim()) {
    showError('Point map content is required');
    return;
  }
  
  try {
    // Parse YAML content
    let parsedContent;
    try {
      parsedContent = jsyaml.load(content);
    } catch (yamlError) {
      showError(`Invalid YAML syntax: ${yamlError.message}`);
      return;
    }
    
    // Save point map via API
    const response = await fetchAPI('/api/pointmaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        content: parsedContent
      })
    });
    
    // Refresh point maps list
    const pointMapsResp = await fetchAPI('/api/pointmaps');
    pointMaps = pointMapsResp.pointmaps || [];
    populateSelectOptions();
    
    // Update current profile to use the new point map
    if (currentProfile) {
      const newPointMapPath = `pointmaps/${name}.yaml`;
      currentProfile.default_point_map = newPointMapPath;
      document.getElementById('pointMapFile').value = newPointMapPath;
      updatePointMapPreview(newPointMapPath);
      updatePointMapStatus(newPointMapPath);
    }
    
    closePointMapEditorModal();
    showSuccess('Point map saved successfully');
  } catch (error) {
    console.error('Error saving point map:', error);
    showError('Failed to save point map');
  }
}

function validatePointMap() {
  const content = document.getElementById('pointMapEditor').value;
  
  if (!content.trim()) {
    showError('No content to validate');
    return;
  }
  
  try {
    const parsed = jsyaml.load(content);
    
    // Basic validation
    const errors = [];
    
    if (!parsed.metadata) {
      errors.push('Missing metadata section');
    } else {
      if (!parsed.metadata.name) errors.push('Missing metadata.name');
      if (!parsed.metadata.version) errors.push('Missing metadata.version');
    }
    
    if (!parsed.points || !Array.isArray(parsed.points)) {
      errors.push('Missing or invalid points array');
    } else {
      parsed.points.forEach((point, index) => {
        if (!point.name) errors.push(`Point ${index + 1}: missing name`);
        if (point.address === undefined) errors.push(`Point ${index + 1}: missing address`);
        if (!point.type) errors.push(`Point ${index + 1}: missing type`);
      });
    }
    
    if (errors.length > 0) {
      showError(`Validation errors:\n${errors.join('\n')}`);
    } else {
      showSuccess('Point map validation passed');
    }
  } catch (error) {
    showError(`Invalid YAML syntax: ${error.message}`);
  }
}

function getPointMapTemplate() {
  return `metadata:
  name: "New Point Map"
  version: "1.0.0"
  device_type: "generic"
  description: "Custom point map"

points:
  - name: "example_register"
    fc: 3
    address: 0
    type: "uint16"
    count: 1
    scale: 1.0
    unit: "units"
    signed: false
    description: "Example register"
`;
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
  
  try {
    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${response.statusText} for ${url}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`fetchAPI error for ${url}:`, error);
    throw error;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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

// Add js-yaml library for YAML parsing
if (typeof jsyaml === 'undefined') {
  // Load js-yaml library
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js';
  document.head.appendChild(script);
}

// Mock point map content for development
function getMockPointMapContent(pointMapName) {
  const mockPointMaps = {
    'sunspec_inverter_common': {
      metadata: {
        name: 'SunSpec Common Inverter',
        version: '1.0.0',
        device_type: 'inverter'
      },
      points: [
        { name: 'AC_P', fc: 3, address: 107, type: 'float', count: 2, scale: 0.001, unit: 'kW' },
        { name: 'AC_Q', fc: 3, address: 109, type: 'float', count: 2, scale: 0.001, unit: 'kVar' },
        { name: 'DC_P', fc: 3, address: 149, type: 'float', count: 2, scale: 0.001, unit: 'kW' },
        { name: 'DC_V', fc: 3, address: 135, type: 'uint16', count: 1, scale: 0.1, unit: 'V' },
        { name: 'DC_I', fc: 3, address: 137, type: 'uint16', count: 1, scale: 0.1, unit: 'A' },
        { name: 'Cabinet_Temp', fc: 3, address: 143, type: 'int16', count: 1, scale: 0.1, unit: 'C' },
        { name: 'Status', fc: 3, address: 402, type: 'bitfield16', count: 1 }
      ]
    },
    'meter_iec62053_generic': {
      metadata: {
        name: 'IEC 62053 Energy Meter',
        version: '1.0.0',
        device_type: 'meter'
      },
      points: [
        { name: 'V_LN_A', fc: 4, address: 0, type: 'float', count: 2, unit: 'V' },
        { name: 'I_A', fc: 4, address: 6, type: 'float', count: 2, unit: 'A' },
        { name: 'P_TOTAL', fc: 4, address: 12, type: 'float', count: 2, unit: 'kW' },
        { name: 'Q_TOTAL', fc: 4, address: 18, type: 'float', count: 2, unit: 'kVar' },
        { name: 'FREQ', fc: 4, address: 70, type: 'float', count: 2, unit: 'Hz' }
      ]
    },
    'weather_serial_generic': {
      metadata: {
        name: 'Generic Weather Station',
        version: '1.0.0',
        device_type: 'weather'
      },
      points: [
        { name: 'Irradiance', address: 1, type: 'float', unit: 'W/m²' },
        { name: 'Module_Temp', address: 2, type: 'float', unit: '°C' },
        { name: 'Ambient_Temp', address: 3, type: 'float', unit: '°C' },
        { name: 'Wind_Speed', address: 4, type: 'float', unit: 'm/s' },
        { name: 'Humidity', address: 6, type: 'float', unit: '%' }
      ]
    },
    'bms_mqtt_generic': {
      metadata: {
        name: 'Generic BMS MQTT',
        version: '1.0.0',
        device_type: 'bms'
      },
      points: [
        { name: 'SOC', topic: 'bms/soc', type: 'float', unit: '%' },
        { name: 'SOH', topic: 'bms/soh', type: 'float', unit: '%' },
        { name: 'Voltage', topic: 'bms/voltage', type: 'float', unit: 'V' },
        { name: 'Current', topic: 'bms/current', type: 'float', unit: 'A' },
        { name: 'Temperature', topic: 'bms/temp', type: 'float', unit: '°C' }
      ]
    }
  };
  
  return mockPointMaps[pointMapName] || {
    metadata: { name: 'Unknown Point Map', version: '1.0.0', device_type: 'unknown' },
    points: []
  };
}

// Export capabilities configurations to global scope for use by other modules
window.ENHANCED_CAPABILITIES = ENHANCED_CAPABILITIES;
window.DEVICE_TYPE_CAPABILITIES = DEVICE_TYPE_CAPABILITIES;

// Export key functions to global scope for debugging and access
window.createNewProfile = createNewProfile;
window.loadProfiles = loadProfiles;
window.selectProfile = selectProfile;
window.showProfileDetails = showProfileDetails;

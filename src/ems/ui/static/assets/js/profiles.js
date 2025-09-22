// Device Driver Profiles Management

// Make profiles globally available
window.driverProfiles = [
  {
    id: 'sunspec-inverters',
    name: 'SunSpec Inverters',
    description: 'Standard SunSpec protocol (Huawei, SMA, ABB)',
    pointMapFile: 'pointmaps/sunspec_inverter_common.yaml',
    pollInterval: 30,
    timeout: 3000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: true,
      open_breaker: true,
      close_breaker: true,
      emergency_stop: false,
      reactive_power_control: true,
      frequency_control: false
    },
    pointMapPreview: [
      'AC_P: fc=3, address=107, type=float, scale=0.001, unit=kW',
      'AC_Q: fc=3, address=109, type=float, scale=0.001, unit=kVar',
      'DC_P: fc=3, address=149, type=float, scale=0.001, unit=kW',
      'DC_V: fc=3, address=135, type=uint16, scale=0.1, unit=V',
      'DC_I: fc=3, address=137, type=uint16, scale=0.1, unit=A',
      'Cabinet_Temp: fc=3, address=143, type=int16, scale=0.1, unit=C',
      'Status: fc=3, address=402, type=bitfield16, decode={0:\'OFF\',1:\'STANDBY\',2:\'ON\',3:\'FAULT\'}'
    ]
  },
  {
    id: 'iec-meters',
    name: 'IEC Energy Meters',
    description: 'IEC 62053 compliant meters (Carlo Gavazzi, Schneider)',
    pointMapFile: 'pointmaps/meter_iec62053_generic.yaml',
    pollInterval: 60,
    timeout: 5000,
    retries: 2,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'Active_Power: fc=3, address=1, type=int32, scale=0.001, unit=kW',
      'Reactive_Power: fc=3, address=3, type=int32, scale=0.001, unit=kVar',
      'Voltage_L1: fc=3, address=5, type=uint16, scale=0.1, unit=V',
      'Current_L1: fc=3, address=11, type=uint16, scale=0.001, unit=A',
      'Frequency: fc=3, address=17, type=uint16, scale=0.01, unit=Hz',
      'Energy_Total: fc=3, address=21, type=uint32, scale=0.01, unit=kWh'
    ]
  },
  {
    id: 'weather-stations',
    name: 'Weather Stations',
    description: 'Serial & Modbus weather (Kipp&Zonen, IMT Solar)',
    pointMapFile: 'pointmaps/weather_serial_generic.yaml',
    pollInterval: 120,
    timeout: 2000,
    retries: 3,
    protocol: 'serial',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'Irradiance: register=1, type=float, unit=W/m²',
      'Module_Temp: register=2, type=float, unit=°C',
      'Ambient_Temp: register=3, type=float, unit=°C',
      'Wind_Speed: register=4, type=float, unit=m/s',
      'Wind_Direction: register=5, type=float, unit=degrees',
      'Humidity: register=6, type=float, unit=%'
    ]
  },
  {
    id: 'bms-mqtt',
    name: 'BMS MQTT',
    description: 'Battery management systems (CATL, BYD)',
    pointMapFile: 'pointmaps/bms_mqtt_generic.yaml',
    pollInterval: 15,
    timeout: 2000,
    retries: 5,
    protocol: 'mqtt',
    controlCapabilities: {
      set_active_power_limit: true,
      open_breaker: true,
      close_breaker: true,
      emergency_stop: true,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'SOC: topic=bms/soc, type=float, unit=%',
      'SOH: topic=bms/soh, type=float, unit=%',
      'Voltage: topic=bms/voltage, type=float, unit=V',
      'Current: topic=bms/current, type=float, unit=A',
      'Temperature: topic=bms/temp, type=float, unit=°C',
      'Status: topic=bms/status, type=enum, values=[IDLE,CHARGING,DISCHARGING,FAULT]'
    ]
  },
  {
    id: 'tracker-systems',
    name: 'Solar Trackers',
    description: 'Single & dual-axis trackers (NEXTracker, Array Tech)',
    pointMapFile: 'pointmaps/tracker_generic.yaml',
    pollInterval: 300,
    timeout: 10000,
    retries: 2,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: true,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'Azimuth_Angle: fc=3, address=1, type=int16, scale=0.01, unit=degrees',
      'Elevation_Angle: fc=3, address=2, type=int16, scale=0.01, unit=degrees',
      'Target_Azimuth: fc=3, address=3, type=int16, scale=0.01, unit=degrees',
      'Motor_Current: fc=3, address=5, type=uint16, scale=0.1, unit=A',
      'Status: fc=3, address=10, type=bitfield16, decode={0:\'STOW\',1:\'TRACK\',2:\'MAINT\',3:\'FAULT\'}'
    ]
  },
  {
    id: 'power-analyzers',
    name: 'Power Quality Analyzers',
    description: 'PQA devices (Janitza, CIRCUTOR)',
    pointMapFile: 'pointmaps/pqa_modbus_generic.yaml',
    pollInterval: 60,
    timeout: 3000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'THD_V_L1: fc=3, address=100, type=uint16, scale=0.01, unit=%',
      'THD_I_L1: fc=3, address=110, type=uint16, scale=0.01, unit=%',
      'Power_Factor: fc=3, address=120, type=int16, scale=0.001, unit=none',
      'Frequency: fc=3, address=130, type=uint16, scale=0.01, unit=Hz',
      'Voltage_Unbalance: fc=3, address=140, type=uint16, scale=0.01, unit=%',
      'Current_Unbalance: fc=3, address=150, type=uint16, scale=0.01, unit=%'
    ]
  },
  {
    id: 'string-monitors',
    name: 'String Monitoring',
    description: 'DC string monitors (SolarEdge, Tigo)',
    pointMapFile: 'pointmaps/string_monitor_modbus.yaml',
    pollInterval: 120,
    timeout: 5000,
    retries: 2,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'String_01_V: fc=3, address=200, type=uint16, scale=0.1, unit=V',
      'String_01_I: fc=3, address=201, type=uint16, scale=0.01, unit=A',
      'String_01_P: fc=3, address=202, type=uint16, scale=0.1, unit=W',
      'String_02_V: fc=3, address=210, type=uint16, scale=0.1, unit=V',
      'String_02_I: fc=3, address=211, type=uint16, scale=0.01, unit=A',
      'String_Fault_Status: fc=3, address=300, type=bitfield16, decode={0:\'OK\',1:\'OPEN\',2:\'SHORT\'}'
    ]
  },
  {
    id: 'transformer-monitors',
    name: 'Transformer Monitoring',
    description: 'Transformer protection & monitoring (Schneider PM8000)',
    pointMapFile: 'pointmaps/transformer_pm8000.yaml',
    pollInterval: 60,
    timeout: 5000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: true,
      close_breaker: true,
      emergency_stop: true,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'Primary_V_L1: fc=3, address=400, type=uint16, scale=1.0, unit=V',
      'Secondary_V_L1: fc=3, address=410, type=uint16, scale=0.1, unit=V',
      'Primary_I_L1: fc=3, address=420, type=uint16, scale=0.1, unit=A',
      'Oil_Temp: fc=3, address=500, type=int16, scale=0.1, unit=C',
      'Load_Tap_Position: fc=3, address=510, type=int16, scale=1.0, unit=none',
      'Protection_Status: fc=3, address=600, type=bitfield16, decode={0:\'OK\',1:\'OVERLOAD\',2:\'OVERHEAT\'}'
    ]
  },
  {
    id: 'scada-gateways',
    name: 'SCADA Gateways',
    description: 'Industrial IoT gateways (MOXA, Advantech)',
    pointMapFile: 'pointmaps/scada_gateway_modbus.yaml',
    pollInterval: 30,
    timeout: 2000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'CPU_Usage: fc=3, address=1000, type=uint16, scale=0.1, unit=%',
      'Memory_Usage: fc=3, address=1001, type=uint16, scale=0.1, unit=%',
      'Temperature: fc=3, address=1002, type=int16, scale=0.1, unit=C',
      'Network_Status: fc=3, address=1010, type=bitfield16, decode={0:\'DOWN\',1:\'UP\'}',
      'Device_Count: fc=3, address=1020, type=uint16, scale=1.0, unit=none',
      'Uptime: fc=3, address=1030, type=uint32, scale=1.0, unit=seconds'
    ]
  },
  {
    id: 'security-systems',
    name: 'Security Systems',
    description: 'Site security & monitoring (Hikvision, Axis)',
    pointMapFile: 'pointmaps/security_system_tcp.yaml',
    pollInterval: 60,
    timeout: 3000,
    retries: 2,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: true,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      'Perimeter_Status: fc=3, address=2000, type=bitfield16, decode={0:\'SECURE\',1:\'BREACH\'}',
      'Camera_Count_Online: fc=3, address=2010, type=uint16, scale=1.0, unit=none',
      'Motion_Detected: fc=3, address=2020, type=bitfield16, decode={0:\'NO\',1:\'YES\'}',
      'Fire_Alarm_Status: fc=3, address=2030, type=bitfield16, decode={0:\'OK\',1:\'ALARM\'}',
      'Access_Control_Status: fc=3, address=2040, type=bitfield16, decode={0:\'LOCKED\',1:\'UNLOCKED\'}',
      'System_Armed: fc=3, address=2050, type=bitfield16, decode={0:\'DISARMED\',1:\'ARMED\'}'
    ]
  },
  {
    id: 'rg20c-reactive-power',
    name: 'RG20C Reactive Power Relay',
    description: 'Reaktif güç rölesi & power analyzer (RG20C)',
    pointMapFile: 'pointmaps/rg20c_reactive_power.yaml',
    pollInterval: 60,
    timeout: 3000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: true,
      frequency_control: false
    },
    pointMapPreview: [
      '# VOLTAGE MEASUREMENTS (156 registers)',
      'VL1n: fc=3, address=0, type=float32, scale=1.0, unit=V',
      'VL2n: fc=3, address=2, type=float32, scale=1.0, unit=V',
      'VL3n: fc=3, address=4, type=float32, scale=1.0, unit=V',
      'VL1L2: fc=3, address=8, type=float32, scale=1.0, unit=V',
      'VL2L3: fc=3, address=10, type=float32, scale=1.0, unit=V',
      'VL3L1: fc=3, address=12, type=float32, scale=1.0, unit=V',
      '',
      '# CURRENT MEASUREMENTS (154 registers)',
      'IL1: fc=3, address=14, type=float32, scale=0.001, unit=A',
      'IL2: fc=3, address=16, type=float32, scale=0.001, unit=A',
      'IL3: fc=3, address=18, type=float32, scale=0.001, unit=A',
      'In_notr_akim: fc=3, address=22, type=float32, scale=0.001, unit=A',
      '',
      '# POWER MEASUREMENTS (9 registers)',
      'SUM_P: fc=3, address=42, type=float32, scale=0.001, unit=kW',
      'QL1: fc=3, address=48, type=float32, scale=0.001, unit=kVar',
      'QL2: fc=3, address=50, type=float32, scale=0.001, unit=kVar',
      'QL3: fc=3, address=52, type=float32, scale=0.001, unit=kVar',
      'SUM_Q: fc=3, address=64, type=float32, scale=0.001, unit=kVar',
      '',
      '# APPARENT POWER & POWER FACTOR',
      'SL2: fc=3, address=68, type=float32, scale=1.0, unit=VA',
      'SL3: fc=3, address=70, type=float32, scale=1.0, unit=VA',
      'PF: fc=3, address=134, type=float32, scale=1.0, unit=none',
      'PFL1: fc=3, address=126, type=float32, scale=1.0, unit=none',
      'PFL2: fc=3, address=128, type=float32, scale=1.0, unit=none',
      '',
      '# REACTIVE POWER CONTROL STAGES',
      'REG_1_KADEME_GUCU: fc=3, address=10240, type=float32, scale=1.0, unit=VAr',
      'REG_2_KADEME_GUCU: fc=3, address=10259, type=float32, scale=1.0, unit=VAr',
      'REG_3_KADEME_GUCU: fc=3, address=10278, type=float32, scale=1.0, unit=VAr',
      'REG_4_KADEME_GUCU: fc=3, address=10297, type=float32, scale=1.0, unit=VAr',
      '',
      '# HARMONIC ANALYSIS (Examples)',
      'VL1_H2: fc=3, address=8226, type=float32, scale=1.0, unit=V',
      'IL1_H2: fc=3, address=4138, type=float32, scale=0.001, unit=A',
      '',
      '# TOTAL: 348 REGISTERS with voltage, current, power,',
      '# harmonic analysis, reactive power control stages'
    ]
  },
  {
    id: 'generic-modbus-rtu',
    name: 'Generic Modbus RTU Device',
    description: 'Generic Modbus RTU device over serial connection',
    pointMapFile: 'pointmaps/generic_modbus_brandA.yaml',
    pollInterval: 30,
    timeout: 5000,
    retries: 3,
    protocol: 'modbus_rtu',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: [
      '# GENERIC MODBUS RTU REGISTERS',
      'voltage_l1: fc=3, address=0, type=uint16, scale=0.1, unit=V',
      'voltage_l2: fc=3, address=1, type=uint16, scale=0.1, unit=V',
      'voltage_l3: fc=3, address=2, type=uint16, scale=0.1, unit=V',
      'current_l1: fc=3, address=10, type=uint16, scale=0.01, unit=A',
      'current_l2: fc=3, address=11, type=uint16, scale=0.01, unit=A',
      'current_l3: fc=3, address=12, type=uint16, scale=0.01, unit=A',
      'power_total: fc=3, address=20, type=uint32, scale=0.001, unit=kW',
      'energy_total: fc=3, address=30, type=uint32, scale=0.001, unit=kWh',
      '# Serial: 9600 baud, 8 data bits, no parity, 1 stop bit'
    ]
  }
];

let selectedProfileId = null;
let originalProfileData = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  renderProfilesList();
  setupEventListeners();
  showNoProfileSelected();
});

function renderProfilesList() {
  const profilesList = document.getElementById('profilesList');
  if (!profilesList) return;
  
  profilesList.innerHTML = window.driverProfiles.map(profile => `
    <div class="profile-item p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors" 
         data-profile-id="${profile.id}" 
         onclick="selectProfile('${profile.id}')">
      <div class="font-semibold text-gray-900 dark:text-gray-100">${profile.name}</div>
      <div class="text-xs text-gray-500">${profile.description}</div>
    </div>
  `).join('');
}

function selectProfile(profileId) {
  selectedProfileId = profileId;
  const profile = window.driverProfiles.find(p => p.id === profileId);
  if (!profile) return;
  
  // Store original data for reset functionality
  originalProfileData = JSON.parse(JSON.stringify(profile));
  
  // Update visual selection
  document.querySelectorAll('.profile-item').forEach(item => {
    item.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-700');
  });
  
  const selectedItem = document.querySelector(`[data-profile-id="${profileId}"]`);
  if (selectedItem) {
    selectedItem.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-700');
  }
  
  // Show profile details
  showProfileDetails(profile);
}

function showProfileDetails(profile) {
  // Hide no selection message, show form
  document.getElementById('noProfileSelected').classList.add('hidden');
  document.getElementById('profileDetailsForm').classList.remove('hidden');
  
  // Populate form fields
  document.getElementById('selectedProfileTitle').textContent = profile.name;
  document.getElementById('profileName').value = profile.name;
  document.getElementById('pointMapFile').value = profile.pointMapFile;
  document.getElementById('pollInterval').value = profile.pollInterval;
  document.getElementById('timeout').value = profile.timeout;
  document.getElementById('retries').value = profile.retries;
  document.getElementById('protocol').value = profile.protocol;
  
  // Set control capabilities checkboxes
  document.getElementById('cap_power_limit').checked = profile.controlCapabilities.set_active_power_limit;
  document.getElementById('cap_open_breaker').checked = profile.controlCapabilities.open_breaker;
  document.getElementById('cap_close_breaker').checked = profile.controlCapabilities.close_breaker;
  document.getElementById('cap_emergency_stop').checked = profile.controlCapabilities.emergency_stop;
  document.getElementById('cap_reactive_power').checked = profile.controlCapabilities.reactive_power_control;
  document.getElementById('cap_frequency').checked = profile.controlCapabilities.frequency_control;
  
  // Update point map preview
  const previewDiv = document.getElementById('pointMapPreview');
  previewDiv.innerHTML = profile.pointMapPreview.map(line => `<div>${line}</div>`).join('');
}

function showNoProfileSelected() {
  document.getElementById('noProfileSelected').classList.remove('hidden');
  document.getElementById('profileDetailsForm').classList.add('hidden');
  selectedProfileId = null;
  originalProfileData = null;
}

function setupEventListeners() {
  // New Profile button
  const btnNewProfile = document.getElementById('btnNewProfile');
  if (btnNewProfile) btnNewProfile.onclick = createNewProfile;
  
  // Import Profile button
  const btnImportProfile = document.getElementById('btnImportProfile');
  if (btnImportProfile) btnImportProfile.onclick = importProfile;
  
  // Save Profile button
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  if (btnSaveProfile) btnSaveProfile.onclick = saveProfile;
  
  // Test Profile button
  const btnTestProfile = document.getElementById('btnTestProfile');
  if (btnTestProfile) btnTestProfile.onclick = testProfile;
  
  // Reset Profile button
  const btnResetProfile = document.getElementById('btnResetProfile');
  if (btnResetProfile) btnResetProfile.onclick = resetProfile;
  
  // Delete Profile button
  const btnDeleteProfile = document.getElementById('btnDeleteProfile');
  if (btnDeleteProfile) btnDeleteProfile.onclick = deleteProfile;
}

function createNewProfile() {
  const name = prompt('Profile Name:', 'New Profile');
  if (!name) return;
  
  const newProfile = {
    id: 'profile-' + Date.now(),
    name: name,
    description: 'Custom profile',
    pointMapFile: 'pointmaps/custom.yaml',
    pollInterval: 30,
    timeout: 3000,
    retries: 3,
    protocol: 'modbus_tcp',
    controlCapabilities: {
      set_active_power_limit: false,
      open_breaker: false,
      close_breaker: false,
      emergency_stop: false,
      reactive_power_control: false,
      frequency_control: false
    },
    pointMapPreview: ['# New profile - configure point map']
  };
  
  window.driverProfiles.push(newProfile);
  renderProfilesList();
  selectProfile(newProfile.id);
  showSuccess('New profile created successfully');
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
        // In a real implementation, this would parse the file and create a profile
        showSuccess(`Profile imported from ${file.name} (mock implementation)`);
      } catch (error) {
        showError(`Failed to import profile: ${error.message}`);
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

function saveProfile() {
  if (!selectedProfileId) return;
  
  const profile = window.driverProfiles.find(p => p.id === selectedProfileId);
  if (!profile) return;
  
  // Update profile with form values
  profile.name = document.getElementById('profileName').value;
  profile.pointMapFile = document.getElementById('pointMapFile').value;
  profile.pollInterval = parseInt(document.getElementById('pollInterval').value);
  profile.timeout = parseInt(document.getElementById('timeout').value);
  profile.retries = parseInt(document.getElementById('retries').value);
  profile.protocol = document.getElementById('protocol').value;
  
  // Update control capabilities
  profile.controlCapabilities = {
    set_active_power_limit: document.getElementById('cap_power_limit').checked,
    open_breaker: document.getElementById('cap_open_breaker').checked,
    close_breaker: document.getElementById('cap_close_breaker').checked,
    emergency_stop: document.getElementById('cap_emergency_stop').checked,
    reactive_power_control: document.getElementById('cap_reactive_power').checked,
    frequency_control: document.getElementById('cap_frequency').checked
  };
  
  // Update title and list
  document.getElementById('selectedProfileTitle').textContent = profile.name;
  renderProfilesList();
  selectProfile(selectedProfileId); // Re-select to update highlighting
  
  showSuccess('Profile saved successfully');
}

function testProfile() {
  if (!selectedProfileId) return;
  
  const profile = window.driverProfiles.find(p => p.id === selectedProfileId);
  if (!profile) return;
  
  // Mock connection test
  showInfo(`Testing connection for ${profile.name}...`);
  
  setTimeout(() => {
    const success = Math.random() > 0.3; // 70% success rate for demo
    if (success) {
      showSuccess(`Connection test successful for ${profile.name}`);
    } else {
      showError(`Connection test failed for ${profile.name}`);
    }
  }, 2000);
}

function resetProfile() {
  if (!selectedProfileId || !originalProfileData) return;
  
  if (confirm('Reset all changes to original values?')) {
    const profileIndex = window.window.driverProfiles.findIndex(p => p.id === selectedProfileId);
    if (profileIndex >= 0) {
      driverProfiles[profileIndex] = JSON.parse(JSON.stringify(originalProfileData));
      showProfileDetails(driverProfiles[profileIndex]);
      renderProfilesList();
      selectProfile(selectedProfileId);
      showSuccess('Profile reset to original values');
    }
  }
}

function deleteProfile() {
  if (!selectedProfileId) return;
  
  const profile = window.driverProfiles.find(p => p.id === selectedProfileId);
  if (!profile) return;
  
  if (confirm(`Delete profile "${profile.name}"? This action cannot be undone.`)) {
    driverProfiles = driverProfiles.filter(p => p.id !== selectedProfileId);
    renderProfilesList();
    showNoProfileSelected();
    showSuccess('Profile deleted successfully');
  }
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
  
  div.className = `fixed top-4 right-4 ${bgColor} ${textColor} px-4 py-2 rounded-lg border ${borderColor} z-50 max-w-sm shadow-lg`;
  div.textContent = message;
  
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// Form change detection
document.addEventListener('DOMContentLoaded', () => {
  // Debug: Check if profiles are loaded
  console.log('Profiles.js loaded, profile count:', window.driverProfiles.length);
  console.log('Profiles:', window.driverProfiles.map(p => p.name));
  
  // Add change detection to form fields
  const formFields = ['profileName', 'pointMapFile', 'pollInterval', 'timeout', 'retries', 'protocol',
                     'cap_power_limit', 'cap_open_breaker', 'cap_close_breaker', 'cap_emergency_stop', 
                     'cap_reactive_power', 'cap_frequency'];
  
  formFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('change', () => {
        // Could add unsaved changes indicator here
      });
    }
  });
});
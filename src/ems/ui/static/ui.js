const API_BASE = '';

async function fetchJSON(path) {
  const resp = await fetch(`${API_BASE}${path}`);
  if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
  return resp.json();
}

// Theme toggle
function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const apply = (mode) => {
    const root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', mode);
  };
  apply(localStorage.getItem('theme') || 'light');
  btn.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    apply(next);
  });
}

// Nav views
function initNav() {
  const items = document.querySelectorAll('.nav-item');
  items.forEach((el) =>
    el.addEventListener('click', () => showView(el.getAttribute('data-nav')))
  );
}

function showView(key) {
  const sections = {
    fleet: document.getElementById('view-fleet'),
    site: document.getElementById('view-site'),
    analytics: document.getElementById('view-analytics'),
    control: document.getElementById('view-control'),
    reports: document.getElementById('view-reports'),
    settings: document.getElementById('view-settings'),
  };
  Object.values(sections).forEach((s) => s && s.classList.add('hidden'));
  if (sections[key]) sections[key].classList.remove('hidden');
}

// Leaflet map
let fleetMap, fleetMapMarkers = [];
function initMap() {
  const mapEl = document.getElementById('fleetMap');
  if (!mapEl) return;
  fleetMap = L.map('fleetMap').setView([38.9637, 35.2433], 5); // Turkey center
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(fleetMap);
}

function setFleetMarkers(sites) {
  if (!fleetMap) return;
  fleetMapMarkers.forEach((m) => m.remove());
  const latlngs = [];
  fleetMapMarkers = sites.map((s) => {
    const color = s.status === 'online' ? 'green' : s.status === 'degraded' ? 'orange' : 'red';
    const lat = Number(s.lat) || 0, lng = Number(s.lng) || 0;
    const latlng = [lat, lng];
    latlngs.push(latlng);
    const marker = L.circleMarker(latlng, { radius: 7, color, fillColor: color, fillOpacity: 0.85 }).addTo(fleetMap);
    marker.bindPopup(`<strong>${s.name}</strong><br/>Cap: ${s.capacity} MW`);
    marker.on('click', () => navigateToSite(s));
    return marker;
  });
  if (latlngs.length) {
    const bounds = L.latLngBounds(latlngs);
    if (bounds.isValid()) fleetMap.fitBounds(bounds.pad(0.2));
  }
}

// Charts
const charts = {};
function upsertChart(id, cfg) {
  const ctx = document.getElementById(id);
  if (!ctx) return null;
  if (charts[id]) { charts[id].data = cfg.data; charts[id].options = cfg.options || {}; charts[id].update(); return charts[id]; }
  charts[id] = new Chart(ctx, cfg); return charts[id];
}

// KPIs & Tables
function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }

// Badge helpers for high-contrast chips
function makeBadge(text, kind) {
  const color = {
    green: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    gray: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }[kind] || 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}">${text}</span>`;
}

function renderFleetSitesTable(rows) {
  const tbody = document.getElementById('fleetSiteTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    const zebra = idx % 2 ? 'bg-gray-50 dark:bg-gray-900/40' : 'bg-white dark:bg-gray-900/20';
    tr.className = `text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 ${zebra}`;
    const prBadge = makeBadge(`${r.pr}%`, r.pr >= 85 ? 'green' : r.pr >= 70 ? 'amber' : 'red');
    const socText = (r.soc === '-' ? '-' : `${r.soc}%`);
    const alarmBadge = r.alarms && r.alarms > 0 ? makeBadge(`${r.alarms}`, 'red') : makeBadge('0', 'gray');
    tr.innerHTML = `<td class=\"px-3 py-2 font-medium\">${r.name}</td>
                    <td class=\"px-3 py-2\">${r.capacity}</td>
                    <td class=\"px-3 py-2\">${r.generation}</td>
                    <td class=\"px-3 py-2\">${prBadge}</td>
                    <td class=\"px-3 py-2\">${socText}</td>
                    <td class=\"px-3 py-2\">${alarmBadge}</td>`;
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', () => navigateToSite(r));
    tbody.appendChild(tr);
  });
}

function navigateToSite(site) {
  showView('site');
  setText('siteProd', `${(Math.random()* (Number(site.capacity)||0) * 1000).toFixed(0)} kW`);
  setText('siteDaily', `${(Math.random()*20+5).toFixed(1)} MWh`);
  setText('siteSocSoh', `${site.soc ?? '-'}% / 98%`);
  setText('siteTxLoad', `${(Math.random()*60+20).toFixed(0)} %`);
  // No site selector/search in breakers (site context already selected)
}

// Demo data adapters from current API
async function loadFleetFromApi() {
  // Read locally created sites and merge with demo default
  await fetchJSON('/ui/api/devices');
  const stored = (()=>{ try{ return JSON.parse(localStorage.getItem('emsSites')||'[]'); }catch(e){ return []; }})();
  const base = {
    id: 'site-1', name: 'Demo Site', lat: 39.9, lng: 32.85, status: 'online', capacity: 5.0, pr: 85, soc: 72, alarms: 0,
  };
  const sites = [base, ...stored];
  const primarySite = sites[0] ?? base;
  setFleetMarkers(sites.map(s=>({ ...s, generation: Math.max(0, Math.round(Math.random()*s.capacity*1000)/1000) })));
  const online = sites.length; const offline = 0;
  const totalCap = sites.reduce((a,b)=>a+(Number(b.capacity)||0),0);
  const gen = sites.reduce((a,b)=>a+(Math.max(0, Math.round(Math.random()* (Number(b.capacity)||0) *1000)/1000)),0);
  const fleetSocVals = sites.map(s=>Number(s.soc)).filter(v=>Number.isFinite(v));
  const fleetSoc = fleetSocVals.length? (fleetSocVals.reduce((a,b)=>a+b,0)/fleetSocVals.length).toFixed(0):'-';
  setText('kpiSitesOnline', online);
  setText('kpiSitesOffline', offline);
  setText('kpiCapacity', `${totalCap.toFixed(2)} MW`);
  setText('kpiGeneration', `${gen.toFixed(2)} MW`);
  setText('kpiFleetSoc', `${fleetSoc}${fleetSoc==='-'?'':'%'}`);
  setText('kpiAlarms', `0`);
  renderFleetSitesTable(sites.map(s=>({ name:s.name, capacity:s.capacity, generation: (Math.random()* (Number(s.capacity)||0)).toFixed(2), pr: 85, soc: s.soc??'-', alarms: 0, lat: s.lat, lng: s.lng })));

  // Charts (demo values)
  upsertChart('fleetProductionChart', {
    type: 'line',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        { label: 'Production (MW)', data: Array.from({ length: 24 }, () => Math.random() * (Number(primarySite.capacity) || 0)), fill: true, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)' },
        { label: 'Capacity (MW)', data: Array(24).fill(Number(primarySite.capacity) || 0), borderDash: [4,2], borderColor: '#9ca3af' },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: true } }, scales: { x: { grid: { display:false } }, y: { beginAtZero: true } } },
  });

  upsertChart('energyMixDonut', {
    type: 'doughnut', data: { labels: ['PV','Battery','Grid'], datasets: [{ data: [70,20,10], backgroundColor: ['#22c55e','#f59e0b','#ef4444'] }] }, options: { plugins: { legend: { position: 'bottom' } } }
  });

  upsertChart('regionalBarChart', {
    type: 'bar', data: { labels: ['Marmara','Ege','İç Anadolu'], datasets: [{ label: 'MW', data: [2.2,1.5,1.3], backgroundColor: '#3b82f6' }] }, options: { scales: { y: { beginAtZero:true } } }
  });

  upsertChart('co2Chart', {
    type: 'line', data: { labels: Array.from({ length: 12 }, (_, i) => `M${i+1}`), datasets: [{ label: 'CO₂ Saved (t)', data: Array.from({ length: 12 }, () => 50 + Math.random()*10), borderColor: '#10b981' }] }
  });

  // Site level demos
  setText('siteProd', `${(Math.random()* (Number(primarySite.capacity)||0) * 1000).toFixed(0)} kW`);
  setText('siteDaily', `${(Math.random()*20+5).toFixed(1)} MWh`);
  setText('siteSocSoh', `${primarySite.soc ?? '-'}% / 98%`);
  setText('siteTxLoad', `${(Math.random()*60+20).toFixed(0)} %`);
  // Populate device tables with demo data
  const gridBody = document.getElementById('gridDeviceTableBody');
  if (gridBody) {
    gridBody.innerHTML='';
    const rows = [
      { name:'Main Meter', type:'Ana sayaç', ep:'10.0.0.10:502', v: '400', a:'120', pf:'0.98' },
      { name:'TX-IED', type:'Trafo IED', ep:'10.0.0.11:2404', v:'398', a:'110', pf:'0.99' },
    ];
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.className='border-b border-gray-100 dark:border-gray-800'; tr.innerHTML=`<td class=\"px-3 py-2\">${r.name}</td><td class=\"px-3 py-2\">${r.type}</td><td class=\"px-3 py-2\">${r.ep}</td><td class=\"px-3 py-2\">${r.v}</td><td class=\"px-3 py-2\">${r.a}</td><td class=\"px-3 py-2\">${r.pf}</td>`; gridBody.appendChild(tr); });
  }
  const bmsBody = document.getElementById('bmsTableBody');
  if (bmsBody) {
    bmsBody.innerHTML='';
    const rows = [
      { name:'BMS-1', type:'BMS Master', ep:'10.0.0.20:502', soc:72, soh:98, p:120 },
      { name:'PCS-1', type:'PCS', ep:'10.0.0.21:502', soc:72, soh:98, p:-80 },
    ];
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.className='border-b border-gray-100 dark:border-gray-800'; tr.innerHTML=`<td class=\"px-3 py-2\">${r.name}</td><td class=\"px-3 py-2\">${r.type}</td><td class=\"px-3 py-2\">${r.ep}</td><td class=\"px-3 py-2\">${r.soc}%</td><td class=\"px-3 py-2\">${r.soh}%</td><td class=\"px-3 py-2\">${r.p}</td>`; bmsBody.appendChild(tr); });
  }
  const facBody = document.getElementById('facilityTableBody');
  if (facBody) {
    facBody.innerHTML='';
    const rows = [
      { name:'Weather-1', type:'Weather', ep:'/dev/ttyUSB-weather', status:'online' },
      { name:'Door-1', type:'Door Sensor', ep:'i2c:0x20', status:'closed' },
    ];
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.className='border-b border-gray-100 dark:border-gray-800'; tr.innerHTML=`<td class=\"px-3 py-2\">${r.name}</td><td class=\"px-3 py-2\">${r.type}</td><td class=\"px-3 py-2\">${r.ep}</td><td class=\"px-3 py-2\">${r.status}</td>`; facBody.appendChild(tr); });
  }
  const secBody = document.getElementById('securityTableBody');
  if (secBody) {
    secBody.innerHTML='';
    const rows = [
      { name:'Cam-1', type:'Camera', ep:'rtsp://...', status:'online' },
      { name:'Fire-1', type:'Smoke', ep:'modbus:3', status:'ok' },
    ];
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.className='border-b border-gray-100 dark:border-gray-800'; tr.innerHTML=`<td class=\"px-3 py-2\">${r.name}</td><td class=\"px-3 py-2\">${r.type}</td><td class=\"px-3 py-2\">${r.ep}</td><td class=\"px-3 py-2\">${r.status}</td>`; secBody.appendChild(tr); });
  }
}

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const views = {
    inv: document.getElementById('tab-inv'),
    grid: document.getElementById('tab-grid'),
    bms: document.getElementById('tab-bms'),
    breakers: document.getElementById('tab-breakers'),
    analyzers: document.getElementById('tab-analyzers'),
    facility: document.getElementById('tab-facility'),
    security: document.getElementById('tab-security'),
  };
  buttons.forEach((btn) => btn.addEventListener('click', () => {
    Object.values(views).forEach((v) => v.classList.add('hidden'));
    buttons.forEach((b) => b.classList.remove('bg-gray-100','dark:bg-gray-800'));
    const key = btn.getAttribute('data-tab');
    views[key].classList.remove('hidden');
    btn.classList.add('bg-gray-100','dark:bg-gray-800');
  }));
}

// Breaker grid (control demo)
function renderBreakerGrid(items) {
  const grid = document.getElementById('breakerGrid');
  const siteGrid = document.getElementById('siteBreakerGrid');
  const target = grid || siteGrid;
  if (!target) return;
  target.innerHTML = '';
  items.forEach((b) => {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-950';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">${b.name}</div>
        <span class="text-xs ${b.status==='Closed'?'text-green-600':'text-red-600'}">${b.status}</span>
      </div>
      <div class="mt-3 flex items-center justify-between">
        <div class="text-sm text-gray-500">Remote</div>
        <label class="inline-flex items-center cursor-pointer">
          <input type="checkbox" class="sr-only peer" ${b.status==='Closed'?'checked':''}>
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:block after:h-5 after:w-5 after:bg-white after:rounded-full after:transition-all peer-checked:bg-green-500"></div>
        </label>
      </div>
      <div class="mt-3 text-xs text-gray-500">Last event: ${b.lastEvent}</div>
    `;
    target.appendChild(card);
  });
}

async function refreshAll() {
  try {
    await loadFleetFromApi();
    // Placeholder demo breakers
    renderBreakerGrid([
      { name: 'TMŞ-1', status: Math.random()>0.5?'Closed':'Open', lastEvent: 'OK' },
      { name: 'TMŞ-2', status: Math.random()>0.5?'Closed':'Open', lastEvent: 'OK' },
      { name: 'TMŞ-3', status: Math.random()>0.5?'Closed':'Open', lastEvent: 'Trip' },
    ]);
    // Site-specific extras with enhanced audit trail
    const bars = document.getElementById('siteBusbarBars'); if (bars) { bars.innerHTML=''; for(let i=0;i<6;i++){ const v=Math.round(Math.random()*100); const b=document.createElement('div'); b.className='w-8 bg-blue-500/70 dark:bg-blue-400/70'; b.style.height=`${v*1.2}px`; bars.appendChild(b);} }
    const meas = document.getElementById('siteMeasureGrid'); if (meas) {
      meas.innerHTML=''; const m={ v1:232.37,v2:234.71,v3:234.80,a1:105.07,a2:99.47,a3:111.56,p:150,q:12,s:151,pf1:0.98,pf2:0.97,pf3:0.99,pfAvg:0.98,f:50.00,kwhOut:4567,kwhIn:12345 };
      Object.entries(m).forEach(([k,v])=>{ const c=document.createElement('div'); c.className='rounded-lg border border-gray-200 dark:border-gray-800 p-3'; c.innerHTML=`<div class="text-xs text-gray-500">${k.toUpperCase()}</div><div class="text-lg font-semibold">${(typeof v==='number')?v.toFixed(2):v}</div>`; meas.appendChild(c); });
      const svg=document.getElementById('siteTrendSvg'); if(svg){ svg.innerHTML='<polyline fill="none" stroke="#1f6df2" stroke-width="2" points="0,80 50,60 100,70 150,55 200,65 250,50 300,60 350,52 400,58" />'; }
    }
    const alarmsBody = document.getElementById('siteAlarmsBody'); if (alarmsBody) {
      alarmsBody.innerHTML='';
      const rows = [
        { t: new Date().toLocaleString('tr-TR'), device: 'TMŞ-3', type: 'Trip', sev: 'High', msg: 'Overcurrent', user: 'operator1' },
        { t: new Date(Date.now()-3600000).toLocaleString('tr-TR'), device: 'TMŞ-1', type: 'Undervoltage', sev: 'Medium', msg: 'Phase L2 195V', user: 'system' },
      ];
      rows.forEach(r=>{ const tr=document.createElement('tr'); tr.className='border-b border-gray-100 dark:border-gray-800'; tr.innerHTML=`<td class=\"px-3 py-2\">${r.t}</td><td class=\"px-3 py-2\">${r.device}</td><td class=\"px-3 py-2\">${r.type}</td><td class=\"px-3 py-2\">${r.sev}</td><td class=\"px-3 py-2\">${r.msg}</td>`; alarmsBody.appendChild(tr); });
    }
  } catch (e) {
    console.error(e);
  } finally {
    setTimeout(refreshAll, 60000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initMap();
  initTabs();
  showView('fleet');
  refreshAll();
  bindAddDeviceButtons();
  const ss = document.getElementById('siteSearch');
  if (ss) ss.addEventListener('input', () => filterSites());
});

function filterSites(){
  const q = (document.getElementById('siteSearch')?.value || '').toLowerCase();
  const stored = (()=>{ try{ return JSON.parse(localStorage.getItem('emsSites')||'[]'); }catch(e){ return []; }})();
  const base = { id: 'site-1', name: 'Demo Site', lat: 39.9, lng: 32.85, status: 'online', capacity: 5.0, pr: 85, soc: 72, alarms: 0 };
  const sites = [base, ...stored].filter(s => s.name.toLowerCase().includes(q));
  renderFleetSitesTable(sites.map(s=>({ name:s.name, capacity:s.capacity, generation: (Math.random()* (Number(s.capacity)||0)).toFixed(2), pr: 85, soc: s.soc??'-', alarms: Math.random()>0.8?1:0 })));
  setFleetMarkers(sites.map(s=>({ ...s, generation: Math.max(0, Math.round(Math.random()*s.capacity*1000)/1000) })));
}

// Add Device Modal Logic
const ADD_STEPS = ['Basics','Connection','Discovery','Telemetry','Control','Alarms','Commissioning'];
let addState = { type: null, step: 0, data: {} };

function openAddModal(type) {
  addState = { type, step: 0, data: {} };
  document.getElementById('addDeviceTitle').textContent = `${type} — Add Device`;
  const modal = document.getElementById('addDeviceModal');
  modal.classList.remove('hidden');
  modal.scrollTop = 0;
  renderAddSteps();
  renderAddStepBody();
}

function closeAddModal(){
  const modal = document.getElementById('addDeviceModal');
  modal.classList.add('hidden');
}

function renderAddSteps(){
  const wrap = document.getElementById('addSteps'); wrap.innerHTML='';
  ADD_STEPS.forEach((label, idx)=>{
    const b = document.createElement('button');
    b.className = `px-2 py-1 rounded-md ${idx===addState.step?'bg-gray-100 dark:bg-gray-800':''}`;
    b.textContent = `${idx+1}. ${label}`; b.onclick=()=>{ addState.step=idx; renderAddSteps(); renderAddStepBody(); };
    wrap.appendChild(b);
  });
  document.getElementById('addBack').classList.toggle('hidden', addState.step===0);
  document.getElementById('addNext').classList.toggle('hidden', addState.step===ADD_STEPS.length-1);
  document.getElementById('addSave').classList.toggle('hidden', addState.step!==ADD_STEPS.length-1);
}

function input(label, id, placeholder=''){
  return `<label class=\"text-sm\">${label}<input id=\"${id}\" placeholder=\"${placeholder}\" class=\"w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 mt-1\"/></label>`;
}
function select(label, id, options){
  return `<label class=\"text-sm\">${label}<select id=\"${id}\" class=\"w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 mt-1\">${options.map(o=>`<option>${o}</option>`).join('')}</select></label>`;
}

function renderAddStepBody(){
  const body = document.getElementById('addStepBody');
  const t = addState.type;
  const step = ADD_STEPS[addState.step];
  const two = (a,b)=> `<div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">${a}${b}</div>`;
  if (step==='Basics'){
    body.innerHTML = two(input('Name/ID','devName'), input('Vendor','vendor')) + two(input('Model','model'), input('Serial No','serial')) + two(input('Firmware','fw'), select('Site/Bus/Feeder','bus',[ 'Bus A','Bus B' ]));
    if (t==='Inverter') body.innerHTML += two(input('DC Strings','dcStrings'), two(input('AC nominal kVA','acKva'), input('MPPT Count','mppt')));
    if (t==='Transformer & Grid') body.innerHTML += two(select('Type','gridType',[ 'Trafo IED','Ana sayaç','Bay controller' ]), input('kVA','kva'));
    if (t==='BMS') body.innerHTML += two(select('Type','bmsType',[ 'BMS Master','PCS','Rack/Pack' ]), two(input('Nominal kWh','nomKwh'), input('Nominal kW','nomKw')));
    if (t==='Breakers') body.innerHTML += two(input('Nominal Current (In)','in'), select('Type','tmstype',[ 'Thermal','Magnetic' ]));
    if (t==='Analyzers') body.innerHTML += select('Type','anType',[ 'PQ Analyzer','Multimeter','RTU' ]);
    if (t==='Facility') body.innerHTML += select('Type','facType',[ 'Weather','Temp/Humidity','HVAC','Lighting','Door Sensor' ]);
    if (t==='Security') body.innerHTML += select('Type','secType',[ 'Camera','Access','Fire' ]);
  } else if (step==='Connection'){
    const proto = (opts)=> select('Protocol','proto',opts)+two(input('IP/Host','host','10.0.0.X'), input('Port','port','502')) + two(input('Slave/Unit ID','unit','1'), input('COM/RTU','serial','/dev/ttyUSB0'));
    if (t==='Inverter') body.innerHTML = proto(['SunSpec','Modbus TCP','Modbus RTU','Vendor API']);
    else if (t==='Transformer & Grid') body.innerHTML = proto(['Modbus TCP','Modbus RTU','IEC60870-5-104']);
    else if (t==='BMS') body.innerHTML = proto(['Modbus TCP','Modbus RTU','Vendor TCP API']);
    else if (t==='Breakers') body.innerHTML = proto(['Modbus TCP','Modbus RTU']);
    else if (t==='Analyzers') body.innerHTML = proto(['Modbus TCP','Modbus RTU','IEC104']);
    else if (t==='Facility') body.innerHTML = proto(['Modbus RTU','Modbus TCP','MQTT','HTTP']);
    else if (t==='Security') body.innerHTML = proto(['RTSP','ONVIF','Modbus TCP']);
  } else if (step==='Discovery'){
    body.innerHTML = two(input('CIDR','cidr','192.168.1.0/24'), input('Probe','probe','Sample Read')) + `<button class=\"px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700\" id=\"btnProbe\">Run Discovery</button><div id=\"probeResult\" class=\"text-sm text-gray-500\">No results yet.</div>`;
  } else if (step==='Telemetry'){
    body.innerHTML = `<div class=\"grid grid-cols-2 md:grid-cols-3 gap-3\"><div class=\"rounded-lg border border-gray-200 dark:border-gray-800 p-3\">V1/V2/V3</div><div class=\"rounded-lg border border-gray-200 dark:border-gray-800 p-3\">A1/A2/A3</div><div class=\"rounded-lg border border-gray-200 dark:border-gray-800 p-3\">P/Q/S</div><div class=\"rounded-lg border border-gray-200 dark:border-gray-800 p-3\">PF & f</div></div>`;
  } else if (step==='Control'){
    body.innerHTML = `<div class=\"grid grid-cols-2 gap-3\">${input('Power Limit (%)','pLimit')} ${input('VAR/Cosφ','var')} </div>`;
    if (t==='Breakers') body.innerHTML = `<div class=\"grid grid-cols-2 gap-3\">${input('Open Coil','openAddr')} ${input('Close Coil','closeAddr')} ${input('Pulse ms','pulseMs')} ${input('Open FB','openFb')} ${input('Close FB','closeFb')} ${input('Trip FB','tripFb')}</div>`;
  } else if (step==='Alarms'){
    body.innerHTML = `<div class=\"grid grid-cols-2 gap-3\">${input('Overcurrent (%)','aOver')} ${input('Undervoltage','aUnderV')} ${input('Overvoltage','aOverV')} ${input('Temp Max','aTemp')}</div>`;
  } else if (step==='Commissioning'){
    body.innerHTML = `<ul class=\"list-disc pl-6 text-sm text-gray-600 dark:text-gray-400\"><li>Connection OK</li><li>Sample Read OK</li><li>Telemetry sanity</li><li>Control dry-run</li></ul>`;
  }
}

function bindAddDeviceButtons(){
  const bind = (id, type)=>{ const el=document.getElementById(id); if(el) el.onclick=()=>openAddModal(type); };
  bind('btnAddInverter','Inverter');
  bind('btnAddGrid','Transformer & Grid');
  bind('btnAddBms','BMS');
  bind('btnAddBreaker','Breakers');
  bind('btnAddAnalyzer','Analyzers');
  bind('btnAddFacility','Facility');
  bind('btnAddSecurity','Security');
  const close = document.getElementById('addDeviceClose'); if (close) close.onclick=closeAddModal;
  // Close on backdrop click or Escape
  const modal = document.getElementById('addDeviceModal');
  modal.addEventListener('click', (e)=>{ if (e.target === modal) closeAddModal(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && !modal.classList.contains('hidden')) closeAddModal(); });
  document.getElementById('addBack').onclick = ()=>{ if(addState.step>0){ addState.step--; renderAddSteps(); renderAddStepBody(); } };
  document.getElementById('addNext').onclick = ()=>{ if(addState.step<ADD_STEPS.length-1){ addState.step++; renderAddSteps(); renderAddStepBody(); } };
  document.getElementById('addSave').onclick = saveNewDevice;
  document.getElementById('addTest').onclick = ()=>{ const r=document.getElementById('probeResult'); if(r) r.textContent='Test OK (mock)'; };
}

function saveNewDevice(){
  const key = 'emsDevices';
  const raw = localStorage.getItem(key); const list = raw? JSON.parse(raw): [];
  const dev = { type: addState.type, name: document.getElementById('devName')?.value || `${addState.type}-${list.length+1}`, endpoint: document.getElementById('host')?.value || '', meta: addState.data };
  list.push(dev); localStorage.setItem(key, JSON.stringify(list));
  closeAddModal();
  // Refresh lists
  refreshAll();
}

// Wizard State and Mock APIs
/** @typedef {{name:string, code?:string, type:'PV'|'PV+BESS'|'BESS', operator?:string, contact?:{name?:string,email?:string,phone?:string}}} SiteBasics */
/** @typedef {{lat:number,lng:number,country?:string,city?:string,address?:string,timezone:string}} SiteLocation */
/** @typedef {{dcMWp?:number,acMVA?:number,topologyPreset:'PV_INV_BUS_TX_GRID'|'PV_INV_BUS_TX_GRID_BESS',inverterCount:number,hasBESS:boolean,bess?:{totalKWh:number,totalKW:number}}} CapacityTopology */

const state = {
  step: 1,
  basics: /** @type {SiteBasics} */ ({ name: '', type: 'PV' }),
  location: /** @type {SiteLocation} */ ({ lat: 0, lng: 0, timezone: 'UTC' }),
  capacity: /** @type {CapacityTopology} */ ({ inverterCount: 0, hasBESS: false, topologyPreset: 'PV_INV_BUS_TX_GRID' }),
  discovered: /** @type {any[]} */ ([]),
  breakers: /** @type {any[]} */ ([]),
  policies: {},
  summary: {},
};

function qs(id){ return document.getElementById(id); }
function setThemeBtn(){
  const btn = qs('themeToggle'); if(!btn) return;
  const apply = (m)=>{ document.documentElement.classList.toggle('dark', m==='dark'); localStorage.setItem('theme', m); };
  apply(localStorage.getItem('theme')||'light');
  btn.addEventListener('click', ()=>{ apply(document.documentElement.classList.contains('dark')?'light':'dark'); });
}

function renderSteps(){
  const steps = [
    'Basics','Location','Capacity','Discovery','Automation','Grid & Tariff','Summary'
  ];
  const wrap = qs('wizardSteps');
  wrap.innerHTML = '';
  steps.forEach((label, idx)=>{
    const n = idx+1; const active = n===state.step;
    const el = document.createElement('button');
    el.className = `px-2 py-1 rounded-md text-xs ${active?'bg-gray-100 dark:bg-gray-800':''}`;
    el.textContent = `${n}. ${label}`;
    el.addEventListener('click', ()=>{ goStep(n); });
    wrap.appendChild(el);
  });
}

function goStep(n){
  if(n<1||n>7) return; state.step = n;
  for(let i=1;i<=7;i++){ const s=qs(`step-${i}`); if(s){ s.classList.toggle('hidden', i!==n); } }
  qs('btnBack').classList.toggle('hidden', n===1);
  qs('btnNext').classList.toggle('hidden', n===7);
  qs('btnCreate').classList.toggle('hidden', n!==7);
  renderSteps();
}

function validateBasics(){
  const name = /** @type {HTMLInputElement} */(qs('siteName')).value.trim();
  const email = /** @type {HTMLInputElement} */(qs('contactEmail')).value.trim();
  const phone = /** @type {HTMLInputElement} */(qs('contactPhone')).value.trim();
  const emailOk = !email || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const phoneOk = !phone || /^\+?[0-9\-\s]{7,15}$/.test(phone);
  qs('emailErr').classList.toggle('hidden', emailOk);
  qs('phoneErr').classList.toggle('hidden', phoneOk);
  const unique = name && name.toLowerCase()!=='existing site';
  qs('siteNameErr').classList.toggle('hidden', unique);
  if(unique && emailOk && phoneOk){
    state.basics.name = name;
    state.basics.code = /** @type {HTMLInputElement} */(qs('siteCode')).value.trim();
    state.basics.type = /** @type {HTMLSelectElement} */(qs('siteType')).value;
    state.basics.operator = /** @type {HTMLInputElement} */(qs('operator')).value.trim();
    state.basics.contact = {
      name: /** @type {HTMLInputElement} */(qs('contactName')).value.trim(),
      email, phone
    };
    return true;
  }
  return false;
}

function validateLocation(){
  const lat = parseFloat(/** @type {HTMLInputElement} */(qs('lat')).value);
  const lng = parseFloat(/** @type {HTMLInputElement} */(qs('lng')).value);
  if(Number.isFinite(lat) && Number.isFinite(lng) && lat>=-90 && lat<=90 && lng>=-180 && lng<=180){
    state.location.lat = lat; state.location.lng = lng;
    state.location.country = /** @type {HTMLInputElement} */(qs('country')).value.trim();
    state.location.city = /** @type {HTMLInputElement} */(qs('city')).value.trim();
    state.location.address = /** @type {HTMLInputElement} */(qs('address')).value.trim();
    state.location.timezone = /** @type {HTMLInputElement} */(qs('timezone')).value.trim() || 'UTC';
    return true;
  }
  return false;
}

function validateCapacity(){
  const hasBESS = /** @type {HTMLSelectElement} */(qs('hasBESS')).value==='yes';
  state.capacity.dcMWp = parseFloat(/** @type {HTMLInputElement} */(qs('dcMWp')).value) || 0;
  state.capacity.acMVA = parseFloat(/** @type {HTMLInputElement} */(qs('acMVA')).value) || 0;
  state.capacity.topologyPreset = /** @type {HTMLSelectElement} */(qs('topology')).value;
  state.capacity.inverterCount = parseInt(/** @type {HTMLInputElement} */(qs('inverterCount')).value||'0');
  state.capacity.hasBESS = hasBESS;
  if(hasBESS){
    state.capacity.bess = {
      totalKWh: parseFloat(/** @type {HTMLInputElement} */(qs('bessKWh')).value)||0,
      totalKW: parseFloat(/** @type {HTMLInputElement} */(qs('bessKW')).value)||0,
    };
  }
  return state.capacity.inverterCount>0;
}

// Mock discovery
function discoverDevices(cidr, protocol){
  const sample = [
    { id:'inv-1', type:'inverter', vendor:'Generic', model:'SunSpec-103', endpoint:{ ip:'192.168.1.10', port:502, protocol }, status:'online', sample:{ power: Math.round(Math.random()*1000) } },
    { id:'bms-1', type:'bms', vendor:'Generic', model:'MQTT', endpoint:{ ip:'192.168.1.20', port:1883, protocol:'MQTT' }, status:'online', sample:{ soc: 75 } },
  ];
  return sample;
}

function renderDiscovery(rows){
  const tbody = qs('discoverTBody'); tbody.innerHTML='';
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    tr.className='border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/5';
    const ep = r.endpoint.slaveId?`${r.endpoint.ip}/${r.endpoint.slaveId}`:`${r.endpoint.ip}:${r.endpoint.port||''}`;
    const status = r.status==='online'?'<span class="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">Online</span>':'<span class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">Offline</span>';
    const sample = r.sample?Object.entries(r.sample).map(([k,v])=>`${k}:${v}`).join(', '):'-';
    tr.innerHTML = `<td class="px-3 py-2">${r.id}</td>
      <td class="px-3 py-2">${r.type}</td>
      <td class="px-3 py-2">${r.vendor||''} ${r.model||''}</td>
      <td class="px-3 py-2">${ep}</td>
      <td class="px-3 py-2">${r.endpoint.protocol}</td>
      <td class="px-3 py-2">${status}</td>
      <td class="px-3 py-2">${sample}</td>
      <td class="px-3 py-2"><button class="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700">Parameters</button></td>`;
    tbody.appendChild(tr);
  });
}

function canProceedDiscovery(){
  // Require at least one inverter when inverterCount>0
  const invOk = state.capacity.inverterCount>0 ? state.discovered.some(d=>d.type==='inverter' && d.status==='online') : true;
  const bessOk = state.capacity.hasBESS ? state.discovered.some(d=>d.type==='bms' && d.status==='online') : true;
  qs('discoverErr').classList.toggle('hidden', invOk && bessOk);
  return invOk && bessOk;
}

function renderBreakers(){
  const wrap = qs('breakerList'); wrap.innerHTML='';
  for(let i=1;i<=3;i++){
    const card = document.createElement('div');
    card.className='border border-gray-200 dark:border-gray-800 rounded-xl p-4';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="font-semibold">TMŞ-${i}</div>
        <span class="text-xs text-gray-500">Bus A</span>
      </div>
      <div class="grid grid-cols-2 gap-3 mt-3 text-sm">
        <label>Open Coil<input class="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1"></label>
        <label>Close Coil<input class="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1"></label>
        <label>Pulse (ms)<input class="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1" value="200"></label>
        <label>Dual Confirm<select class="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1"><option>No</option><option>Yes</option></select></label>
      </div>`;
    wrap.appendChild(card);
  }
}

function computeSummary(){
  const sum = {
    name: state.basics.name,
    devices: state.discovered.length,
    breakers: 3,
  };
  qs('summary').textContent = JSON.stringify(sum, null, 2);
}

function saveDraft(){ localStorage.setItem('wizardDraft', JSON.stringify(state)); }
function loadDraft(){ try{ const raw=localStorage.getItem('wizardDraft'); if(raw){ Object.assign(state, JSON.parse(raw)); } }catch(e){}
}

async function provisionSite(){
  qs('btnCreate').disabled = true; qs('btnCreate').textContent = 'Creating...';
  await new Promise(r=>setTimeout(r, 2000));
  // persist to localStorage
  try {
    const raw = localStorage.getItem('emsSites');
    const sites = raw ? JSON.parse(raw) : [];
    const id = (state.basics.code || state.basics.name || 'site')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const newSite = {
      id,
      name: state.basics.name,
      lat: Number(state.location.lat) || 39.9,
      lng: Number(state.location.lng) || 32.85,
      status: 'online',
      capacity: Number(state.capacity.acMVA || state.capacity.dcMWp || 0),
      soc: state.capacity.hasBESS && state.capacity.bess ? 65 : null,
    };
    sites.push(newSite);
    localStorage.setItem('emsSites', JSON.stringify(sites));
  } catch (e) {
    console.error('Failed to persist site', e);
  }
  // redirect to dashboard
  window.location.href = '/ui';
}

document.addEventListener('DOMContentLoaded', () => {
  setThemeBtn();
  loadDraft();
  renderSteps();
  goStep(state.step);

  qs('btnBack').addEventListener('click', ()=>{ if(state.step>1) goStep(state.step-1); });
  qs('btnNext').addEventListener('click', ()=>{
    let ok=true;
    if(state.step===1) ok=validateBasics();
    else if(state.step===2) ok=validateLocation();
    else if(state.step===3) ok=validateCapacity();
    else if(state.step===4) ok=canProceedDiscovery();
    if(ok) goStep(state.step+1);
  });
  qs('btnCreate').addEventListener('click', provisionSite);
  qs('btnSaveDraft').addEventListener('click', saveDraft);

  const discBtn = qs('btnDiscover'); if(discBtn){
    discBtn.addEventListener('click', ()=>{
      const rows = discoverDevices(/** @type {HTMLInputElement} */(qs('cidr')).value, /** @type {HTMLSelectElement} */(qs('protocol')).value);
      state.discovered = rows; renderDiscovery(rows); canProceedDiscovery(); saveDraft();
    });
  }

  renderBreakers();
  computeSummary();

  // Leaflet map init
  const mapEl = document.getElementById('wizardMap');
  if (mapEl && typeof L !== 'undefined') {
    const lat = state.location.lat || 39.9; const lng = state.location.lng || 32.85;
    const map = L.map('wizardMap').setView([lat, lng], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    let marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    const syncInputs = (lt, lg) => { const la = document.getElementById('lat'); const lo = document.getElementById('lng'); if (la) la.value = lt.toFixed(6); if (lo) lo.value = lg.toFixed(6); };
    syncInputs(lat, lng);
    map.on('click', (e) => { if (marker) marker.remove(); marker = L.marker(e.latlng, { draggable: true }).addTo(map); syncInputs(e.latlng.lat, e.latlng.lng); });
    if (marker) marker.on('dragend', (e) => { const p = e.target.getLatLng(); syncInputs(p.lat, p.lng); });
  }
});



// Add Device unified wizard (UI-only scaffold). Works with modal in index.html

const ADD_STEPS = ['Basics','Connection','Profile','Discovery','Telemetry','Control','Alarms','Commissioning','Review'];
let addDeviceState = { type: null, step: 0, siteCtx: null, data: {} };

export function openAddDevice(type, siteCtx){
  addDeviceState = { type, step: 0, siteCtx: siteCtx||null, data: {} };
  const title = document.getElementById('addDeviceTitle');
  if (title) title.textContent = `${type||'Device'} — Add`;
  const modal = document.getElementById('addDeviceModal');
  if (modal) modal.classList.remove('hidden');
  renderAddSteps();
  renderAddBody();
}

function renderAddSteps(){
  const wrap = document.getElementById('addSteps'); if(!wrap) return; wrap.innerHTML='';
  ADD_STEPS.forEach((label, idx)=>{
    const b = document.createElement('button');
    b.className = `px-2 py-1 rounded-md text-xs ${idx===addDeviceState.step?'bg-gray-100 dark:bg-gray-800':''}`;
    b.textContent = `${idx+1}. ${label}`;
    b.onclick = ()=>{ addDeviceState.step=idx; renderAddSteps(); renderAddBody(); };
    wrap.appendChild(b);
  });
  document.getElementById('addBack').classList.toggle('hidden', addDeviceState.step===0);
  document.getElementById('addNext').classList.toggle('hidden', addDeviceState.step===ADD_STEPS.length-1);
  document.getElementById('addSave').classList.toggle('hidden', addDeviceState.step!==ADD_STEPS.length-1);
}

function input(label,id,ph=''){return `<label class="text-sm block">${label}<input id="${id}" placeholder="${ph}" class="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 mt-1"/></label>`}
function select(label,id,opts){return `<label class="text-sm block">${label}<select id="${id}" class="w-full bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 mt-1">${opts.map(o=>`<option>${o}</option>`).join('')}</select></label>`}

function renderAddBody(){
  const body = document.getElementById('addStepBody'); if(!body) return;
  const step = ADD_STEPS[addDeviceState.step]; const t = addDeviceState.type;
  body.innerHTML = '';
  if(step==='Basics'){
    const deviceTypes = ['inverter', 'meter', 'weather', 'tracker', 'bms', 'power_analyzer', 'generic_modbus'];
    body.innerHTML = select('Device Type','deviceType', deviceTypes) + 
                     input('Cihaz Adı/ID','devName','device-01') + 
                     input('Vendor','vendor','Generic') + 
                     input('Model','model','Model-X');
  } else if(step==='Connection'){
    body.innerHTML = select('Protokol','proto',['modbus_tcp','modbus_rtu','mqtt','serial','can']) + 
                     input('IP/Host','host','10.0.0.10') + 
                     input('Port','port','502') + 
                     input('Unit ID','unitId','1');
  } else if(step==='Profile'){
    // Get profiles from profiles.js if available
    let profileOptions = ['Generic Profile'];
    if (typeof driverProfiles !== 'undefined' && driverProfiles.length > 0) {
      profileOptions = driverProfiles.map(p => p.name);
    }
    body.innerHTML = select('Profil','profile', profileOptions) + 
                     '<div id="profilePreview" class="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs" style="max-height:200px; overflow-y:auto;">Profil seçin...</div>';
    
    // Add profile selection handler
    const profileSelect = document.getElementById('profile');
    if (profileSelect && typeof driverProfiles !== 'undefined') {
      profileSelect.addEventListener('change', function() {
        const selectedProfile = driverProfiles.find(p => p.name === this.value);
        const preview = document.getElementById('profilePreview');
        if (selectedProfile && preview) {
          preview.innerHTML = `
            <strong>${selectedProfile.name}</strong><br>
            <em>${selectedProfile.description}</em><br>
            Point Map: ${selectedProfile.pointMapFile}<br>
            Poll Interval: ${selectedProfile.pollInterval}s<br>
            <div class="mt-1 text-xs">
              ${selectedProfile.pointMapPreview?.slice(0, 5).join('<br>') || 'No preview available'}
            </div>
          `;
        }
      });
    }
  } else if(step==='Discovery'){
    body.innerHTML = input('CIDR','cidr','192.168.1.0/24')+`<button id="btnRunDiscovery" class="mt-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700">Discover</button><div id="discResult" class="mt-2 text-sm text-gray-500">-</div>`;
    const btn = document.getElementById('btnRunDiscovery'); if(btn){ btn.onclick=()=>{ const r=document.getElementById('discResult'); if(r) r.textContent='1 cihaz bulundu (mock).'; }; }
  } else if(step==='Telemetry'){
    body.innerHTML = '<div class="grid grid-cols-2 md:grid-cols-3 gap-3"><div class="rounded-lg border border-gray-200 dark:border-gray-800 p-3">V1/V2/V3</div><div class="rounded-lg border border-gray-200 dark:border-gray-800 p-3">A1/A2/A3</div><div class="rounded-lg border border-gray-200 dark:border-gray-800 p-3">P/Q/S</div></div>';
  } else if(step==='Control'){
    body.innerHTML = input('P-limit (%)','plimit','90') + input('cosφ/VAR','var','0.99');
  } else if(step==='Alarms'){
    body.innerHTML = input('Overvoltage (V)','ov','430') + input('Overtemp (°C)','ot','80');
  } else if(step==='Commissioning'){
    body.innerHTML = '<ul class="list-disc pl-6 text-sm text-gray-600 dark:text-gray-400"><li>Bağlantı OK</li><li>Örnek okuma OK</li><li>Kontrol dry-run OK</li></ul>';
  } else if(step==='Review'){
    body.innerHTML = '<div class="text-sm text-gray-500">Özet görünümü (mock). Kaydet ile Draft/Active oluşturulacak.</div>';
  }
}

export function bindAddDevice(){
  const close = document.getElementById('addDeviceClose'); if(close) close.onclick=()=>document.getElementById('addDeviceModal').classList.add('hidden');
  document.getElementById('addBack').onclick = ()=>{ if(addDeviceState.step>0){ addDeviceState.step--; renderAddSteps(); renderAddBody(); } };
  document.getElementById('addNext').onclick = ()=>{ if(addDeviceState.step<ADD_STEPS.length-1){ addDeviceState.step++; renderAddSteps(); renderAddBody(); } };
  document.getElementById('addSave').onclick = ()=>{ document.getElementById('addDeviceModal').classList.add('hidden'); };
}




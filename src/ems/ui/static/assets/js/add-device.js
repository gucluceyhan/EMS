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
    body.innerHTML = input('Cihaz Adı/ID','devName','INV-1') + input('Vendor','vendor','Generic') + input('Model','model','SunSpec-103');
  } else if(step==='Connection'){
    body.innerHTML = select('Protokol','proto',['SunSpec','Modbus TCP','Modbus RTU','Vendor API']) + input('IP/Host','host','10.0.0.10') + input('Port/Slave','port','502/1');
  } else if(step==='Profile'){
    body.innerHTML = select('Profil','profile',['Generic SunSpec-103 v1.2','IEC 62053 v1.0']);
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




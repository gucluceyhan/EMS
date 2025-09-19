// TMŞ Automation mocks & UI glue
const AutoState = {
  role: 'Operator',
  dryRun: true,
  selected: null,
};

function q(id){ return document.getElementById(id); }

function setThemeBtn(){
  const btn = q('themeToggle'); if(!btn) return;
  const apply = (m)=>{ document.documentElement.classList.toggle('dark', m==='dark'); localStorage.setItem('theme', m); };
  apply(localStorage.getItem('theme')||'light');
  btn.addEventListener('click', ()=>{ apply(document.documentElement.classList.contains('dark')?'light':'dark'); });
}

function getBreakers(){
  return [
    { id:'b1', name:'TMŞ-1', bus:'A', state: Math.random()>0.5?'closed':'open', last:'now' },
    { id:'b2', name:'TMŞ-2', bus:'A', state: Math.random()>0.5?'closed':'open', last:'2m ago' },
    { id:'b3', name:'TMŞ-3', bus:'B', state: 'tripped', last:'5m ago' },
  ];
}

function renderBreakerCard(b){
  const badge = b.state==='closed'?'bg-green-100 text-green-700': b.state==='open'?'bg-gray-100 text-gray-700':'bg-red-100 text-red-700';
  const el = document.createElement('div');
  el.className='border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-950';
  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="font-semibold">${b.name}</div>
      <span class="px-2 py-0.5 rounded-full text-xs ${badge}">${b.state}</span>
    </div>
    <div class="text-xs text-gray-500">Bus ${b.bus} • Last ${b.last}</div>
    <div class="mt-3 flex items-center gap-2">
      <button class="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700" data-action="open">Open</button>
      <button class="px-3 py-1.5 rounded-md bg-red-600 text-white" data-action="close">Close</button>
    </div>
  `;
  el.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>confirmAndSend(b, btn.getAttribute('data-action'))));
  el.addEventListener('click',()=>selectBreaker(b));
  return el;
}

function renderBreakers(){
  const grid = q('breakerGrid'); grid.innerHTML='';
  const list = getBreakers();
  list.forEach(b=> grid.appendChild(renderBreakerCard(b)) );
  if(!AutoState.selected && list.length) selectBreaker(list[0]);
}

function busbarBars(){
  const wrap = q('busbarBars'); wrap.innerHTML='';
  for(let i=0;i<6;i++){
    const v = Math.round(Math.random()*100);
    const bar = document.createElement('div');
    bar.className='w-8 bg-blue-500/70 dark:bg-blue-400/70';
    bar.style.height = `${v*1.2}px`;
    bar.title = `${v}%`;
    wrap.appendChild(bar);
  }
}

function selectBreaker(b){
  AutoState.selected = b;
  renderMeasures();
}

function readMeasurements(){
  return {
    v1: 231+Math.random()*5, v2: 230+Math.random()*5, v3: 232+Math.random()*5,
    a1: 100+Math.random()*10, a2: 98+Math.random()*10, a3: 102+Math.random()*10,
    p: 150, q: 12, s: 151, pf1: 0.98, pf2: 0.97, pf3: 0.99, pfAvg: 0.98, f: 50.0, kwhIn: 12345, kwhOut: 4567
  };
}

function renderMeasures(){
  const grid = q('measureGrid'); grid.innerHTML='';
  const m = readMeasurements();
  const kv = Object.entries(m);
  kv.forEach(([k,v])=>{
    const c = document.createElement('div');
    c.className='rounded-lg border border-gray-200 dark:border-gray-800 p-3';
    c.innerHTML = `<div class="text-xs text-gray-500">${k.toUpperCase()}</div><div class="text-lg font-semibold">${typeof v==='number'?v.toFixed(2):v}</div>`;
    grid.appendChild(c);
  });
  renderTrend();
}

const trend = [];
function renderTrend(){
  const svg = q('trendSvg'); if(!svg) return;
  if(trend.length>40) trend.shift();
  trend.push(80+Math.random()*40);
  const points = trend.map((v,i)=>`${(i/(40))*400},${100 - (v/120)*100}`).join(' ');
  svg.innerHTML = `<polyline fill="none" stroke="#1f6df2" stroke-width="2" points="${points}" />`;
}

function confirmAndSend(b, action){
  if(AutoState.dryRun){ alert(`[Dry-run] ${action} request sent for ${b.name}`); return; }
  const modal = q('confirmModal');
  modal.classList.remove('hidden');
  q('btnCancelConfirm').onclick = ()=> modal.classList.add('hidden');
  q('btnOkConfirm').onclick = ()=>{
    modal.classList.add('hidden');
    setTimeout(()=> alert(`${action} executed on ${b.name}`), 500);
  };
}

document.addEventListener('DOMContentLoaded', ()=>{
  setThemeBtn();
  q('dryRunToggle').addEventListener('change', (e)=>{ AutoState.dryRun = e.target.checked; });
  renderBreakers(); busbarBars(); renderMeasures();
  setInterval(()=>{ if(AutoState.selected){ renderMeasures(); busbarBars(); } }, 2000);
});



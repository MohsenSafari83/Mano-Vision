'use strict';
/* =========================================================================
   MODULES TAB
   ========================================================================= */
const MODULES = [
  {key:'AR', name:'AR', full:'Address Register', bits:12, type:'register', ops:['LD','INR','CLR'],
    desc:"Holds the memory address currently being accessed. Loaded from PC during fetch, or from IR's address bits during decode; incremented for indirect addressing and BSA."},
  {key:'PC', name:'PC', full:'Program Counter', bits:12, type:'register', ops:['LD','INR','CLR'],
    desc:'Holds the address of the NEXT instruction to fetch. Incremented after every fetch; loaded directly on branch instructions (BUN, BSA).'},
  {key:'DR', name:'DR', full:'Data Register', bits:16, type:'register', ops:['LD','INR','CLR'],
    desc:"Holds data read from memory, used as an ALU operand for AND/ADD, or for ISZ's increment-and-store-back."},
  {key:'AC', name:'AC', full:'Accumulator', bits:16, type:'register', ops:['LD','INR','CLR'],
    desc:'The main register for arithmetic & logic results. Every AND / ADD / LDA / CMA / CIR / CIL / INC operation reads or writes AC.'},
  {key:'IR', name:'IR', full:'Instruction Register', bits:16, type:'register', ops:['LD'],
    desc:'Holds the instruction currently being decoded and executed. Bit 15 selects direct/indirect addressing, bits 14-12 select the opcode, bits 11-0 hold the address.'},
  {key:'TR', name:'TR', full:'Temporary Register', bits:16, type:'register', ops:['LD','INR','CLR'],
    desc:'A scratch register used to hold PC temporarily during the BSA (Branch and Save Address) instruction.'},
  {key:'IO', name:'I/O', full:'Input / Output Registers', bits:8, type:'io',
    desc:'INPR holds a byte brought in from an input device (copied into AC by INP). OUTR holds a byte sent to an output device (copied from AC by OUT). FGI/FGO flag when a device is ready.'},
  {key:'SC', name:'SC', full:'Sequence Counter', bits:3, type:'sc',
    desc:'A timing counter that steps through T0, T1, T2 … for each instruction, driving the control unit\'s timing signals. It resets to T0 at the start of every new instruction.'},
  {key:'MEM', name:'MEM', full:'Main Memory', bits:16, type:'mem',
    desc:'4096 words of 16 bits each. Addressed by AR; read into DR/IR, or written from AC/PC/DR depending on the instruction.'},
  {key:'BUS', name:'BUS', full:'Common Bus', bits:16, type:'bus',
    desc:'A single shared 16-bit bus connects every register and memory. A 3-bit select (S2 S1 S0) chooses exactly one source to drive the bus at a time — avoiding a dedicated wire between every pair of registers.'}
];

const modState = { AR:0, PC:0, DR:0, AC:0, IR:0, TR:0, INPR:0, OUTR:0, FGI:1, FGO:1, SC_T:0, MEM_ADDR:0, MEM:new Array(16).fill(0), BUS_SEL:'AR', BUS_ACTIVE:false };
let currentModule = null;

function renderModuleGrid(){
  document.getElementById('modGrid').innerHTML = MODULES.map(m=>`
    <div class="mod-card" data-mod="${m.key}">
      <div class="top"><span class="name">${m.name}</span><span class="bits">${m.bits}-bit</span></div>
      <div class="full">${m.full}</div>
      <div class="desc">${m.desc.slice(0,74)}${m.desc.length>74?'…':''}</div>
    </div>`).join('');
  document.querySelectorAll('.mod-card').forEach(c=>{
    c.addEventListener('click', ()=>openModuleDetail(c.getAttribute('data-mod')));
  });
}

function bitsOf(val, width){ const out=[]; for(let i=width-1;i>=0;i--) out.push((val>>i)&1); return out; }
function renderBitCells(val, width){
  document.getElementById('modBitCells').innerHTML = bitsOf(val,width).map(b=>`<div class="bit-cell ${b?'one':''}">${b}</div>`).join('');
}

function openModuleDetail(key){
  const def = MODULES.find(m=>m.key===key);
  currentModule = def;
  document.getElementById('modulesList').style.display='none';
  document.getElementById('modDetailView').classList.add('open');
  document.getElementById('modTitle').textContent = def.name+' — '+def.full;
  document.getElementById('modDesc').textContent = def.desc;
  buildModuleDiagram(def);
  buildModuleControls(def);
  renderModuleState(def);
}
document.getElementById('modBackBtn').addEventListener('click', ()=>{
  document.getElementById('modulesList').style.display='';
  document.getElementById('modDetailView').classList.remove('open');
});

/* ----------------------------------------------------------------------
   HTML/CSS interactive module system.
   Wires, signals, arrows and chips are plain DOM elements. JavaScript
   only mirrors STATE — it toggles the `.active` class. CSS owns every
   color, glow, thickness and animation, keyed by the per-signal
   --sig-color custom property. Idle wires are always neutral gray;
   they are colored ONLY while the matching control signal is active.
   ---------------------------------------------------------------------- */
function setText(id, t){ const e=document.getElementById(id); if(e) e.textContent=t; }

function setModuleSig(sig, on){
  const d=document.getElementById('modDiagram');
  if(!d) return;
  d.querySelectorAll('.hw-lane[data-sig="'+sig+'"]').forEach(l=>l.classList.toggle('active', !!on));
  d.querySelectorAll('.hw-chip[data-sig="'+sig+'"]').forEach(c=>c.classList.toggle('active', !!on));
  if(sig==='BUS-TRUNK'){ const t=d.querySelector('.hw-trunk'); if(t) t.classList.toggle('active', !!on); }
}

const modSigTimers = {};
function pulseSig(sig, ms){
  setModuleSig(sig, true);
  clearTimeout(modSigTimers[sig]);
  modSigTimers[sig] = setTimeout(()=>{ setModuleSig(sig, false); }, ms||700);
}

function hwLane(sig, label, rev){
  return `<div class="hw-lane" data-sig="${sig}">
    <span class="hw-sig">${label}</span>
    <span class="hw-wire"><span class="hw-flow${rev?' rev':''}"></span></span>
    <span class="hw-arrow${rev?' left':''}"></span>
  </div>`;
}

function buildModuleDiagram(def){
  const d=document.getElementById('modDiagram');
  if(def.type==='register'){
    d.innerHTML = `<div class="hw-mod">
      <div class="hw-side">${def.ops.map(op=>hwLane(op, op)).join('')}</div>
      <div class="hw-chip" data-sig="REG"><span class="hw-name">${def.name}</span><span class="hw-val mono" id="modValText">0x000</span></div>
      <div class="hw-side">${hwLane('BUS','BUS')}</div>
    </div>`;
  } else if(def.type==='io'){
    d.innerHTML = `<div class="hw-mod hw-io">
      <div class="hw-chip" data-sig="INPR"><span class="hw-name">INPR</span><span class="hw-val mono" id="modInprVal">0x00</span><span class="hw-flag" id="modFgiFlag"><i class="hw-led"></i>FGI</span></div>
      ${hwLane('INP','INP')}
      <div class="hw-chip" data-sig="AC"><span class="hw-name">AC</span><span class="hw-val mono" id="modAcVal">0x0000</span></div>
      ${hwLane('OUT','OUT')}
      <div class="hw-chip" data-sig="OUTR"><span class="hw-name">OUTR</span><span class="hw-val mono" id="modOutrVal">0x00</span><span class="hw-flag" id="modFgoFlag"><i class="hw-led"></i>FGO</span></div>
    </div>`;
  } else if(def.type==='sc'){
    let dots='';
    for(let i=0;i<7;i++) dots += `<div class="hw-tdot" data-t="${i}"><span class="hw-dot"></span><span class="hw-tname mono">T${i}</span></div>`;
    d.innerHTML = `<div class="hw-mod hw-sc">
      <div class="hw-sc-head mono"><span>SEQUENCE COUNTER</span><span class="hw-sc-cur" id="modScTxt">T0</span></div>
      <div class="hw-sc-row">${dots}</div>
      <div class="hw-sc-note">One clock pulse advances SC to the next timing state — only the current T is active. At the end of an instruction SC resets to T0.</div>
    </div>`;
  } else if(def.type==='mem'){
    d.innerHTML = `<div class="hw-mod">
      <div class="hw-side">${hwLane('AR','AR · address')}</div>
      <div class="hw-chip" data-sig="MEM"><span class="hw-name">MEMORY</span><span class="hw-sub mono">4096 × 16-bit</span><span class="hw-val mono" id="modMemReadout">[000] = 0000</span></div>
      <div class="hw-side">
        ${hwLane('READ','READ → DR / IR')}
        ${hwLane('WRITE','WRITE AC / DR', true)}
      </div>
    </div>`;
  } else if(def.type==='bus'){
    const srcs=['AR','PC','DR','AC','IR','TR','MEM'];
    d.innerHTML = `<div class="hw-mod">
      <div class="hw-bus-lanes">${srcs.map(l=>hwLane('BUS-SRC-'+l, l==='MEM'?'MEM':l)).join('')}</div>
      <div class="hw-trunk">
        <span class="hw-flow"></span>
        <span class="hw-trunk-name mono">COMMON BUS</span>
        <span class="hw-trunk-sub mono">16-bit</span>
        <span class="hw-trunk-sel mono" id="modBusSel">no source driving the bus</span>
      </div>
    </div>`;
  }
}

function renderModuleState(def){
  if(!def) return;
  const d=document.getElementById('modDiagram');
  if(def.type==='register'){
    const val=modState[def.key];
    setText('modValText','0x'+val.toString(16).toUpperCase().padStart(def.bits<=12?3:4,'0'));
    renderBitCells(val, def.bits);
  } else if(def.type==='io'){
    setText('modInprVal','0x'+modState.INPR.toString(16).toUpperCase().padStart(2,'0'));
    setText('modAcVal','0x'+modState.AC.toString(16).toUpperCase().padStart(4,'0'));
    setText('modOutrVal','0x'+modState.OUTR.toString(16).toUpperCase().padStart(2,'0'));
    const fg=document.getElementById('modFgiFlag'); if(fg) fg.classList.toggle('on', !!modState.FGI);
    const fo=document.getElementById('modFgoFlag'); if(fo) fo.classList.toggle('on', !!modState.FGO);
    renderBitCells(modState.INPR, 8);
  } else if(def.type==='sc'){
    d.querySelectorAll('.hw-tdot').forEach(t=>t.classList.toggle('active', +t.getAttribute('data-t')===modState.SC_T));
    setText('modScTxt','T'+modState.SC_T);
    document.getElementById('modBitCells').innerHTML='';
  } else if(def.type==='mem'){
    const addr=modState.MEM_ADDR, val=modState.MEM[addr%16];
    setText('modMemReadout','['+addr.toString(16).toUpperCase().padStart(3,'0')+'] = '+val.toString(16).toUpperCase().padStart(4,'0'));
    renderBitCells(val, 16);
  } else if(def.type==='bus'){
    const labels=['AR','PC','DR','AC','IR','TR','MEM'];
    labels.forEach(l=>setModuleSig('BUS-SRC-'+l, modState.BUS_ACTIVE && l===modState.BUS_SEL));
    setModuleSig('BUS-TRUNK', modState.BUS_ACTIVE);
    const idx=labels.indexOf(modState.BUS_SEL);
    setText('modBusSel', modState.BUS_ACTIVE
      ? 'S2 S1 S0 = '+idx.toString(2).padStart(3,'0').split('').join(' ')+'  →  '+labels[idx]+' drives the bus'
      : 'no source driving the bus');
    document.getElementById('modBitCells').innerHTML='';
  }
}

/* Map REAL CPU control signals -> this module's wire states. Called from
   renderAll after every genuine micro-step, so the modules tab shows the
   ACTUAL path the CPU took — activation always derives from CPU events. */
const MOD_LD  = {PC:'LD_PC', AR:'LD_AR', IR:'LD_IR', DR:'LD_DR', AC:'LD_AC', TR:'LD_TR'};
const MOD_INR = {PC:'INCR_PC', AR:'INCR_AR', DR:'INCR_DR'};
const MOD_CLR = {AC:'CLR_AC'};
const BUS_SRC_MAP = {'PC':'PC','AR':'AR','DR':'DR','AC':'AC','IR':'IR','TR':'TR','IR[0-11]':'IR','M[AR]':'MEM','DR+1':'DR','AC/E/PC':'AC','AC/IO':'AC'};

function syncModuleWithCPU(def){
  if(!def) return;
  const run = state.S!==0 && state.cycleCount>0;
  const s=signals, b=busInfo, k=def.key;
  if(def.type==='register'){
    if(run) modState[k]=state[k]||0;
    const ld = !!s[MOD_LD[k]] || (b.active && b.dst===k);
    const any = ld || !!s[MOD_INR[k]] || !!s[MOD_CLR[k]] || (b.active && (b.src===k||b.dst===k));
    setModuleSig('LD', run&&ld);
    setModuleSig('INR', run&&!!s[MOD_INR[k]]);
    setModuleSig('CLR', run&&!!s[MOD_CLR[k]]);
    setModuleSig('BUS', run&&b.active&&(b.src===k||b.dst===k));
    setModuleSig('REG', run&&any);
  } else if(def.type==='io'){
    if(run){ modState.INPR=state.INPR; modState.AC=state.AC; modState.OUTR=state.OUTR; modState.FGI=state.FGI; modState.FGO=state.FGO; }
    setModuleSig('INP', run&&!!s.INP);
    setModuleSig('OUT', run&&!!s.OUT);
    setModuleSig('INPR', run&&!!s.INP);
    setModuleSig('AC', run&&(!!s.INP||!!s.OUT));
    setModuleSig('OUTR', run&&!!s.OUT);
  } else if(def.type==='sc'){
    if(run) modState.SC_T = state.T;
  } else if(def.type==='mem'){
    if(run){ modState.MEM[state.AR%16]=mem[state.AR]; modState.MEM_ADDR=state.AR; }
    const memOp = s.READ||s.WRITE;
    setModuleSig('AR', run&&(!!s.LD_AR||!!memOp));
    setModuleSig('READ', run&&!!s.READ);
    setModuleSig('WRITE', run&&!!s.WRITE);
    setModuleSig('MEM', run&&!!memOp);
  } else if(def.type==='bus'){
    if(run){
      modState.BUS_ACTIVE = b.active;
      if(b.active){ const m=BUS_SRC_MAP[b.src]; if(m) modState.BUS_SEL=m; }
    }
  }
}

function buildModuleControls(def){
  const box=document.getElementById('modControls');
  if(def.type==='register'){
    box.innerHTML = `
      <div class="hint" style="margin-bottom:10px;">Test this register in isolation. Watch the matching control wire light up and data travel between BUS and the register.</div>
      <input type="text" id="modLoadVal" class="mono" placeholder="Value (hex or decimal)" style="width:100%;margin-bottom:10px;">
      <div class="mod-ctrl-row">
        <button class="btn primary" id="modLoadBtn">LD — Load from BUS</button>
        ${def.ops.includes('INR')?'<button class="btn" id="modIncBtn">INR — Increment</button>':''}
        ${def.ops.includes('CLR')?'<button class="btn" id="modClrBtn">CLR — Clear</button>':''}
      </div>
      <div class="mod-ctrl-row"><button class="btn" id="modBusBtn">Drive BUS (register → BUS)</button></div>`;
    const mask = def.bits<=12 ? 0xFFF : 0xFFFF;
    document.getElementById('modLoadBtn').addEventListener('click', ()=>{
      const raw=document.getElementById('modLoadVal').value.trim();
      let v = /^0x/i.test(raw) ? parseInt(raw,16) : parseInt(raw,10);
      if(isNaN(v)) v=0;
      modState[def.key]=v&mask;
      pulseSig('LD'); pulseSig('BUS'); pulseSig('REG');
      renderModuleState(def);
    });
    if(def.ops.includes('INR')) document.getElementById('modIncBtn').addEventListener('click', ()=>{
      modState[def.key]=(modState[def.key]+1)&mask;
      pulseSig('INR'); pulseSig('REG');
      renderModuleState(def);
    });
    if(def.ops.includes('CLR')) document.getElementById('modClrBtn').addEventListener('click', ()=>{
      modState[def.key]=0;
      pulseSig('CLR'); pulseSig('REG');
      renderModuleState(def);
    });
    document.getElementById('modBusBtn').addEventListener('click', ()=>{
      pulseSig('BUS'); pulseSig('REG');
    });
  } else if(def.type==='io'){
    box.innerHTML = `
      <div class="hint" style="margin-bottom:10px;">A byte arrives at INPR from the input device, then INP moves it into AC. OUT moves AC's low byte into OUTR.</div>
      <input type="text" id="modInprInput" class="mono" placeholder="INPR value (0-255)" style="width:100%;margin-bottom:8px;">
      <div class="mod-ctrl-row"><button class="btn primary" id="modDevBtn">Send Byte → INPR</button></div>
      <div class="mod-ctrl-row"><button class="btn" id="modInpBtn">INP — INPR → AC</button></div>
      <div class="mod-ctrl-row"><button class="btn" id="modOutBtn">OUT — AC → OUTR</button></div>`;
    document.getElementById('modDevBtn').addEventListener('click', ()=>{
      let v=parseInt(document.getElementById('modInprInput').value,10); if(isNaN(v)) v=0;
      modState.INPR=v&0xFF; modState.FGI=0;
      pulseSig('INPR');
      renderModuleState(def);
      setTimeout(()=>{ modState.FGI=1; renderModuleState(def); }, 600);
    });
    document.getElementById('modInpBtn').addEventListener('click', ()=>{
      modState.AC=(modState.AC&0xFF00)|modState.INPR; modState.FGI=1;
      pulseSig('INP'); pulseSig('INPR'); pulseSig('AC');
      renderModuleState(def);
    });
    document.getElementById('modOutBtn').addEventListener('click', ()=>{
      modState.OUTR=modState.AC&0xFF; modState.FGO=0;
      pulseSig('OUT'); pulseSig('AC'); pulseSig('OUTR');
      renderModuleState(def);
      setTimeout(()=>{ modState.FGO=1; renderModuleState(def); }, 600);
    });
  } else if(def.type==='sc'){
    box.innerHTML = `
      <div class="hint" style="margin-bottom:10px;">Each clock pulse advances the sequence counter to the next timing state. Only the current T is active.</div>
      <div class="mod-ctrl-row"><button class="btn primary" id="modScStep">Step (T+1)</button><button class="btn" id="modScReset">Reset (SC ← 0)</button></div>`;
    document.getElementById('modScStep').addEventListener('click', ()=>{ modState.SC_T=(modState.SC_T+1)%7; renderModuleState(def); });
    document.getElementById('modScReset').addEventListener('click', ()=>{ modState.SC_T=0; renderModuleState(def); });
  } else if(def.type==='mem'){
    box.innerHTML = `
      <div class="hint" style="margin-bottom:10px;">This is a small 16-word demo window (real memory is 4096 words — see the Basic Computer tab).</div>
      <input type="text" id="modMemAddr" class="mono" placeholder="Address (0-15)" style="width:100%;margin-bottom:8px;">
      <input type="text" id="modMemVal" class="mono" placeholder="Value (hex)" style="width:100%;margin-bottom:8px;">
      <div class="mod-ctrl-row"><button class="btn primary" id="modMemWrite">Write</button><button class="btn" id="modMemRead">Read</button></div>`;
    document.getElementById('modMemWrite').addEventListener('click', ()=>{
      let a=parseInt(document.getElementById('modMemAddr').value,10)||0; a=((a%16)+16)%16;
      let v=parseInt(document.getElementById('modMemVal').value,16); if(isNaN(v)) v=0;
      modState.MEM[a]=v&0xFFFF; modState.MEM_ADDR=a;
      pulseSig('WRITE'); pulseSig('AR'); pulseSig('MEM');
      renderModuleState(def);
    });
    document.getElementById('modMemRead').addEventListener('click', ()=>{
      let a=parseInt(document.getElementById('modMemAddr').value,10)||0; a=((a%16)+16)%16;
      modState.MEM_ADDR=a;
      pulseSig('READ'); pulseSig('AR'); pulseSig('MEM');
      renderModuleState(def);
    });
  } else if(def.type==='bus'){
    box.innerHTML = `
      <div class="hint" style="margin-bottom:10px;">Only one source can drive the bus at a time — chosen by the 3-bit select S2 S1 S0. Drive the source to light its path; Release returns every wire to idle.</div>
      <select id="modBusSelect" style="margin-bottom:10px;">
        ${['AR','PC','DR','AC','IR','TR','MEM'].map(l=>`<option value="${l}">${l}${l==='MEM'?' (Memory)':''}</option>`).join('')}
      </select>
      <div class="mod-ctrl-row"><button class="btn primary" id="modBusDrive">Drive Bus</button><button class="btn" id="modBusRelease">Release</button></div>`;
    document.getElementById('modBusDrive').addEventListener('click', ()=>{
      modState.BUS_SEL = document.getElementById('modBusSelect').value;
      modState.BUS_ACTIVE = true;
      renderModuleState(def);
    });
    document.getElementById('modBusRelease').addEventListener('click', ()=>{
      modState.BUS_ACTIVE = false;
      renderModuleState(def);
    });
  }
}


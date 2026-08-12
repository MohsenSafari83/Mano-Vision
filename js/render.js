'use strict';
/* =========================================================================
   RENDERING
   ========================================================================= */
const D_NAMES = ['AND','ADD','LDA','STA','BUN','BSA','ISZ','RRI/IO'];
const FLAGS = ['E','IEN','FGI','FGO','S','I'];

function renderStatusReadout(){
  const running_ = state.S!==0;
  const z = state.AC===0, n = (state.AC & 0x8000)!==0;
  document.getElementById('statusReadout').innerHTML = `
    <span class="grp">PC <b>0x${hex(state.PC,3)}</b></span>
    <span class="grp">AR <b>0x${hex(state.AR,3)}</b></span>
    <span class="grp">IR <b>0x${hex(state.IR,4)}</b></span>
    <span class="grp">AC <b>0x${hex(state.AC,4)}</b></span>
    <span class="grp">DR <b>0x${hex(state.DR,4)}</b></span>
    <span class="grp">Flags:
      <span class="flag-chip ${z?'on':''}">Z</span>
      <span class="flag-chip ${n?'on':''}">N</span>
    </span>`;
  const label = state.halted ? 'Halted' : (running ? 'Running' : (state.cycleCount===0 ? 'Idle' : 'Paused'));
  const badge = document.getElementById('runBadge');
  badge.textContent = label;
  badge.classList.toggle('halted', state.halted);
}

function renderDiagram(){
  const running_ = state.S!==0;
  const color = currentCycleColor();
  REG_DEFS.forEach(def=>{
    const isActive = running_ && (regIsActive(def.k) || (busInfo.active && LABEL_TO_KEY[busInfo.src]===def.k));
    const node = document.querySelector('.node[data-key="'+def.k+'"]');
    const wire = document.getElementById('wire-'+def.k);
    node.classList.toggle('active', isActive);
    wire.classList.toggle('active', isActive);
    if(isActive){ node.style.setProperty('--sig-color', color); wire.style.stroke = color; }
    else { wire.style.stroke=''; }
  });
  const memActive = running_ && (signals.READ || signals.WRITE);
  const memNode = document.querySelector('.node[data-key="MEM"]');
  const memWire = document.getElementById('wire-MEM');
  memNode.classList.toggle('active', memActive);
  memWire.classList.toggle('active', memActive);
  if(memActive){ memNode.style.setProperty('--sig-color', color); memWire.style.stroke = color; }
  else { memWire.style.stroke=''; }

  const busTrunk = document.getElementById('busTrunk');
  busTrunk.classList.toggle('active', running_ && busInfo.active);
  busTrunk.style.stroke = (running_ && busInfo.active) ? color : '';

  document.getElementById('scNode').classList.toggle('active', running_ && busInfo.active);
  document.getElementById('scNode').style.setProperty('--sig-color', color);
  document.querySelector('#scNode .lbl').textContent = 'SC: T'+state.T;

  const aluOpName = ['AND','ADD','LDA','CMA','CME','CIR','CIL','INC'].find(op=>signals[op]);
  const aluNode = document.getElementById('aluNode');
  const aluActive = running_ && !!aluOpName;
  aluNode.classList.toggle('active', aluActive);
  aluNode.style.setProperty('--sig-color', SIG_COLOR.alu);
  document.getElementById('diaAluOp').textContent = aluOpName || '—';
  const aluWire=document.getElementById('wire-ALU'); aluWire.classList.toggle('active', aluActive); aluWire.style.stroke = aluActive ? SIG_COLOR.alu : '';

  const inprActive = running_ && !!signals.INP;
  const inprNode=document.getElementById('inprNode'); inprNode.classList.toggle('active', inprActive); inprNode.style.setProperty('--sig-color', SIG_COLOR.load);
  const inprWire=document.getElementById('wire-INPR'); inprWire.classList.toggle('active', inprActive); inprWire.style.stroke = inprActive ? SIG_COLOR.load : '';

  const outrActive = running_ && !!signals.OUT;
  const outrNode=document.getElementById('outrNode'); outrNode.classList.toggle('active', outrActive); outrNode.style.setProperty('--sig-color', SIG_COLOR.write);
  const outrWire=document.getElementById('wire-OUTR'); outrWire.classList.toggle('active', outrActive); outrWire.style.stroke = outrActive ? SIG_COLOR.write : '';

  const eNode=document.getElementById('eNode'); eNode.classList.toggle('active', state.E===1); eNode.style.setProperty('--sig-color', SIG_COLOR.alu);
  const iNode=document.getElementById('iNode'); iNode.classList.toggle('active', state.I===1); iNode.style.setProperty('--sig-color', SIG_COLOR.load);

  document.getElementById('diaText-Opcode').textContent = state.D;
  document.getElementById('diaText-Addr').textContent = '0x'+hex(state.AR,3);
  document.getElementById('diaText-Indirect').textContent = state.I ? 'Yes' : 'No';

  const srcKey = LABEL_TO_KEY[busInfo.src];
  const srcIdx = (running_ && busInfo.active && SRC_INDEX.hasOwnProperty(srcKey)) ? SRC_INDEX[srcKey] : null;
  document.getElementById('busSelTxt').textContent = srcIdx===null
    ? 'S2 S1 S0 = — — —'
    : 'S2 S1 S0 = ' + srcIdx.toString(2).padStart(3,'0').split('').join(' ') + '  (' + (srcKey==='MEM'?'Memory':srcKey) + ')';

  const busValTxt = document.getElementById('busValTxt');
  busValTxt.textContent = (running_ && busInfo.active) ? '0x'+hex(busInfo.val,4) : '—';
}

function renderFlags(){
  document.getElementById('flagRow').innerHTML = FLAGS.map(f=>{
    const on = state[f]===1 || (f==='S' && state.S===1);
    let label=f; if(f==='S') label='S (Run)';
    return `<div class="flag ${on?'on':''}"><span class="led"></span>${label}</div>`;
  }).join('') + `<div class="flag ${state.halted?'on':''}">HALT</div>`;
}

function renderDecoder(){
  const bitsEl=document.getElementById('decoderBits');
  let html='';
  for(let i=15;i>=0;i--){ const b=(state.IR>>i)&1; html+=`<div class="bit ${b?'one':''}">${b}</div>`; if(i===15||i===12) html+=`<div style="width:4px;"></div>`; }
  bitsEl.innerHTML = html;
  document.getElementById('decoderInfo').textContent = `IR = ${hex(state.IR,4)}   I=${state.I}   Opcode=${state.D}(${D_NAMES[state.D]})   Addr=${hex(state.IR&0xFFF,3)}`;
  document.getElementById('dLines').innerHTML = D_NAMES.map((name,i)=>{
    const active = state.D===i && state.T>=3 && state.S!==0;
    return `<div class="d-line ${active?'active':''}">D${i} · ${name}</div>`;
  }).join('');
}
function renderSignals(){
  document.getElementById('sigGrid').innerHTML = SIGNAL_KEYS.map(k=>`<div class="sig ${signals[k]?'active':''}">${k}</div>`).join('');
}
let memWindowStart=0, memFollow=true;
const MEM_WINDOW_SIZE=18;
function renderMemory(){
  if(memFollow) memWindowStart=Math.max(0, state.PC-4);
  let html='';
  for(let i=0;i<MEM_WINDOW_SIZE;i++){
    const addr=(memWindowStart+i)&0xFFF, val=mem[addr];
    const isPC=addr===state.PC, isAR=addr===state.AR && state.T>0;
    html += `<tr class="${isPC?'pc-row':''} ${isAR?'ar-row':''}"><td class="addr">${hex(addr,3)}</td><td class="${val!==0?'nz':''}">${hex(val,4)}</td><td class="tiny">${isPC?'◀ PC':''} ${isAR?'◀ AR':''}</td></tr>`;
  }
  document.getElementById('memTable').innerHTML = html;
}
const microLogEntries=[];
function logMicro(T, terminal){
  let parts=[];
  if(signals.LD_AR) parts.push('AR←'+busInfo.src);
  if(signals.LD_IR) parts.push('IR←M[AR]');
  if(signals.LD_DR) parts.push('DR←'+busInfo.src);
  if(signals.INCR_PC) parts.push('PC←PC+1');
  if(signals.INCR_AR) parts.push('AR←AR+1');
  if(signals.INCR_DR) parts.push('DR←DR+1');
  if(signals.READ) parts.push('READ');
  if(signals.WRITE) parts.push('WRITE M[AR]←'+busInfo.src);
  if(signals.LD_PC) parts.push('PC←'+busInfo.src);
  if(signals.DECODE) parts.push('decode → D'+state.D+' ('+D_NAMES[state.D]+'), I='+state.I);
  ['AND','ADD','LDA','CLA','CLE','CMA','CME','CIR','CIL','INC','SPA','SNA','SZA','SZE','HLT','INP','OUT','SKI','SKO','ION','IOF'].forEach(op=>{ if(signals[op]) parts.push(op); });
  let text='T'+T+': '+(parts.length?parts.join(', '):'nop');
  if(terminal) text += '  ⏹ (SC←0)';
  microLogEntries.push({text, hlt: !!signals.HLT});
  if(microLogEntries.length>250) microLogEntries.shift();
}
function renderMicroLog(){
  const box=document.getElementById('microLog');
  box.innerHTML = microLogEntries.slice(-60).map(e=>`<div class="entry ${e.hlt?'hlt':''}">${e.text}</div>`).join('');
  box.scrollTop = box.scrollHeight;
}
function appendOutput(v){
  const box=document.getElementById('outputBox');
  const ch=(v>=32&&v<=126)?String.fromCharCode(v):'·';
  box.innerHTML += `<div>OUT → ${v} (0x${hex(v,2)}) '${ch}'</div>`;
  box.scrollTop = box.scrollHeight;
}
function renderCurrentState(){
  document.getElementById('stTiming').textContent='T'+state.T;
  document.getElementById('stMachine').textContent = state.halted?'halted':(running?'running':(state.cycleCount===0?'idle':'paused'));
  document.getElementById('stOpcode').textContent=state.D;
  document.getElementById('stIndirect').textContent = state.I?'Yes':'No';
}
function renderAll(){
  renderStatusReadout(); renderDiagram(); renderFlags(); renderDecoder(); renderSignals();
  renderMemory(); renderMicroLog(); renderCurrentState();
  if(currentModule){ syncModuleWithCPU(currentModule); renderModuleState(currentModule); }
  if(scopeOpen) renderScope();
  updateButtons();
}
function updateButtons(){
  const halted = state.S===0;
  document.getElementById('stepBtn').disabled = halted || running;
  document.getElementById('haltBtn').textContent = halted ? '▷ Resume' : '⏻ Halt';
  document.getElementById('autoRunToggle').disabled = halted;
}

/* ---- animated data-flow dot ---- */
function spawnDot(d, color){
  const layer=document.getElementById('flowLayer');
  const dot=el('circle', {r:5, class:'flow-dot', fill:color});
  const anim=el('animateMotion', {dur:'0.45s', path:d, fill:'freeze'});
  dot.appendChild(anim);
  layer.appendChild(dot);
  try{ anim.beginElement(); }catch(e){}
  setTimeout(()=>dot.remove(), 470);
}
function animateBusFlow(){
  if(!busInfo.active || state.S===0) return;
  const srcKey=LABEL_TO_KEY[busInfo.src], dstKey=LABEL_TO_KEY[busInfo.dst];
  const p0=srcKey?anchorFor(srcKey):null, p1=dstKey?anchorFor(dstKey):null;
  if(!p0||!p1) return;
  const color = currentCycleColor().replace('var(','').replace(')','');
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(color).trim() || '#4f8cff';
  let d;
  if(busInfo.viaALU) d = `M ${p0.x} ${p0.y} L ${ALU_TOP.x} ${ALU_TOP.y} L ${p1.x} ${p1.y}`;
  else d = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
  spawnDot(d, resolved);
}


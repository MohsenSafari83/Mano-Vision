'use strict';
/* =========================================================================
   DIAGRAM GEOMETRY (Basic Computer tab)
   ========================================================================= */
/* Vertical, converging layout: registers (left) and memory/ALU/IO (right)
   both wire horizontally into one central vertical common bus, with the
   Control Unit framed above it. viewBox 0 0 760 510. */
const BUS_X = 380;
const CU_DEF = {x:250, y:8, w:260, h:78};
const BUS_TOP = CU_DEF.y + CU_DEF.h;   // 86
const BUS_BOTTOM = 450;

const REG_DEFS = [
  {k:'PC', x:20, y:94,  w:190, h:46, bits:'12-bit', tip:'Program Counter — holds the address of the NEXT instruction'},
  {k:'AR', x:20, y:152, w:190, h:46, bits:'12-bit', tip:'Address Register — holds the memory address currently being accessed'},
  {k:'IR', x:20, y:210, w:190, h:46, bits:'16-bit', tip:'Instruction Register — holds the instruction being decoded/executed'},
  {k:'DR', x:20, y:268, w:190, h:46, bits:'16-bit', tip:'Data Register — holds data read from memory / an ALU operand'},
  {k:'AC', x:20, y:326, w:190, h:46, bits:'16-bit', tip:'Accumulator — the main register for arithmetic & logic results'},
  {k:'TR', x:20, y:384, w:190, h:46, bits:'16-bit', tip:'Temporary Register — scratch register used by BSA'}
];
const MEM_DEF  = {x:550, y:94,  w:190, h:46, bits:'4096 × 16', tip:'Main Memory — 4096 words of 16 bits, addressed by AR'};
const ALU_DEF  = {x:550, y:152, w:190, h:46, tip:'Arithmetic Logic Unit — performs AND, ADD, complement and shift operations on AC/DR'};
const INPR_DEF = {x:550, y:210, w:190, h:46, bits:'8-bit', tip:'Input Register — holds one character from an input device'};
const OUTR_DEF = {x:550, y:268, w:190, h:46, bits:'8-bit', tip:'Output Register — holds one character for an output device'};
const E_DEF    = {x:550, y:326, w:190, h:34, cap:'Carry', tip:'Carry / overflow flip-flop used by add and shift micro-operations'};
const I_DEF    = {x:550, y:368, w:190, h:34, cap:'Interrupt', tip:'Indirect bit of the current instruction (1 = indirect addressing)'};

const SRC_INDEX = {AR:0, PC:1, DR:2, AC:3, IR:4, TR:5, MEM:6};
const LABEL_TO_KEY = {
  'PC':'PC', 'AR':'AR', 'IR':'IR', 'DR':'DR', 'AC':'AC', 'TR':'TR', 'OUTR':'OUTR', 'INPR':'INPR',
  'M[AR]':'MEM', 'IR[0-11]':'IR', 'DR+1':'DR', 'AC/E/PC':'AC', 'AC/IO':'AC', 'OUTR/AC':'OUTR'
};
const SIG_COLOR = { load:'var(--blue)', read:'var(--green)', write:'var(--amber)', alu:'var(--purple)', halt:'var(--red)' };

function hex(v,digits){ return v.toString(16).toUpperCase().padStart(digits,'0'); }
function cx(def){ return def.x + def.w/2; }
function cy(def){ return def.y + def.h/2; }
const ALU_TOP = {x:BUS_X, y:cy(ALU_DEF)};
function anchorFor(key){
  const r = REG_DEFS.find(d=>d.k===key);
  if(r) return {x:BUS_X, y:cy(r)};
  if(key==='MEM') return {x:BUS_X, y:cy(MEM_DEF)};
  if(key==='INPR') return {x:BUS_X, y:cy(INPR_DEF)};
  if(key==='OUTR') return {x:BUS_X, y:cy(OUTR_DEF)};
  return null;
}
function regIsActive(regKey){
  switch(regKey){
    case 'PC': return !!(signals.LD_PC||signals.INCR_PC);
    case 'AR': return !!(signals.LD_AR||signals.INCR_AR);
    case 'IR': return !!signals.LD_IR;
    case 'DR': return !!(signals.LD_DR||signals.INCR_DR);
    case 'AC': return !!(signals.LD_AC||signals.CLA||signals.CMA||signals.INC||signals.AND||signals.ADD||signals.LDA||signals.CIR||signals.CIL);
    case 'TR': return !!signals.LD_TR;
    default: return false;
  }
}
function currentCycleColor(){
  if(signals.HLT) return SIG_COLOR.halt;
  if(signals.WRITE) return SIG_COLOR.write;
  if(signals.READ) return SIG_COLOR.read;
  if(['AND','ADD','LDA','CMA','CME','CIR','CIL','INC'].some(op=>signals[op])) return SIG_COLOR.alu;
  return SIG_COLOR.load;
}

const NS='http://www.w3.org/2000/svg';
function el(tag, attrs){ const e=document.createElementNS(NS,tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; }
function showDiagramInfo(label, tip){
  const box=document.getElementById('diagramInfo');
  if(box) box.innerHTML = '<b>'+label+'</b> — '+tip;
}
function makeBoxNode(layer, def, key, label, subtitle, tip, subtitleId){
  const c=cx(def), cyv=cy(def);
  const g=el('g',{class:'node','data-key':key});
  if(tip){
    const title=document.createElementNS(NS,'title'); title.textContent=tip; g.appendChild(title);
    g.style.cursor='pointer';
    g.addEventListener('click', ()=>showDiagramInfo(label, tip));
  }
  g.appendChild(el('rect',{x:def.x,y:def.y,width:def.w,height:def.h,rx:8}));
  const lbl=el('text',{class:'lbl',x:c,y: subtitle? cyv-4 : cyv+5}); lbl.textContent=label; g.appendChild(lbl);
  if(subtitle){
    const sub=el('text',{class:'sub',x:c,y:cyv+14}); sub.textContent=subtitle;
    if(subtitleId) sub.id=subtitleId;
    g.appendChild(sub);
  }
  layer.appendChild(g);
  return g;
}
function buildDiagram(){
  const regLayer=document.getElementById('regLayer');
  const ctrlLayer=document.getElementById('ctrlLayer');

  REG_DEFS.forEach(def=>{
    makeBoxNode(regLayer, def, def.k, def.k, def.bits, def.tip);
    const c=cy(def);
    regLayer.appendChild(el('line',{class:'wire',id:'wire-'+def.k,x1:def.x+def.w,y1:c,x2:BUS_X,y2:c}));
  });

  makeBoxNode(regLayer, MEM_DEF, 'MEM', 'MEMORY', MEM_DEF.bits, MEM_DEF.tip);
  regLayer.appendChild(el('line',{class:'wire',id:'wire-MEM',x1:MEM_DEF.x,y1:cy(MEM_DEF),x2:BUS_X,y2:cy(MEM_DEF)}));

  const aluNode=makeBoxNode(ctrlLayer, ALU_DEF, 'ALU', 'ALU', '—', ALU_DEF.tip, 'diaAluOp'); aluNode.id='aluNode';
  ctrlLayer.appendChild(el('line',{class:'wire',id:'wire-ALU',x1:ALU_DEF.x,y1:cy(ALU_DEF),x2:BUS_X,y2:cy(ALU_DEF)}));

  makeBoxNode(ctrlLayer, INPR_DEF, 'INPR', 'INPR', INPR_DEF.bits, INPR_DEF.tip).id='inprNode';
  ctrlLayer.appendChild(el('line',{class:'wire',id:'wire-INPR',x1:INPR_DEF.x,y1:cy(INPR_DEF),x2:BUS_X,y2:cy(INPR_DEF)}));

  makeBoxNode(ctrlLayer, OUTR_DEF, 'OUTR', 'OUTR', OUTR_DEF.bits, OUTR_DEF.tip).id='outrNode';
  ctrlLayer.appendChild(el('line',{class:'wire',id:'wire-OUTR',x1:OUTR_DEF.x,y1:cy(OUTR_DEF),x2:BUS_X,y2:cy(OUTR_DEF)}));

  makeBoxNode(ctrlLayer, E_DEF, 'E', 'E', E_DEF.cap, E_DEF.tip).id='eNode';
  makeBoxNode(ctrlLayer, I_DEF, 'I', 'I', I_DEF.cap, I_DEF.tip).id='iNode';

  /* Control Unit frame */
  ctrlLayer.appendChild(el('rect',{class:'cu-frame',x:CU_DEF.x,y:CU_DEF.y,width:CU_DEF.w,height:CU_DEF.h,rx:12}));
  const cuTitle=el('text',{class:'cu-title',x:cx(CU_DEF),y:CU_DEF.y+18}); cuTitle.textContent='CONTROL UNIT'; ctrlLayer.appendChild(cuTitle);

  const scDef={x:cx(CU_DEF)-64,y:CU_DEF.y+28,w:128,h:24};
  const scNode=makeBoxNode(ctrlLayer, scDef, 'SC', 'SC: T0', null, 'Sequence Counter — the timing generator that steps T0→T1→T2… to sequence the micro-operations of each cycle');
  scNode.id='scNode';

  const decodeRow=el('text',{class:'cu-decode',x:cx(CU_DEF),y:CU_DEF.y+CU_DEF.h-10});
  [['Op','Opcode'],['Addr','Addr'],['Ind','Indirect']].forEach(([short,idKey],i)=>{
    if(i>0){ const sep=document.createElementNS(NS,'tspan'); sep.setAttribute('class','sep'); sep.textContent='   ·   '; decodeRow.appendChild(sep); }
    const kS=document.createElementNS(NS,'tspan'); kS.setAttribute('class','k'); kS.textContent=short+' ';
    const vS=document.createElementNS(NS,'tspan'); vS.setAttribute('class','v'); vS.setAttribute('id','diaText-'+idKey); vS.textContent='0';
    decodeRow.appendChild(kS); decodeRow.appendChild(vS);
  });
  ctrlLayer.appendChild(decodeRow);

  /* control unit -> bus dashed link, and live bus value readout */
  ctrlLayer.appendChild(el('line',{class:'cu-link',x1:cx(CU_DEF),y1:CU_DEF.y+CU_DEF.h,x2:BUS_X,y2:BUS_TOP}));
  ctrlLayer.appendChild(el('rect',{class:'bus-val-box',x:BUS_X-75,y:BUS_BOTTOM+10,width:150,height:34,rx:8}));
  const bvt=el('text',{class:'bus-val-txt',id:'busValTxt',x:BUS_X,y:BUS_BOTTOM+31}); bvt.textContent='—'; ctrlLayer.appendChild(bvt);
}


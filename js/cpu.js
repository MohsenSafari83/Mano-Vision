'use strict';
/* =========================================================================
   MANO BASIC COMPUTER — CPU MODEL  (engine)
   ========================================================================= */
const MEM_SIZE = 4096;
const mem = new Uint16Array(MEM_SIZE);

const state = {
  AC:0, AR:0, PC:0, IR:0, DR:0, TR:0, OUTR:0, INPR:0,
  E:0, IEN:0, FGI:1, FGO:1, S:1, I:0, D:0,
  T:0, cycleCount:0, halted:false
};

const SIGNAL_KEYS = [
  'LD_AR','LD_PC','LD_IR','LD_DR','LD_AC','LD_TR','LD_OUTR',
  'INCR_PC','INCR_AR','INCR_DR','CLR_AC','CLR_E',
  'READ','WRITE','DECODE',
  'AND','ADD','LDA','STA','BUN','BSA','ISZ',
  'CLA','CLE','CMA','CME','CIR','CIL','INC','SPA','SNA','SZA','SZE','HLT',
  'INP','OUT','SKI','SKO','ION','IOF'
];
const DEFAULT_VISIBLE = ['CLK','LD_AR','LD_IR','LD_DR','LD_AC','LD_PC','READ','WRITE'];

function blankSignals(){
  const s = {};
  for(const k of SIGNAL_KEYS) s[k]=0;
  return s;
}
let signals = blankSignals();
let busInfo = {src:'—', dst:'—', val:0, active:false};

const oscLog = []; // { idx, T, D, mnem, signals:{...} }
const OSC_MAX = 400;

const OPCODE_NAMES = ['AND','ADD','LDA','STA','BUN','BSA','ISZ','(D7)'];

function currentMnemonic(){
  if(state.D===7){
    if(state.I===0) return 'RRI';
    return 'IO';
  }
  return OPCODE_NAMES[state.D] || '?';
}

function pushOsc(){
  oscLog.push({
    idx: state.cycleCount,
    T: state._loggedT,
    D: state.D,
    I: state.I,
    mnem: currentMnemonic(),
    signals: Object.assign({}, signals)
  });
  if(oscLog.length > OSC_MAX) oscLog.shift();
}

/* ---- one clock pulse = one T-state ---- */
function microStep(){
  if(state.S===0){ return false; }
  signals = blankSignals();
  const T = state.T;
  state._loggedT = T;

  if(T===0){
    signals.LD_AR=1;
    busInfo = {src:'PC', dst:'AR', val:state.PC, active:true};
    state.AR = state.PC;
    state.T = 1;
  }
  else if(T===1){
    signals.LD_IR=1; signals.READ=1; signals.INCR_PC=1;
    busInfo = {src:'M[AR]', dst:'IR', val:mem[state.AR], active:true};
    state.IR = mem[state.AR];
    state.PC = (state.PC+1)&0xFFF;
  }
  else if(T===2){
    signals.DECODE=1; signals.LD_AR=1;
    state.I = (state.IR>>15)&1;
    state.D = (state.IR>>12)&7;
    state.AR = state.IR & 0x0FFF;
    busInfo = {src:'IR[0-11]', dst:'AR', val:state.AR, active:true};
  }
  else if(T===3){
    if(state.D!==7 && state.I===1){
      signals.LD_AR=1; signals.READ=1;
      busInfo = {src:'M[AR]', dst:'AR', val:mem[state.AR], active:true};
      state.AR = mem[state.AR];
    } else {
      busInfo = {src:'—', dst:'—', val:0, active:false};
    }
  }
  else if(T===4){
    if(state.D===7){
      if(state.I===0) execRRI(); else execIO();
    } else {
      switch(state.D){
        case 0: signals.LD_DR=1; signals.READ=1; busInfo={src:'M[AR]',dst:'DR',val:mem[state.AR],active:true}; state.DR=mem[state.AR]; break;
        case 1: signals.LD_DR=1; signals.READ=1; busInfo={src:'M[AR]',dst:'DR',val:mem[state.AR],active:true}; state.DR=mem[state.AR]; break;
        case 2: signals.LD_DR=1; signals.READ=1; busInfo={src:'M[AR]',dst:'DR',val:mem[state.AR],active:true}; state.DR=mem[state.AR]; break;
        case 3: signals.WRITE=1; signals.STA=1; busInfo={src:'AC',dst:'M[AR]',val:state.AC,active:true}; mem[state.AR]=state.AC; break;
        case 4: signals.LD_PC=1; signals.BUN=1; busInfo={src:'AR',dst:'PC',val:state.AR,active:true}; state.PC=state.AR; break;
        case 5: signals.WRITE=1; signals.INCR_AR=1; signals.BSA=1; busInfo={src:'PC',dst:'M[AR]',val:state.PC,active:true}; mem[state.AR]=state.PC; state.AR=(state.AR+1)&0x0FFF; break;
        case 6: signals.LD_DR=1; signals.READ=1; busInfo={src:'M[AR]',dst:'DR',val:mem[state.AR],active:true}; state.DR=mem[state.AR]; break;
      }
    }
  }
  else if(T===5){
    switch(state.D){
      case 0: { signals.AND=1; busInfo={src:'DR',dst:'AC',val:state.DR,active:true,viaALU:true}; state.AC = state.AC & state.DR; break; }
      case 1: { signals.ADD=1; busInfo={src:'DR',dst:'AC',val:state.DR,active:true,viaALU:true}; const r=state.AC+state.DR; state.AC=r&0xFFFF; state.E=(r>>16)&1; break; }
      case 2: { signals.LDA=1; busInfo={src:'DR',dst:'AC',val:state.DR,active:true,viaALU:true}; state.AC = state.DR; break; }
      case 5: { signals.LD_PC=1; signals.BSA=1; busInfo={src:'AR',dst:'PC',val:state.AR,active:true}; state.PC = state.AR; break; }
      case 6: { signals.INCR_DR=1; signals.ISZ=1; busInfo={src:'DR',dst:'DR+1',val:state.DR,active:true}; state.DR=(state.DR+1)&0xFFFF; break; }
    }
  }
  else if(T===6){
    signals.WRITE=1; signals.ISZ=1;
    busInfo = {src:'DR', dst:'M[AR]', val:state.DR, active:true};
    mem[state.AR] = state.DR;
    if(state.DR===0){ signals.INCR_PC=1; state.PC=(state.PC+1)&0x0FFF; }
  }

  // advance / end-of-instruction handling
  const isTerminal = computeIsTerminal(T);
  if(isTerminal){
    state.T = 0;
    state.FGI = 1; state.FGO = 1; // device always-ready simplification
    logMicro(T, true);
  } else {
    state.T = T+1;
    logMicro(T, false);
  }
  state.cycleCount++;
  pushOsc();
  return true;
}

function computeIsTerminal(T){
  if(T===0||T===1||T===2) return false;
  if(T===3){
    return false; // T3 always advances to T4 (uniform grid, see design note)
  }
  if(T===4){
    if(state.D===7) return true; // RRI / IO finish in one state
    if(state.D===3||state.D===4) return true; // STA, BUN finish at T4
    return false; // AND/ADD/LDA/ISZ/BSA need more states
  }
  if(T===5){
    if(state.D===6) return false; // ISZ needs T6
    return true; // AND/ADD/LDA/BSA finish at T5
  }
  if(T===6) return true; // ISZ finishes at T6
  return true;
}

function execRRI(){
  const bits = state.IR & 0x0FFF;
  if(bits & 0x800){ signals.CLA=1; state.AC=0; }
  if(bits & 0x400){ signals.CLE=1; state.E=0; }
  if(bits & 0x200){ signals.CMA=1; state.AC=(~state.AC)&0xFFFF; }
  if(bits & 0x100){ signals.CME=1; state.E=state.E^1; }
  if(bits & 0x080){ signals.CIR=1; const lsb=state.AC&1; state.AC=(state.AC>>1)|(state.E<<15); state.E=lsb; }
  if(bits & 0x040){ signals.CIL=1; const msb=(state.AC>>15)&1; state.AC=((state.AC<<1)|state.E)&0xFFFF; state.E=msb; }
  if(bits & 0x020){ signals.INC=1; state.AC=(state.AC+1)&0xFFFF; }
  if(bits & 0x010){ signals.SPA=1; if((state.AC&0x8000)===0){ state.PC=(state.PC+1)&0xFFF; } }
  if(bits & 0x008){ signals.SNA=1; if((state.AC&0x8000)!==0){ state.PC=(state.PC+1)&0xFFF; } }
  if(bits & 0x004){ signals.SZA=1; if(state.AC===0){ state.PC=(state.PC+1)&0xFFF; } }
  if(bits & 0x002){ signals.SZE=1; if(state.E===0){ state.PC=(state.PC+1)&0xFFF; } }
  if(bits & 0x001){ signals.HLT=1; state.S=0; state.halted=true; }
  busInfo = {src:'IR[0-11]', dst:'AC/E/PC', val:bits, active:true};
}

function execIO(){
  const bits = state.IR & 0x0FFF;
  if(bits & 0x800){
    signals.INP=1;
    const v = parseInt(document.getElementById('inprBox').value,10);
    state.INPR = isNaN(v) ? 0 : (v & 0xFF);
    state.AC = (state.AC & 0xFF00) | state.INPR;
    state.FGI = 0;
  }
  if(bits & 0x400){
    signals.OUT=1;
    state.OUTR = state.AC & 0xFF;
    state.FGO = 0;
    appendOutput(state.OUTR);
  }
  if(bits & 0x200){ signals.SKI=1; if(state.FGI){ state.PC=(state.PC+1)&0xFFF; } }
  if(bits & 0x100){ signals.SKO=1; if(state.FGO){ state.PC=(state.PC+1)&0xFFF; } }
  if(bits & 0x080){ signals.ION=1; state.IEN=1; }
  if(bits & 0x040){ signals.IOF=1; state.IEN=0; }
  busInfo = {src:'AC/IO', dst:'OUTR/AC', val:bits, active:true};
}

function runOneInstruction(){
  let guard=0;
  do{
    if(!microStep()) return false;
    guard++;
    if(guard>20) return true;
  } while(state.T!==0 && state.S!==0);
  return true;
}


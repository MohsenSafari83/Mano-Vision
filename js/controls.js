'use strict';
/* =========================================================================
   RUN LOOP / CONTROLS
   ========================================================================= */
let running=false, runTimer=null;
function stopRun(){ running=false; if(runTimer){clearInterval(runTimer); runTimer=null;} document.getElementById('autoRunToggle').checked=false; updateButtons(); }
function startRun(){
  if(state.S===0) return;
  running=true; document.getElementById('autoRunToggle').checked=true; updateButtons();
  const delay=parseInt(document.getElementById('speedRange').value,10);
  runTimer=setInterval(()=>{
    const ok=microStep(); renderAll(); animateBusFlow();
    if(!ok || state.S===0){ stopRun(); renderAll(); }
  }, delay);
}
function doStep(){ if(state.S===0||running) return; microStep(); renderAll(); animateBusFlow(); }
function doReset(){ resetCPU(true); }
function doHaltResume(){
  if(state.S===0){ state.S=1; state.halted=false; } else { stopRun(); state.S=0; state.halted=true; }
  renderAll();
}
function resetCPU(keepMemory){
  state.AC=0; state.AR=0; state.PC=0; state.IR=0; state.DR=0; state.TR=0;
  state.OUTR=0; state.INPR=0;
  state.E=0; state.IEN=0; state.FGI=1; state.FGO=1; state.S=1; state.I=0; state.D=0;
  state.T=0; state.cycleCount=0; state.halted=false;
  signals = blankSignals();
  busInfo = {src:'—', dst:'—', val:0, active:false};
  oscLog.length = 0;
  microLogEntries.length = 0;
  if(!keepMemory) mem.fill(0);
  stopRun();
  renderAll();
}


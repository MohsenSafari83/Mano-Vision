'use strict';
/* =========================================================================
   INIT
   ========================================================================= */
setTheme('dark');
buildDiagram();
buildScopeLegend();
renderModuleGrid();
buildDecorativeDiagram('miniDiagram');
buildDecorativeDiagram('previewDiagram');
document.getElementById('asmSrc').value = SAMPLES.sum;
try{
  const result = assemble(SAMPLES.sum);
  mem.set(result.mem);
}catch(e){ /* ignore */ }
resetCPU(true);
renderAll();

'use strict';
/* =========================================================================
   EVENTS — Basic Computer tab
   ========================================================================= */
document.getElementById('stepBtn').addEventListener('click', doStep);
document.getElementById('resetBtn').addEventListener('click', doReset);
document.getElementById('haltBtn').addEventListener('click', doHaltResume);
document.getElementById('autoRunToggle').addEventListener('change', (e)=>{ if(e.target.checked) startRun(); else stopRun(); });
document.getElementById('speedRange').addEventListener('input', (e)=>{
  document.getElementById('speedLabel').textContent = e.target.value+'ms';
  if(running){ stopRun(); document.getElementById('autoRunToggle').checked=true; running=true; startRun(); }
});
document.getElementById('sampleSelect').addEventListener('change', (e)=>{
  if(e.target.value && SAMPLES[e.target.value]){
    document.getElementById('asmSrc').value = SAMPLES[e.target.value];
    try{
      const result=assemble(SAMPLES[e.target.value]);
      mem.set(result.mem); resetCPU(true);
      document.getElementById('asmMsg').innerHTML = `<div class="msg ok">✔ loaded — ${result.count} words</div>`;
    }catch(err){ document.getElementById('asmMsg').innerHTML = `<div class="msg err">✖ ${err.message}</div>`; }
  }
});
document.getElementById('assembleBtn').addEventListener('click', ()=>{
  const src=document.getElementById('asmSrc').value;
  const msgEl=document.getElementById('asmMsg');
  try{
    const result=assemble(src);
    mem.set(result.mem); resetCPU(true);
    msgEl.innerHTML = `<div class="msg ok">✔ Assembled — ${result.count} words, ${Object.keys(result.sym).length} labels.</div>`;
    memFollow=true;
  }catch(err){ msgEl.innerHTML = `<div class="msg err">✖ ${err.message}</div>`; }
});
document.getElementById('editorToggle').addEventListener('click', ()=>{
  document.getElementById('editorToggle').classList.toggle('open');
  document.getElementById('editorBody').classList.toggle('open');
});
document.getElementById('memJumpBtn').addEventListener('click', ()=>{
  const addr=parseInt(document.getElementById('memJump').value,16);
  if(!isNaN(addr)){ memWindowStart=addr&0xFFF; memFollow=false; renderMemory(); }
});
document.getElementById('memFollowBtn').addEventListener('click', (e)=>{ memFollow=!memFollow; renderMemory(); });

const scopeDrawer=document.getElementById('scopeDrawer');
function openScope(){ scopeOpen=true; scopeDrawer.classList.add('open'); renderScope(); }
function closeScope(){ scopeOpen=false; scopeDrawer.classList.remove('open'); }
document.getElementById('openScopeBtn').addEventListener('click', openScope);
document.getElementById('closeScopeBtn').addEventListener('click', closeScope);
document.getElementById('scopeClearBtn').addEventListener('click', ()=>{ oscLog.length=0; renderScope(); });
document.getElementById('scopeFollowBtn').addEventListener('click', (e)=>{ scopeFollow=!scopeFollow; if(scopeFollow) renderScope(); });

document.addEventListener('keydown', (e)=>{
  if(!document.getElementById('tab-computer').classList.contains('active')) return;
  const tag=(document.activeElement && document.activeElement.tagName)||'';
  if(tag==='TEXTAREA' || tag==='INPUT' || tag==='SELECT') return;
  if(e.code==='Space'){ e.preventDefault(); doStep(); }
  else if(e.key==='a' || e.key==='A'){ document.getElementById('autoRunToggle').checked = !document.getElementById('autoRunToggle').checked; document.getElementById('autoRunToggle').dispatchEvent(new Event('change')); }
  else if(e.key==='r' || e.key==='R'){ doReset(); }
  else if(e.key==='h' || e.key==='H'){ doHaltResume(); }
});


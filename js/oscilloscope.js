'use strict';
/* =========================================================================
   OSCILLOSCOPE
   ========================================================================= */
let scopeOpen=false, scopeFollow=true;
const scopeVisible = new Set(DEFAULT_VISIBLE);
const SCOPE_ALL_KEYS = ['CLK', ...SIGNAL_KEYS];
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function buildScopeLegend(){
  const elL=document.getElementById('scopeLegend');
  elL.innerHTML = SCOPE_ALL_KEYS.map(k=>{
    const checked=scopeVisible.has(k);
    return `<label class="legend-item"><input type="checkbox" data-sig="${k}" ${checked?'checked':''}><span class="legend-swatch" style="background:${k==='CLK'?'#888':'#4f8cff'}"></span>${k}</label>`;
  }).join('');
  elL.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.addEventListener('change', ()=>{
      const k=cb.getAttribute('data-sig');
      if(cb.checked) scopeVisible.add(k); else scopeVisible.delete(k);
      renderScope();
    });
  });
}
function renderScope(){
  const canvas=document.getElementById('scopeCanvas');
  const ctx=canvas.getContext('2d');
  const laneKeys=SCOPE_ALL_KEYS.filter(k=>scopeVisible.has(k));
  const rowH=32, colW=24, leftPad=80, topPad=10;
  const n=oscLog.length;
  const width=Math.max(600, leftPad+n*colW+20);
  const height=topPad*2+laneKeys.length*rowH+24;
  canvas.width=width; canvas.height=height;
  const bg = cssVar('--panel') || '#0f1420';
  const gridC = cssVar('--border-soft') || '#222';
  const lineC = cssVar('--accent1') || '#7c5cff';
  const textC = cssVar('--muted') || '#8b93a7';
  ctx.fillStyle=bg; ctx.fillRect(0,0,width,height);
  ctx.strokeStyle=gridC; ctx.lineWidth=1;
  for(let i=0;i<n;i++){
    const x=leftPad+i*colW;
    if(oscLog[i] && oscLog[i].T===0){
      ctx.strokeStyle='#ff9f43';
      ctx.beginPath(); ctx.moveTo(x,topPad); ctx.lineTo(x,height-20); ctx.stroke();
      ctx.strokeStyle=gridC;
    }
  }
  ctx.font='10px "JetBrains Mono", monospace';
  laneKeys.forEach((key,li)=>{
    const yTop=topPad+li*rowH, yHigh=yTop+7, yLow=yTop+rowH-9;
    ctx.fillStyle=textC; ctx.textAlign='right';
    ctx.fillText(key, leftPad-10, yTop+rowH/2+3);
    ctx.strokeStyle=lineC; ctx.lineWidth=1.6;
    ctx.beginPath();
    let prevVal=null;
    for(let i=0;i<n;i++){
      const entry=oscLog[i];
      const val = key==='CLK' ? (i%2) : (entry.signals[key]?1:0);
      const x0=leftPad+i*colW, x1=x0+colW, y=val?yHigh:yLow;
      if(prevVal===null) ctx.moveTo(x0,y);
      else if(prevVal!==val) ctx.lineTo(x0,y);
      ctx.lineTo(x1,y);
      prevVal=val;
    }
    ctx.stroke();
  });
  ctx.fillStyle=textC; ctx.textAlign='center'; ctx.font='9px "JetBrains Mono", monospace';
  for(let i=0;i<n;i++) ctx.fillText('T'+oscLog[i].T, leftPad+i*colW+colW/2, height-8);
  document.getElementById('scopeInfo').textContent = n+' samples';
  if(scopeFollow){ const wrap=canvas.parentElement; wrap.scrollLeft=wrap.scrollWidth; }
}


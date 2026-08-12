'use strict';
/* =========================================================================
   HOME — decorative diagrams (not tied to the real CPU engine)
   ========================================================================= */
function buildDecorativeDiagram(svgId){
  const svg=document.getElementById(svgId);
  const regs=['PC','AR','DR','AC','IR','TR'];
  const regVals=['0105','0105','0019','0019','2105','0000'];

  // ---- layout constants (viewBox 0 0 620 480) ----
  const regX=18, regW=172, regH=44, regGap=15;
  const busX=228, busW=180, busY=112, busH=260;
  const cuX=228, cuW=180, cuY=14, cuH=84;
  const rightX=460, rightW=142, rightH=72;
  const memY=56, ioY=150, aluY=244;
  const valW=118, valH=36, valX=busX+(busW-valW)/2, valY=busY+busH+22;
  const scY=430;

  let regBoxes='', regWires='';
  regs.forEach((r,i)=>{
    const y=42+i*(regH+regGap);
    const cy=y+regH/2;
    regBoxes += `<g class="deco-node">
      <rect x="${regX}" y="${y}" width="${regW}" height="${regH}" rx="9" fill="var(--panel2)" stroke="var(--border)" stroke-width="1.4"/>
      <text x="${regX+14}" y="${cy+5}" font-family="var(--mono)" font-size="12.5" font-weight="700" fill="var(--text)">${r}</text>
      <text x="${regX+regW-14}" y="${cy+5}" text-anchor="end" font-family="var(--mono)" font-size="12" font-weight="600" fill="var(--accent2)" id="${svgId}-val-${r}">${regVals[i]}</text>
    </g>
    <circle cx="${regX+regW+9}" cy="${cy}" r="3" fill="var(--border)" id="${svgId}-dot-${r}"/>
    <line x1="${regX+regW}" y1="${cy}" x2="${busX}" y2="${cy}" stroke="var(--border)" stroke-width="1.4" id="${svgId}-wire-${r}"/>`;
  });

  // vertical spine that gathers register wires into the bus (like the reference diagram)
  const firstCy = 42+regH/2, lastCy = 42+(regs.length-1)*(regH+regGap)+regH/2;
  const spineX = regX+regW+30;
  regWires = `<line x1="${spineX}" y1="${firstCy}" x2="${spineX}" y2="${lastCy}" stroke="var(--border-soft)" stroke-width="1.4"/>`;
  regs.forEach((r,i)=>{
    const cy=42+i*(regH+regGap)+regH/2;
    regWires += `<line x1="${regX+regW}" y1="${cy}" x2="${spineX}" y2="${cy}" stroke="var(--border)" stroke-width="1.4" id="${svgId}-wire-${r}"/>`;
  });
  regWires += `<line x1="${spineX}" y1="${(firstCy+lastCy)/2}" x2="${busX}" y2="${(firstCy+lastCy)/2}" stroke="var(--border)" stroke-width="1.4"/>`;

  const busCy = busY+busH/2;

  const rightBoxes = `
    <line x1="${busX+busW}" y1="${memY+rightH/2}" x2="${rightX}" y2="${memY+rightH/2}" stroke="var(--border)" stroke-width="1.4" id="${svgId}-wire-MEM"/>
    <rect x="${rightX}" y="${memY}" width="${rightW}" height="${rightH}" rx="9" fill="var(--panel2)" stroke="var(--blue)" stroke-width="1.4"/>
    <text x="${rightX+rightW/2}" y="${memY+30}" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700" fill="var(--text)">MEMORY</text>
    <text x="${rightX+rightW/2}" y="${memY+50}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--muted)">4096 × 16</text>

    <line x1="${busX+busW}" y1="${ioY+rightH/2}" x2="${rightX}" y2="${ioY+rightH/2}" stroke="var(--border)" stroke-width="1.4" id="${svgId}-wire-IO"/>
    <rect x="${rightX}" y="${ioY}" width="${rightW}" height="${rightH}" rx="9" fill="var(--panel2)" stroke="var(--green)" stroke-width="1.4"/>
    <text x="${rightX+rightW/2}" y="${ioY+30}" text-anchor="middle" font-family="var(--mono)" font-size="11.5" font-weight="700" fill="var(--text)">I/O REGISTERS</text>
    <text x="${rightX+rightW/2}" y="${ioY+50}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--muted)">INPR · OUTR</text>

    <line x1="${busX+busW}" y1="${aluY+rightH/2}" x2="${rightX}" y2="${aluY+rightH/2}" stroke="var(--border)" stroke-width="1.4" id="${svgId}-wire-ALU"/>
    <rect x="${rightX}" y="${aluY}" width="${rightW}" height="${rightH}" rx="9" fill="var(--panel2)" stroke="var(--amber)" stroke-width="1.4"/>
    <text x="${rightX+rightW/2}" y="${aluY+30}" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="700" fill="var(--text)">ALU</text>
    <text x="${rightX+rightW/2}" y="${aluY+50}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--muted)" id="${svgId}-alu-e">E: 0</text>
  `;

  const scLabels=['T0','T1','T2','T3','T4','T5'];
  const scStartX = busX + 10;
  const scGap = (busW-20)/(scLabels.length-1);
  let scDots='';
  scLabels.forEach((t,i)=>{
    const cx = scStartX+i*scGap;
    scDots += `<circle cx="${cx}" cy="${scY+22}" r="7" fill="var(--panel2)" stroke="var(--border)" stroke-width="1.4" id="${svgId}-sc-${i}"/>
    <text x="${cx}" y="${scY+40}" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--muted2)">${t}</text>`;
  });

  const svgStr = `
    <!-- control unit -->
    <rect x="${cuX}" y="${cuY}" width="${cuW}" height="${cuH}" rx="10" fill="var(--panel2)" stroke="var(--purple)" stroke-width="1.5"/>
    <text x="${cuX+cuW/2}" y="${cuY+18}" text-anchor="middle" font-family="var(--mono)" font-size="11" font-weight="800" fill="var(--purple)" letter-spacing="0.5">CONTROL UNIT</text>
    <rect x="${cuX+10}" y="${cuY+26}" width="${cuW-20}" height="16" rx="5" fill="none" stroke="var(--border)" stroke-width="1.1"/>
    <text x="${cuX+cuW/2}" y="${cuY+37.5}" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--muted)">Instruction Decoder</text>
    <rect x="${cuX+10}" y="${cuY+46}" width="${cuW-20}" height="16" rx="5" fill="none" stroke="var(--border)" stroke-width="1.1"/>
    <text x="${cuX+cuW/2}" y="${cuY+57.5}" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--muted)">Timing Decoder</text>
    <rect x="${cuX+10}" y="${cuY+66}" width="${cuW-20}" height="16" rx="5" fill="none" stroke="var(--border)" stroke-width="1.1"/>
    <text x="${cuX+cuW/2}" y="${cuY+77.5}" text-anchor="middle" font-family="var(--mono)" font-size="8.5" fill="var(--muted)">Control Logic</text>

    <!-- dashed feedback: control unit <-> PC / IR -->
    <path d="M ${cuX} ${cuY+16} L 8 ${cuY+16} L 8 ${42+regH/2} L ${regX} ${42+regH/2}" fill="none" stroke="var(--purple)" stroke-width="1.3" stroke-dasharray="3 3" opacity="0.55" id="${svgId}-fb-pc"/>
    <path d="M ${regX} ${42+4*(regH+regGap)+regH/2} L 0 ${42+4*(regH+regGap)+regH/2} L 0 ${cuY+cuH-8} L ${cuX} ${cuY+cuH-8}" fill="none" stroke="var(--purple)" stroke-width="1.3" stroke-dasharray="3 3" opacity="0.55" id="${svgId}-fb-ir"/>

    <line x1="${busX+busW/2}" y1="${cuY+cuH}" x2="${busX+busW/2}" y2="${busY}" stroke="var(--purple)" stroke-width="1.4" stroke-dasharray="2 2" opacity="0.7"/>

    <!-- common bus -->
    <rect x="${busX}" y="${busY}" width="${busW}" height="${busH}" rx="12" fill="var(--panel2)" stroke="var(--accent1)" stroke-width="1.7" opacity="0.85"/>
    <text x="${busX+busW/2}" y="${busY+26}" text-anchor="middle" font-family="var(--mono)" font-size="12" font-weight="800" fill="var(--accent1)">COMMON BUS</text>
    <text x="${busX+busW/2}" y="${busY+44}" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--muted)">16-bit</text>
    <circle cx="${busX+busW/2}" cy="${busCy}" r="6" fill="var(--accent2)" id="${svgId}-pulse"/>

    ${regBoxes}
    ${regWires}
    ${rightBoxes}

    <!-- bus value readout -->
    <line x1="${busX+busW/2}" y1="${busY+busH}" x2="${busX+busW/2}" y2="${valY}" stroke="var(--blue)" stroke-width="1.4"/>
    <rect x="${valX}" y="${valY}" width="${valW}" height="${valH}" rx="8" fill="rgba(79,140,255,.12)" stroke="var(--blue)" stroke-width="1.5"/>
    <text x="${valX+valW/2}" y="${valY+valH/2+5}" text-anchor="middle" font-family="var(--mono)" font-size="13" font-weight="800" fill="var(--blue)" id="${svgId}-busval">0x0019</text>

    <!-- SC / timing row -->
    <text x="${busX}" y="${scY+8}" font-family="var(--mono)" font-size="9.5" font-weight="700" fill="var(--muted)">SC <tspan fill="var(--green)" id="${svgId}-sc-num">2</tspan></text>
    ${scDots}
  `;
  svg.innerHTML = svgStr;

  let step=0;
  setInterval(()=>{
    regs.forEach(r=>{
      const wire=document.getElementById(svgId+'-wire-'+r);
      const dot=document.getElementById(svgId+'-dot-'+r);
      if(wire) wire.style.stroke='var(--border)';
      if(dot) dot.setAttribute('fill','var(--border)');
    });
    ['MEM','IO','ALU'].forEach(k=>{
      const wire=document.getElementById(svgId+'-wire-'+k);
      if(wire) wire.style.stroke='var(--border)';
    });

    const r = regs[step % regs.length];
    const wire=document.getElementById(svgId+'-wire-'+r);
    const dot=document.getElementById(svgId+'-dot-'+r);
    if(wire) wire.style.stroke='var(--accent2)';
    if(dot) dot.setAttribute('fill','var(--accent2)');

    const targets=['MEM','IO','ALU'];
    const tgt = targets[step % targets.length];
    const twire=document.getElementById(svgId+'-wire-'+tgt);
    if(twire) twire.style.stroke='var(--accent2)';

    // step the SC / T-state row
    const scIdx = step % 6;
    for(let i=0;i<6;i++){
      const c=document.getElementById(svgId+'-sc-'+i);
      if(c){ c.setAttribute('fill','var(--panel2)'); c.setAttribute('stroke','var(--border)'); }
    }
    const active=document.getElementById(svgId+'-sc-'+scIdx);
    if(active){ active.setAttribute('fill','var(--accent2)'); active.setAttribute('stroke','var(--accent2)'); }
    const scNum=document.getElementById(svgId+'-sc-num');
    if(scNum) scNum.textContent=scIdx;

    // update bus value readout with a plausible hex value
    const busval=document.getElementById(svgId+'-busval');
    if(busval){
      const hex='0x'+Math.floor(Math.random()*0xffff).toString(16).padStart(4,'0').toUpperCase();
      busval.textContent=hex;
    }

    step++;
  }, 900);
}


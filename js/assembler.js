'use strict';
/* =========================================================================
   ASSEMBLER
   ========================================================================= */
const MNEMONICS = new Set(['AND','ADD','LDA','STA','BUN','BSA','ISZ',
  'CLA','CLE','CMA','CME','CIR','CIL','INC','SPA','SNA','SZA','SZE','HLT',
  'INP','OUT','SKI','SKO','ION','IOF','DEC','HEX','ORG','END']);
const MRI = new Set(['AND','ADD','LDA','STA','BUN','BSA','ISZ']);
const RRI_CODE = {CLA:0x7800,CLE:0x7400,CMA:0x7200,CME:0x7100,CIR:0x7080,CIL:0x7040,INC:0x7020,SPA:0x7010,SNA:0x7008,SZA:0x7004,SZE:0x7002,HLT:0x7001};
const IO_CODE = {INP:0xF800,OUT:0xF400,SKI:0xF200,SKO:0xF100,ION:0xF080,IOF:0xF040};
const MRI_BASE = {AND:0x0000,ADD:0x1000,LDA:0x2000,STA:0x3000,BUN:0x4000,BSA:0x5000,ISZ:0x6000};

// Strict number parsing: the ENTIRE token must be a valid decimal or hex
// number, or this throws — no more silently truncating garbage like
// "12XYZ" into 0x12, and no more callers accidentally treating a NaN
// as if it were a real address.
function parseNum(tok){
  if(tok===undefined || tok==='') throw new Error('operand is missing');
  if(/^-?\d+$/.test(tok)) return parseInt(tok,10);
  if(/^[0-9A-Fa-f]+$/.test(tok)) return parseInt(tok,16);
  throw new Error("invalid number '"+tok+"'");
}

function assemble(source){
  const lines = source.split('\n');
  const sym = {};
  const rows = [];
  let loc = 0;

  // ---- pass 1: build symbol table ----
  for(let li=0; li<lines.length; li++){
    let line = lines[li].split(';')[0].trim();
    if(!line) continue;
    let tokens = line.replace(/,/g,' ').trim().split(/\s+/).filter(Boolean);
    const first = tokens[0].toUpperCase();
    if(first==='ORG'){ loc = parseNum(tokens[1]); continue; }
    if(first==='END'){ break; }
    let label=null;
    if(!MNEMONICS.has(first)){ label=tokens[0]; tokens=tokens.slice(1); }
    if(label){
      if(sym.hasOwnProperty(label)) throw new Error('duplicate label: '+label+' (line '+(li+1)+')');
      sym[label]=loc;
    }
    if(tokens.length===0) throw new Error('line has no instruction at address '+loc+' (line '+(li+1)+')');
    const mnemCheck = tokens[0].toUpperCase();
    if(!MNEMONICS.has(mnemCheck)) throw new Error("unknown instruction '"+tokens[0]+"' at address "+loc+' (line '+(li+1)+')');
    rows.push({loc, tokens, line: li+1});
    loc++;
  }

  // ---- pass 2: generate code ----
  const newMem = new Uint16Array(MEM_SIZE);
  for(const row of rows){
    const mnem = row.tokens[0].toUpperCase();
    const operand = row.tokens[1];
    const flag = row.tokens[2];
    let word = 0;
    if(MRI.has(mnem)){
      let addr;
      if(operand===undefined) throw new Error(mnem+' requires an address (loc '+row.loc+', line '+row.line+')');
      if(sym.hasOwnProperty(operand)) addr = sym[operand];
      else {
        try{ addr = parseNum(operand); }
        catch(e){ throw new Error("undefined label '"+operand+"' (loc "+row.loc+', line '+row.line+')'); }
      }
      word = MRI_BASE[mnem] | (addr & 0x0FFF);
      if(flag && flag.toUpperCase()==='I') word |= 0x8000;
    } else if(RRI_CODE.hasOwnProperty(mnem)){
      word = RRI_CODE[mnem];
    } else if(IO_CODE.hasOwnProperty(mnem)){
      word = IO_CODE[mnem];
    } else if(mnem==='DEC'){
      let v = parseInt(operand,10);
      if(operand===undefined || isNaN(v)) throw new Error('invalid DEC value at loc '+row.loc+' (line '+row.line+')');
      if(v<0) v = 0x10000+v;
      word = v & 0xFFFF;
    } else if(mnem==='HEX'){
      let v = parseInt(operand,16);
      if(operand===undefined || isNaN(v)) throw new Error('invalid HEX value at loc '+row.loc+' (line '+row.line+')');
      word = v & 0xFFFF;
    } else {
      throw new Error('unknown instruction: '+mnem+' (loc '+row.loc+', line '+row.line+')');
    }
    newMem[row.loc] = word;
  }
  return {mem:newMem, sym, count:rows.length};
}

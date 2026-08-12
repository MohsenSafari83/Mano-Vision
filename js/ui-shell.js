'use strict';
/* =========================================================================
   THEME + TABS
   ========================================================================= */
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.removeItem && null; // no persistence needed (artifacts avoid storage APIs); keep in-memory only
  document.getElementById('themeBtn').textContent = t==='dark' ? '◐' : '◑';
}
let currentTheme='dark';
document.getElementById('themeBtn').addEventListener('click', ()=>{
  currentTheme = currentTheme==='dark' ? 'light' : 'dark';
  setTheme(currentTheme);
  if(scopeOpen) renderScope();
});

function switchTab(name){
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+name).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.toggle('active', l.getAttribute('data-tab')===name));
  window.scrollTo({top:0, behavior:'instant'});
}
document.querySelectorAll('[data-tab]').forEach(elx=>{
  elx.addEventListener('click', (e)=>{ e.preventDefault(); switchTab(elx.getAttribute('data-tab')); });
});


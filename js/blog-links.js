'use strict';
/* =========================================================================
   BLOG → MODULE cross-links
   ========================================================================= */
document.querySelectorAll('[data-mod-link]').forEach(elx=>{
  elx.addEventListener('click', ()=>{
    switchTab('modules');
    openModuleDetail(elx.getAttribute('data-mod-link'));
  });
});


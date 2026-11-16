(() => {
 'use strict';
 const root = new URL('.',document.currentScript.src);
 const url = path => new URL(path,root).href;
 window.SiteLinks = Object.freeze({root:root.href,url});
 function resolve(container) { container.querySelectorAll('a[href^="/yoico-site/"]').forEach(a => a.href=url(a.getAttribute('href').slice(12))); }
 function menu(){
  const toggle=document.querySelector('.nav-toggle'),nav=document.getElementById('mobile-nav');
  if(!toggle||!nav)return;
  const close=()=>{nav.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','メニューを開く');};
  toggle.addEventListener('click',()=>{const open=nav.hidden;nav.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く');});
  nav.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))close();});
  matchMedia('(min-width:701px)').addEventListener('change',e=>{if(e.matches)close();});
 }
 function analytics(){
  const id=window.SITE_CONFIG?.measurementId;
  if(!/^G-[A-Z0-9]+$/.test(id||''))return;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  gtag('js',new Date());gtag('config',id);
  const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.append(s);
 }
 document.addEventListener('DOMContentLoaded',()=>{
  resolve(document);menu();analytics();
  document.addEventListener('click',e=>{
   if(typeof window.gtag!=='function')return;
   const a=e.target.closest('a');if(!a)return;const h=a.href;
   if(h.startsWith('tel:'))gtag('event','phone_click',{event_label:h.slice(4)});
   else if(h.includes('maps.app.goo.gl'))gtag('event','map_click',{event_label:'Google Maps'});
   else if(h.includes('instagram.com'))gtag('event','instagram_click',{event_label:'yoico_nishijin'});
  });
 });
})();

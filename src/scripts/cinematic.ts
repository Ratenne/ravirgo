// Native navigation/history/focus remain untouched. Content is always visible without JS.
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const targets=document.querySelectorAll<HTMLElement>('.service-row,.cinematic-directory .directory-heading');
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){if(!motion.matches)entry.target.classList.add('has-entered');observer.unobserve(entry.target);}},{threshold:.08});
for(const target of targets)observer.observe(target);
addEventListener('pagehide',()=>observer.disconnect(),{once:true});
addEventListener('pageshow',()=>document.documentElement.classList.remove('is-leaving'));

import { services } from '../data/services';
export const GET=()=>new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/about/',...services.map(s=>`/services/${s.slug}/`)].map(p=>`<url><loc>https://ravirgo.com${p}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8'}});

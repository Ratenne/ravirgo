export type Service = {
  slug: string; name: string; category: string; categoryLabel: string;
  description: string; url: string; searchTerms: string[];
  featured: boolean; exhibit?: 'price' | 'receipt';
};
/** Add services here. HTML, search, categories, sitemap detail routes and featured 3D share this source. */
export const services: Service[] = [
  {slug:'pricepulse',name:'PricePulse',category:'price',categoryLabel:'가격 정보',description:'GPU·CPU·노트북의 가격 흐름',url:'https://price-pulse.ravirgo.com',searchTerms:['가격','그래픽카드','GPU','CPU','노트북','프라이스펄스','price pulse'],featured:true,exhibit:'price'},
  {slug:'receipt-ocr',name:'영수증 OCR',category:'document',categoryLabel:'문서 도구',description:'영수증 정보를 엑셀로 정리',url:'https://receipt-to-excel.ravirgo.com/',searchTerms:['영수증','OCR','엑셀','excel','문서','receipt'],featured:true,exhibit:'receipt'},
];
export const categories = [...new Map(services.map(s=>[s.category,{id:s.category,label:s.categoryLabel}])).values()];
// Keep the spatial collection bounded as the directory grows. HTML always includes ALL services.
export const featuredServices = services.filter(s=>s.featured&&s.exhibit).slice(0,4);

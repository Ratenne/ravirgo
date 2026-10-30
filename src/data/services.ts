export type Service = {
  slug: string; name: string; category: string; categoryLabel: string;
  description: string; url: string; searchTerms: string[];
  featured: boolean; exhibit?: 'price' | 'receipt';
  order?: number; poster?: string; modelType?: 'procedural' | 'glb' | 'poster';
  modelSource?: string; scale?: number; rotation?: [number, number, number];
  details?: { introduction: string; features: string[]; note?: string };
};
/** Add services here. HTML, search, categories, sitemap detail routes and featured 3D share this source. */
export const services: Service[] = [
  {slug:'flowad',name:'Flowad',category:'driving',categoryLabel:'드라이빙',description:'드라이빙 코스 추천 서비스',url:'https://ravirgo.com/flowad',searchTerms:['드라이빙','코스','운전','flowad'],featured:false,order:30,details:{introduction:'새로운 길을 발견하는 드라이빙 코스 추천 서비스를 준비하고 있습니다.',features:[]}},

  {slug:'pricepulse',name:'PricePulse',category:'price',categoryLabel:'가격 정보',description:'GPU·CPU·노트북의 가격 흐름',url:'https://price-pulse.ravirgo.com',searchTerms:['가격','그래픽카드','GPU','CPU','노트북','프라이스펄스','price pulse'],featured:true,exhibit:'price',order:10,poster:'/assets/posters/pricepulse.svg',modelType:'procedural',modelSource:'price',details:{introduction:'GPU, CPU, 노트북의 가격 변화를 살펴보고 현재 가격의 위치를 확인하는 서비스입니다.',features:['상품군별 가격 흐름 확인','기간별 가격 변화와 가격 범위 비교'],note:'서비스에 표시된 예시 가격은 해당 화면의 안내를 확인하세요.'}},
  {slug:'receipt-ocr',name:'영수증 OCR',category:'document',categoryLabel:'문서 도구',description:'영수증 정보를 엑셀로 정리',url:'https://receipt-to-excel.ravirgo.com/',searchTerms:['영수증','OCR','엑셀','excel','문서','receipt'],featured:true,exhibit:'receipt',order:20,poster:'/assets/posters/receipt-ocr.svg',modelType:'procedural',modelSource:'receipt',details:{introduction:'영수증의 문자를 읽어 엑셀로 정리하는 서비스입니다.',features:['영수증 정보 읽기','엑셀로 정보 정리']}},
];
export const orderedServices = [...services].sort((a,b)=>(a.order??100)-(b.order??100)||a.slug.localeCompare(b.slug));
export const categories = [...new Map(orderedServices.map(s=>[s.category,{id:s.category,label:s.categoryLabel}])).values()];
// Total featured membership is independent of the concurrent GPU budget.
export const featuredServices = orderedServices.filter(s=>s.featured);

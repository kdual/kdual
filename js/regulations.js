(() => {
'use strict';
const $=s=>document.querySelector(s);
const standardCategories=['전체','일학습병행','계약학과','기타'];
let entries=[],category='전체',loading=true,error=false,page=1;
const pageSize=5;
const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';if(text!==undefined)el.textContent=text;return el;};
function documentType(x){
 if(['법령','고시','운영규칙','매뉴얼'].includes(x.documentType))return x.documentType;
 if(/매뉴얼/.test(x.title))return '매뉴얼';
 if(/고시/.test(x.description||''))return '고시';
 if(/법률/.test(x.title))return '법령';
 if(/운영규칙/.test(x.title))return '운영규칙';
 return '자료';
}
function typeSymbol(type){
 const symbol=make('div','doc-symbol');symbol.setAttribute('aria-label','자료 종류: '+type);
 const paths={
  '법령':['M12 3v18M5 21h14M4 7h16M6 7l-4 7h8L6 7zM18 7l-4 7h8l-4-7z'],
  '고시':['M3 10v4h4l12 5V5L7 10H3zM7 14l2 7h4l-2-5M22 9v6'],
  '운영규칙':['M9 5h11M9 12h11M9 19h11M3 5h1M3 12h1M3 19h1'],
  '매뉴얼':['M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1z'],
  '자료':['M6 2h9l4 4v16H6zM14 2v5h5M9 12h7M9 16h7']
 };
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}).forEach(([key,value])=>svg.setAttribute(key,value));
 for(const d of paths[type]||paths['자료']){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);svg.append(path);}
 symbol.append(svg,make('span','doc-kind-label',type));return symbol;
}
const safeUrl=value=>{if(typeof value!=='string'||!value.trim())return null;try{const u=new URL(value,location.href);return u.protocol==='https:'||(u.protocol==='http:'&&u.origin===location.origin)?u.href:null;}catch{return null;}};
const pagination=make('nav','document-pagination');pagination.id='document-pagination';pagination.setAttribute('aria-label','규정 자료 목록 페이지');$('#document-list').after(pagination);$('#list-title').tabIndex=-1;
function renderPagination(total,pages){
 pagination.replaceChildren();pagination.hidden=total===0;
 const add=(label,target,disabled=false)=>{
  const b=make('button','document-page-button',label);b.type='button';b.disabled=disabled;
  if(/^\d/.test(label))b.setAttribute('aria-label',label+'페이지');
  if(target===page&&/^\d/.test(label))b.setAttribute('aria-current','page');
  b.onclick=()=>{page=target;render();$('#list-title').focus({preventScroll:true});$('#list-title').scrollIntoView({block:'start',behavior:'auto'});};pagination.append(b);
 };
 add('이전',page-1,page===1);
 const numbers=[...new Set([1,...Array.from({length:5},(_,i)=>page-2+i).filter(n=>n>0&&n<=pages),pages])].sort((a,b)=>a-b);
 numbers.forEach((n,i)=>{if(i&&n-numbers[i-1]>1)pagination.append(make('span','document-page-gap','…'));add(String(n),n);});
 add('다음',page+1,page===pages);
}
function render(){
 const categories=standardCategories;
 $('#categories').replaceChildren(...categories.map(name=>{const b=make('button','',name);b.type='button';b.setAttribute('aria-pressed',String(name===category));b.append(make('span','',String(name==='전체'?entries.length:entries.filter(x=>x.category===name).length)));b.onclick=()=>{category=name;page=1;render();};return b;}));
 const words=$('#search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const visible=entries.filter(x=>(category==='전체'||category===x.category)&&words.every(w=>`${x.title} ${x.description} ${x.category}`.toLowerCase().includes(w)));
 $('#list-title').replaceChildren(document.createTextNode(category==='전체'?'전체 자료':category),make('span','',String(visible.length)));
 const pages=Math.max(1,Math.ceil(visible.length/pageSize));page=Math.min(page,pages);
 $('#list-note').textContent=loading?'자료를 불러오는 중입니다…':error?'자료 조회 실패':visible.length?`총 ${visible.length}개 · ${(page-1)*pageSize+1}–${Math.min(page*pageSize,visible.length)}개 표시`:'총 0개';
 renderPagination(visible.length,pages);
 $('#document-list').replaceChildren(...visible.slice((page-1)*pageSize,page*pageSize).map(x=>{
 const card=make('article','doc-card');card.append(typeSymbol(documentType(x)));const content=make('div');const meta=make('div','doc-meta');meta.append(make('span','doc-category',x.category));
 if(x.pdfUrl)meta.append(make('span','doc-format','PDF'));
 if(x.ebookUrl)meta.append(make('span','doc-format doc-format-ebook','E-BOOK'));
 content.append(meta,make('h3','',x.title));if(x.description)content.append(make('p','',x.description));
 const dates=[x.revisedDate?`개정일 ${x.revisedDate}`:'',x.effectiveDate?`시행일 ${x.effectiveDate}`:'',x.publicationDate?`발행월 ${x.publicationDate}`:''].filter(Boolean);if(dates.length)content.append(make('p','',dates.join(' · ')));
 const actions=make('div','doc-actions');const pdf=make('a','','PDF 보기');pdf.href=x.pdfUrl;actions.append(pdf);
 const ebook=make(x.ebookUrl?'a':'button','','E-BOOK 보기');if(x.ebookUrl)ebook.href=x.ebookUrl;else{ebook.type='button';ebook.disabled=true;}ebook.title=x.ebookUrl?'E-BOOK 열람':'E-BOOK 자료가 등록되지 않았습니다';actions.append(ebook);
 const download=make('a','','다운로드');download.href=x.pdfUrl;download.download=x.fileName;actions.append(download);content.append(actions);card.append(content);return card;
 }));
 $('#empty').hidden=visible.length>0||loading;
 $('#empty h3').textContent=error?'자료를 불러오지 못했습니다':entries.length?'검색 결과가 없습니다':'등록된 자료가 없습니다';
 $('#empty p').textContent=error?'잠시 후 페이지를 새로고침해 주세요.':entries.length?'다른 검색어나 자료 분류를 선택해 주세요.':'자료가 등록되면 이곳에서 확인할 수 있습니다.';
}
$('#search').oninput=()=>{page=1;render();};$('#search-form').onsubmit=e=>{e.preventDefault();page=1;render();};
render();
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
fetch(`data/regulations.json?_=${Date.now()}`,{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(data=>{
 if(!data||!Array.isArray(data.documents))throw new Error('Invalid document list');
 entries=data.documents.filter(x=>x&&x.published!==false&&typeof x.title==='string'&&x.title.trim()&&safeUrl(x.pdfUrl)).map(x=>({title:x.title.trim(),category:['일학습병행','계약학과','기타'].includes(String(x.category||'').trim())?x.category.trim():'기타',description:typeof x.description==='string'?x.description:'',revisedDate:typeof x.revisedDate==='string'?x.revisedDate:'',effectiveDate:typeof x.effectiveDate==='string'?x.effectiveDate:'',publicationDate:typeof x.publicationDate==='string'?x.publicationDate:'',sortDate:[x.revisedDate,x.effectiveDate,x.publicationDate].find(value=>typeof value==='string'&&/^\d{4}-\d{2}(?:-\d{2})?$/.test(value))||'',fileName:typeof x.fileName==='string'&&x.fileName.trim()?x.fileName.trim():`${x.title.trim()}.pdf`,pdfUrl:safeUrl(x.pdfUrl),ebookUrl:safeUrl(x.ebookUrl)})).sort((a,b)=>b.sortDate.localeCompare(a.sortDate));
}).catch(()=>{error=true;}).finally(()=>{clearTimeout(timeout);loading=false;render();});
})();

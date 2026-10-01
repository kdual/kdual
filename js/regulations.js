(() => {
'use strict';
const $=s=>document.querySelector(s);
const standardCategories=['전체','법령 및 규정','운영 지침','평가 및 품질관리','서식 및 매뉴얼'];
let entries=[],category='전체',loading=true,error=false,current=null,book=false;
const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';if(text!==undefined)el.textContent=text;return el;};
const safeUrl=value=>{if(typeof value!=='string'||!value.trim())return null;try{const u=new URL(value,location.href);return u.protocol==='https:'||(u.protocol==='http:'&&u.origin===location.origin)?u.href:null;}catch{return null;}};
function render(){
 const categories=[...new Set([...standardCategories,...entries.map(x=>x.category)])];
 $('#categories').replaceChildren(...categories.map(name=>{const b=make('button','',name);b.type='button';b.setAttribute('aria-pressed',String(name===category));b.append(make('span','',String(name==='전체'?entries.length:entries.filter(x=>x.category===name).length)));b.onclick=()=>{category=name;render();};return b;}));
 const words=$('#search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 const visible=entries.filter(x=>(category==='전체'||category===x.category)&&words.every(w=>`${x.title} ${x.description} ${x.category}`.toLowerCase().includes(w)));
 $('#list-title').replaceChildren(document.createTextNode(category==='전체'?'전체 자료':category),make('span','',String(visible.length)));
 $('#list-note').textContent=loading?'자료를 불러오는 중입니다…':error?'자료 조회 실패':'등록된 자료 기준';
 $('#document-list').replaceChildren(...visible.map(x=>{
 const card=make('article','doc-card');card.append(make('div','doc-symbol','PDF'));const content=make('div');const meta=make('div','doc-meta');meta.append(make('span','',x.category));content.append(meta,make('h3','',x.title));if(x.description)content.append(make('p','',x.description));
 const dates=[x.revisedDate?`개정일 ${x.revisedDate}`:'',x.effectiveDate?`시행일 ${x.effectiveDate}`:''].filter(Boolean);if(dates.length)content.append(make('p','',dates.join(' · ')));
 const actions=make('div','doc-actions');const pdf=make('button','','PDF 보기');pdf.type='button';pdf.onclick=()=>open(x,false);actions.append(pdf);
 const ebook=make('button','','E-BOOK 보기');ebook.type='button';ebook.disabled=!x.ebookUrl;ebook.title=x.ebookUrl?'E-BOOK 열람':'E-BOOK 자료가 등록되지 않았습니다';ebook.onclick=()=>open(x,true);actions.append(ebook);
 const download=make('a','','다운로드');download.href=x.pdfUrl;download.download='';actions.append(download);content.append(actions);card.append(content);return card;
 }));
 $('#empty').hidden=visible.length>0||loading;
 $('#empty h3').textContent=error?'자료를 불러오지 못했습니다':entries.length?'검색 결과가 없습니다':'등록된 자료가 없습니다';
 $('#empty p').textContent=error?'잠시 후 페이지를 새로고침해 주세요.':entries.length?'다른 검색어나 자료 분류를 선택해 주세요.':'자료가 등록되면 이곳에서 확인할 수 있습니다.';
}
function updateViewer(){
 $('#pdf-tab').setAttribute('aria-pressed',String(!book));$('#book-tab').setAttribute('aria-pressed',String(book));$('#book-tab').disabled=!current.ebookUrl;
 const url=book?current.ebookUrl:current.pdfUrl;$('#document-frame').src=url;$('#viewer-newtab').href=url;$('#viewer-download').href=current.pdfUrl;
}
function open(x,isBook){current=x;book=isBook;$('#viewer-title').textContent=x.title;updateViewer();$('#viewer').showModal();}
$('#search').oninput=render;$('#search-form').onsubmit=e=>{e.preventDefault();render();};$('#close-viewer').onclick=()=>$('#viewer').close();$('#viewer').onclick=e=>{if(e.target===$('#viewer'))$('#viewer').close();};$('#viewer').onclose=()=>{$('#document-frame').removeAttribute('src');current=null;};
$('#pdf-tab').onclick=()=>{book=false;updateViewer();};$('#book-tab').onclick=()=>{if(current.ebookUrl){book=true;updateViewer();}};
render();
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
fetch(`data/regulations.json?_=${Date.now()}`,{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then(data=>{
 if(!data||!Array.isArray(data.documents))throw new Error('Invalid document list');
 entries=data.documents.filter(x=>x&&x.published!==false&&typeof x.title==='string'&&x.title.trim()&&safeUrl(x.pdfUrl)).map(x=>({title:x.title.trim(),category:typeof x.category==='string'&&x.category.trim()?x.category:'기타',description:typeof x.description==='string'?x.description:'',revisedDate:typeof x.revisedDate==='string'?x.revisedDate:'',effectiveDate:typeof x.effectiveDate==='string'?x.effectiveDate:'',pdfUrl:safeUrl(x.pdfUrl),ebookUrl:safeUrl(x.ebookUrl)}));
}).catch(()=>{error=true;}).finally(()=>{clearTimeout(timeout);loading=false;render();});
})();

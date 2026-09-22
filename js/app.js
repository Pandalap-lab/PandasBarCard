import{gestureAxis,categoryStep}from './gestures.js';
import{loadData,photoURL,priceText}from './store.js';
const $=id=>document.getElementById(id), rail=$('rail'), dialog=$('detail');let data,shown=[],index=0,observer,selected,returnFocus,closing=false;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function fallback(){const e=el('div',undefined,'placeholder');e.innerHTML='<svg viewBox="0 0 140 210" fill="none" aria-hidden="true"><path d="M20 25H120L70 100L20 25Z M70 100V180 M40 184H100" stroke="currentColor" stroke-width="1.3"/><path d="M31 43H109" stroke="currentColor" stroke-opacity=".4"/><ellipse cx="70" cy="190" rx="45" ry="5" fill="currentColor" opacity=".06"/></svg>';e.append(el('small','Originalfoto folgt'));return e;}
function visual(d,eager=false){const e=el('div',undefined,'visual'),url=photoURL(d.photo);if(url){const i=el('img');i.src=url;i.alt=d.photoAlt||d.name;i.loading=eager?'eager':'lazy';i.decoding='async';i.addEventListener('load',()=>{try{const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(i,0,0,16,16);const px=ctx.getImageData(0,0,16,16).data;let rgb=[0,0,0],n=0;for(let k=0;k<px.length;k+=4){if(px[k+3]>128){rgb=rgb.map((v,j)=>v+px[k+j]);n++;}}if(n){d.palette=['#'+rgb.map(v=>Math.round(v/n*.55).toString(16).padStart(2,'0')).join('')];if(shown[index]?.id===d.id)tone(d);}}catch{}},{once:true});i.addEventListener('error',()=>i.replaceWith(fallback()),{once:true});e.append(i);}else e.append(fallback());return e;}
let layer=false;function tone(d){const t=d.palette?.[0];const color=/^#[0-9a-f]{6}$/i.test(t)?t:'#704329';layer=!layer;const a=$(layer?'glowA':'glowB'),b=$(layer?'glowB':'glowA');a.style.setProperty('--tone',color);a.style.opacity='.75';b.style.opacity='0';}
function activate(i){index=i;[...rail.children].forEach((e,j)=>{e.classList.toggle('current',i===j);e.setAttribute('aria-label',shown[j].name+', '+priceText(shown[j])+(shown[j].active?'':', derzeit nicht verfügbar'));});$('position').textContent=shown.length?`${i+1} / ${shown.length}`:'0 / 0';$('prev').disabled=i===0||!shown.length;$('next').disabled=i>=shown.length-1;if(shown[i])tone(shown[i]);}
function category(id){selected=id;requestAnimationFrame(()=>{const tab=[...$('categories').children].find(b=>b.dataset.id===id);if(tab){const nav=$('categories');nav.scrollTo({left:tab.offsetLeft-nav.offsetLeft-(nav.clientWidth-tab.offsetWidth)/2,behavior:reduced?'instant':'smooth'});}});observer?.disconnect();shown=data.drinks.filter(d=>d.categoryId===id&&(d.active||data.settings?.unavailableMode!=='hide')).sort((a,b)=>a.order-b.order);$('categoryTitle').textContent=data.categories.find(c=>c.id===id)?.name;$('count').textContent=`${shown.length} ${shown.length===1?'Drink':'Drinks'}`;document.querySelectorAll('#categories button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id));rail.replaceChildren();shown.forEach((d,i)=>{const b=el('button',undefined,'drink');b.type='button';b.append(visual(d,i===0),el('h2',d.name),el('div',priceText(d),'price'));if(!d.active)b.append(el('p','Derzeit nicht verfügbar','badge'));b.append(el('p','ENTDECKEN ↗','hint'));b.addEventListener('click',()=>open(d,b));rail.append(b);});rail.scrollLeft=0;activate(0);observer=new IntersectionObserver(entries=>{const best=entries.filter(e=>e.isIntersecting&&e.intersectionRatio>=.6).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(best)activate([...rail.children].indexOf(best.target));},{root:rail,threshold:[.6,.8]});[...rail.children].forEach(e=>observer.observe(e));$('status').textContent=shown.length?'↔ Drinks · ↕ Kategorien · Antippen für Details':'In dieser Kategorie sind aktuell keine Drinks verfügbar.';}
function open(d,b){if(closing)return;returnFocus=b;$('detailImage').replaceChildren(visual(d,true));$('detailName').textContent=d.name;$('detailCategory').textContent=data.categories.find(c=>c.id===d.categoryId)?.name;$('detailPrice').textContent=priceText(d);$('detailDescription').textContent=d.description||'';$('detailDescription').hidden=!d.description;$('availability').textContent=d.active?'':'Derzeit nicht verfügbar';$('ingredients').replaceChildren(...d.ingredients.map(x=>el('li',x)));$('recipeNote').textContent=d.notes||'';$('extras').replaceChildren();for(const [label,value]of [['Glas',d.glass],['Garnitur',d.garnish],['Allergene',d.allergens?.join(', ')],['Alkohol',d.alcoholContent]])if(value)$('extras').append(el('dt',label),el('dd',String(value)));dialog.showModal();document.body.style.overflow='hidden';requestAnimationFrame(()=>dialog.classList.add('open'));$('close').focus();}
function close(){if(closing)return;closing=true;dialog.classList.remove('open');setTimeout(()=>{dialog.close();document.body.style.overflow='';returnFocus?.focus({preventScroll:true});closing=false;},reduced?0:300);}$('close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});function move(n){const i=Math.max(0,Math.min(shown.length-1,index+n));rail.children[i]?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'nearest',inline:'center'});}$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);rail.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}});
function changeCategory(step){
 const categories=[...data.categories].sort((a,b)=>a.order-b.order);
 const next=categories[categories.findIndex(c=>c.id===selected)+step];
 if(next){category(next.id);if(!reduced)rail.animate([{opacity:.2,transform:`translateY(${step*18}px)`},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});}
}
let gesture=null,suppressClickUntil=0;
rail.addEventListener('touchstart',e=>{
 if(e.touches.length!==1||dialog.open){gesture=null;return;}
 const t=e.touches[0];gesture={x:t.clientX,y:t.clientY,axis:null,dy:0};
},{passive:true});
rail.addEventListener('touchmove',e=>{
 if(!gesture)return;
 if(e.touches.length!==1){gesture=null;return;}
 const t=e.touches[0],dx=t.clientX-gesture.x;
 gesture.dy=t.clientY-gesture.y;
 gesture.axis ||= gestureAxis(dx,gesture.dy);
 if(gesture.axis==='vertical'&&e.cancelable)e.preventDefault();
 if(gesture.axis)suppressClickUntil=Date.now()+500;
},{passive:false});
rail.addEventListener('touchend',()=>{
 if(!gesture)return;
 const step=categoryStep(gesture.axis,gesture.dy);gesture=null;
 if(step)changeCategory(step);
},{passive:true});
rail.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
rail.addEventListener('click',e=>{if(Date.now()<suppressClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
rail.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();changeCategory(e.key==='ArrowDown'?1:-1);rail.children[0]?.focus({preventScroll:true});}});

try{data=await loadData({draft:new URLSearchParams(location.search).has('preview')});for(const c of [...data.categories].sort((a,b)=>a.order-b.order)){const b=el('button',c.name);b.dataset.id=c.id;b.onclick=()=>category(c.id);$('categories').append(b);}category(data.categories[0].id);}catch(e){$('status').textContent=e.message+' Bitte lade die Seite erneut.';}

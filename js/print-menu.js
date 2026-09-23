import {PDFDocument,StandardFonts,rgb} from './vendor/pdf-lib.js';

// Native vector text: no screenshots, external service or guest photographs.
export async function createMenuPDF(data,{date=new Date(),draft=false}={}){
 const pdf=await PDFDocument.create();
 const serif=await pdf.embedFont(StandardFonts.TimesRoman);
 const body=await pdf.embedFont(StandardFonts.Helvetica);
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 const W=148/25.4*72,H=210/25.4*72,M=34,RIGHT=W-M,BOTTOM=49;
 const brown=rgb(.19,.135,.105),gold=rgb(.86,.72,.45),white=rgb(.97,.945,.89),muted=rgb(.79,.73,.65);
 const clean=value=>String(value??'').normalize('NFC').replace(/[\r\n\t\s]+/gu,' ').trim();
 const text=value=>{const s=clean(value);try{body.encodeText(s);serif.encodeText(s);}catch{throw Error('Ein Zeichen in „'+s.slice(0,70)+'“ kann nicht gedruckt werden. Bitte Sonderzeichen prüfen.');}return s;};
 function wrap(value,font,size,width){
  const lines=[];let line='';
  for(const word of text(value).split(' ')){
   if(!word)continue;
   if(font.widthOfTextAtSize((line?line+' ':'')+word,size)<=width){line+=(line?' ':'')+word;continue;}
   if(line){lines.push(line);line='';}
   for(const c of word){if(font.widthOfTextAtSize(line+c,size)>width){lines.push(line);line='';}line+=c;}
  }if(line)lines.push(line);return lines;
 }
 const money=p=>p===null||p===undefined?'Preis offen':new Intl.NumberFormat('de-AT',{style:'currency',currency:'EUR'}).format(p);
 const groups=[...data.categories].sort((a,b)=>a.order-b.order).map(category=>({category,drinks:data.drinks.filter(d=>d.categoryId===category.id&&(d.active||data.settings?.unavailableMode!=='hide')).sort((a,b)=>a.order-b.order)})).filter(g=>g.drinks.length);
 if(!groups.length)throw Error('Keine druckbaren Getränke vorhanden.');
 let page,y;
 const label=text(data.brand?.name||'First Floor');
 const stamp=new Intl.DateTimeFormat('de-AT').format(date);
 function write(s,x,top,font,size,color=white){page.drawText(text(s),{x,y:H-top-size,font,size,color});}
 function newPage(){
  page=pdf.addPage([W,H]);page.drawRectangle({x:0,y:0,width:W,height:H,color:brown});
  page.drawRectangle({x:16,y:16,width:W-32,height:H-32,borderWidth:.45,borderColor:gold,opacity:.65});
  write(label.toLocaleLowerCase('de'),M,29,serif,28,gold);
  write('B A R K A R T E',M,63,body,8.5,muted);
  page.drawLine({start:{x:M,y:H-85},end:{x:RIGHT,y:H-85},thickness:.45,color:gold});y=103;
 }
 function heading(category,continued=false){
  const lines=wrap(category.name,serif,21,RIGHT-M);
  for(const l of lines){write(l,M,y,serif,21,gold);y+=25;}
  if(continued){write('Fortsetzung',M,y,body,8,muted);y+=13;}y+=14;
 }
 function itemLines(d){
  const price=text(money(d.price));const priceWidth=body.widthOfTextAtSize(price,11);
  const name=wrap(d.name,bold,11.5,RIGHT-M-priceWidth-16).map((s,i)=>({s,font:bold,size:11.5,height:16,price:i===0?price:null}));
  const details=[d.serving,...(d.ingredients||[])].filter(Boolean).join(' · ');
  const detailLines=wrap(details,body,9.5,RIGHT-M).map(s=>({s,font:body,size:9.5,height:13}));
  if(!d.active)detailLines.push({s:'Derzeit nicht verfügbar',font:body,size:9,height:13});
  return [...name,...detailLines];
 }
 newPage();
 for(const {category,drinks}of groups){
  const headingHeight=wrap(category.name,serif,21,RIGHT-M).length*25+14;
  const firstHeight=Math.min(110,itemLines(drinks[0]).reduce((a,l)=>a+l.height,0)+17);
  if(y+headingHeight+firstHeight>H-BOTTOM)newPage();
  heading(category);
  for(const drink of drinks){
   const lines=itemLines(drink),height=lines.reduce((a,l)=>a+l.height,0)+17;
   if(y+height>H-BOTTOM&&y>103+headingHeight){newPage();heading(category,true);}
   for(const line of lines){
    if(y+line.height>H-BOTTOM){newPage();heading(category,true);}
    write(line.s,M,y,line.font,line.size,line.font===bold?white:muted);
    if(line.price)write(line.price,RIGHT-body.widthOfTextAtSize(line.price,11),y,body,11,gold);
    y+=line.height;
   }
   y+=7;page.drawLine({start:{x:M,y:H-y},end:{x:RIGHT,y:H-y},thickness:.25,color:rgb(.39,.29,.20)});y+=10;
  }y+=13;
 }
 const pages=pdf.getPages();
 for(let i=0;i<pages.length;i++){
  page=pages[i];write((draft?'ENTWURF · ':'')+'Stand '+stamp,M,H-34,body,7,muted);
  const number=(i+1)+' / '+pages.length;write(number,RIGHT-body.widthOfTextAtSize(number,7),H-34,body,7,muted);
 }
 pdf.setTitle(label+' - Barkarte A5'+(draft?' - Entwurf':''));pdf.setAuthor(label);pdf.setSubject('Kategorien, Getränke, Zutaten und Preise');pdf.setCreationDate(date);
 return {bytes:await pdf.save(),pages:pages.length,drinks:groups.reduce((n,g)=>n+g.drinks.length,0)};
}

export async function downloadMenuPDF(data,options){
 const result=await createMenuPDF(data,options);
 const url=URL.createObjectURL(new Blob([result.bytes],{type:'application/pdf'}));
 const a=document.createElement('a');a.href=url;a.download='First-Floor-Barkarte-A5'+(options?.draft?'-Entwurf':'')+'.pdf';document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);return result;
}

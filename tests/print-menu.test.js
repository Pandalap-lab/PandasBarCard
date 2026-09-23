import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PDFDocument} from 'pdf-lib';
import {createMenuPDF} from '../js/print-menu.js';
const source=JSON.parse(fs.readFileSync(new URL('../data/drinks.json',import.meta.url)));
test('A5 export preserves all entries without mutating the working document',async()=>{
 const before=JSON.stringify(source);const result=await createMenuPDF(source);
 assert.equal(result.drinks,130);assert.equal(JSON.stringify(source),before);
 const doc=await PDFDocument.load(result.bytes);assert.equal(doc.getPageCount(),result.pages);
 for(const p of doc.getPages()){assert.ok(Math.abs(p.getWidth()-419.5276)<.01);assert.ok(Math.abs(p.getHeight()-595.2756)<.01);}
});
test('print visibility and draft marking follow the chosen snapshot; long text paginates',async()=>{
 const d=structuredClone(source);d.drinks=d.drinks.slice(0,2);d.drinks[0].active=false;d.settings.unavailableMode='hide';
 d.drinks[1].ingredients=['Sehr lange Zutatenliste '.repeat(500)];
 const r=await createMenuPDF(d,{draft:true});assert.equal(r.drinks,1);assert.ok(r.pages>1);
 const pdf=await PDFDocument.load(r.bytes);assert.match(pdf.getTitle(),/Entwurf/);
 d.drinks[1].active=false;await assert.rejects(createMenuPDF(d),/Keine druckbaren/);
});

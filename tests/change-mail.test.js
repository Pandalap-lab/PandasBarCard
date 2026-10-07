import test from 'node:test';
import assert from 'node:assert/strict';
import {menuChanges,changeNotice} from '../supabase/functions/bar-admin/change-mail.js';
const base={categories:[{id:'c',name:'Cocktails',order:0}],drinks:[{id:'d',name:'Martini',price:15,ingredients:['Gin'],categoryId:'c',active:true,photo:'storage:'+'a'.repeat(64)+'.webp'}],settings:{unavailableMode:'show'}};
test('Mail explains edits, addition/removal, categories and settings with before/after values',()=>{
 const next=structuredClone(base);next.drinks[0].price=16.5;next.drinks[0].ingredients=['Gin','Olive'];next.drinks[0].active=false;next.categories[0].name='Klassiker';next.settings.unavailableMode='hide';
 next.drinks.push({id:'new',name:'Spritz',price:10});
 const text=menuChanges(base,next);assert.match(text,/Preis:.*15,00 → .*16,50/);assert.match(text,/Zutaten: Gin → Gin, Olive/);assert.match(text,/Verfügbar: Ja → Nein/);assert.match(text,/Name: Cocktails → Klassiker/);assert.match(text,/Eintrag: Nicht vorhanden → Hinzugefügt/);assert.match(text,/Anzeigen und kennzeichnen → Ausblenden/);
 assert.match(menuChanges(next,base),/Eintrag: Vorhanden → Entfernt/);
});
test('Publication metadata and public/private references are not content changes',()=>{
 const next=structuredClone(base);next.revision='new';next.drinks[0].photo='https://unit.supabase.co/storage/v1/object/public/bar-published/'+'a'.repeat(64)+'.webp';next.drinks[0].serving='';next.drinks[0].alcoholContent=null;
 assert.equal(menuChanges(base,next),'Keine inhaltlichen Änderungen.');
});
test('Notices identify the authenticated person and describe role/access changes without secrets',()=>{
 const text=changeNotice({actor:'uuid',email:'owner@example.com',event:'Berechtigung geändert',details:{target:'user@example.com',previous:{role:'editor',enabled:true},role:'viewer',enabled:false},at:new Date('2026-10-07T12:00:00Z')});
 assert.match(text,/Ausgeführt von: owner@example.com/);assert.match(text,/Bearbeiten → Nur lesen/);assert.match(text,/Freigegeben → Gesperrt/);assert.match(text,/14:00:00/);
});

const KEY='pandas-reading-v1',system=matchMedia('(prefers-reduced-motion: reduce)');
let prefs={size:'standard',contrast:false,motion:false};try{Object.assign(prefs,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch{}
export function reducedMotion(){return system.matches||prefs.motion===true;}
function apply(){document.documentElement.dataset.textSize=['standard','large','largest'].includes(prefs.size)?prefs.size:'standard';document.documentElement.classList.toggle('high-contrast',prefs.contrast===true);document.documentElement.classList.toggle('reduce-motion',reducedMotion());}
apply();system.addEventListener('change',apply);
const $=id=>document.getElementById(id),d=$('readingDialog');let closing=false;
function sync(){$('textSize').value=prefs.size;$('highContrast').checked=prefs.contrast;$('lessMotion').checked=prefs.motion;}
function save(){apply();try{localStorage.setItem(KEY,JSON.stringify(prefs));$('aaStatus').textContent='Auf diesem Gerät gespeichert.';}catch{$('aaStatus').textContent='Für diesen Besuch angewendet. Gerätespeicher nicht verfügbar.';}}
sync();$('aaButton').onclick=()=>{d.showModal();document.body.style.overflow='hidden';requestAnimationFrame(()=>d.classList.add('open'));$('aaClose').focus();};
function close(){if(closing)return;closing=true;d.classList.remove('open');setTimeout(()=>{d.close();document.body.style.overflow='';$('aaButton').focus();closing=false;},reducedMotion()?0:280);}
$('aaClose').onclick=close;d.addEventListener('cancel',e=>{e.preventDefault();close();});$('textSize').onchange=e=>{prefs.size=e.target.value;save();};$('highContrast').onchange=e=>{prefs.contrast=e.target.checked;save();};$('lessMotion').onchange=e=>{prefs.motion=e.target.checked;save();};$('aaReset').onclick=()=>{prefs={size:'standard',contrast:false,motion:false};sync();save();};

// One shared lock for load/save/publish. Restore existing role restrictions.
export function createActionRunner({buttons,regions=[],status,vibrate=()=>globalThis.navigator?.vibrate?.(15)}){
 let busy=false;
 const run=async(label,action)=>{
  if(busy)return;
  busy=true;
  const states=buttons.map(button=>[button,button.disabled,button.textContent]);
  const regionStates=regions.map(region=>[region,region.inert]);
  for(const [button] of states){button.disabled=true;button.setAttribute('aria-busy','true');}
  for(const [region] of regionStates)region.inert=true;
  const primary=buttons.find(button=>button===globalThis.document?.activeElement)||buttons[0];
  if(primary)primary.textContent=label;
  status.textContent=label;
  try{try{vibrate();}catch{/* Optional device feedback. */}return await action();}
  catch(error){status.textContent=error.message||'Vorgang nicht bestätigt. Bitte Serverstand prüfen.';}
  finally{
   for(const [button,disabled,text] of states){button.disabled=disabled;button.textContent=text;button.removeAttribute('aria-busy');}
   for(const [region,inert] of regionStates)region.inert=inert;
   busy=false;
  }
 };
 Object.defineProperty(run,'busy',{get:()=>busy});return run;
}

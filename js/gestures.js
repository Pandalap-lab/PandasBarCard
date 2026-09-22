// Direction lock keeps diagonal/horizontal gestures from changing categories.
export function gestureAxis(dx,dy){
 if(Math.max(Math.abs(dx),Math.abs(dy))<12)return null;
 return Math.abs(dy)>Math.abs(dx)*1.35?'vertical':'horizontal';
}
export function categoryStep(axis,dy){return axis==='vertical'&&Math.abs(dy)>=60?(dy<0?1:-1):0;}

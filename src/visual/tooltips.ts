export interface Tip { title:string;what:string;now:string;next?:string }
const tips=new Map<string,Tip>();
export function setTip(id:string,tip:Tip){tips.set(id,tip);}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export class EducationalTooltips {
 private popup:HTMLDivElement;private anchor:HTMLElement|null=null;private pinned=false;private updatedAt=0;private timer=0;private dismissed:HTMLElement|null=null;
 private hoverTimer=0;private hoverTarget:HTMLElement|null=null;private pointer:{x:number;y:number}|null=null;
 constructor(){
  this.popup=document.createElement('div');this.popup.id='educational-tooltip';this.popup.className='educational-tooltip';this.popup.role='tooltip';this.popup.hidden=true;document.body.append(this.popup);
  const target=(event:Event)=>(event.target as Element)?.closest<HTMLElement>('[data-tip]');
  // Live text/layout updates can synthesize pointerover beneath a stationary
  // cursor. Require actual pointer movement and a short dwell before explaining.
  document.addEventListener('pointermove',e=>{
   if(e.pointerType==='touch'||this.pointer?.x===e.clientX&&this.pointer?.y===e.clientY)return;
   this.pointer={x:e.clientX,y:e.clientY};
   const a=target(e);
   if(this.popup.contains(e.target as Node)){clearTimeout(this.timer);return;}
   if(a!==this.hoverTarget){this.cancelHover();this.hoverTarget=a;}
   if(!a||a===this.dismissed||this.pinned)return;
   clearTimeout(this.timer);
   if(a===this.anchor||this.hoverTimer)return;
   const box=a.getBoundingClientRect();
   this.hoverTimer=window.setTimeout(()=>{
    this.hoverTimer=0;
    const current=a.getBoundingClientRect();
    if(a.isConnected&&a.matches(':hover')&&Math.abs(current.x-box.x)<1&&Math.abs(current.y-box.y)<1&&!this.pinned&&a!==this.dismissed)this.show(a);
   },250);
  });
  document.addEventListener('pointerout',e=>{const a=target(e);if(a&&!a.contains(e.relatedTarget as Node)){this.cancelHover();if(a===this.dismissed)this.dismissed=null;}if(this.pinned)return;if(a||this.popup.contains(e.target as Node)){clearTimeout(this.timer);this.timer=window.setTimeout(()=>{if(!this.popup.matches(':hover')&&!this.anchor?.matches(':hover')&&document.activeElement!==this.anchor)this.hide();},180);}});
  document.addEventListener('focusin',e=>{const a=target(e);if(a){this.dismissed=null;this.show(a);}else if(!this.pinned)this.hide();});
  document.addEventListener('focusout',()=>{if(!this.pinned){clearTimeout(this.timer);this.timer=window.setTimeout(()=>{if(document.activeElement!==this.anchor&&!this.popup.matches(':hover'))this.hide();},180);}});
  document.addEventListener('click',e=>{const a=target(e);if(a){if(this.pinned&&a===this.anchor)this.hide();else{this.show(a);this.pinned=true;}}else if(!this.popup.contains(e.target as Node))this.hide();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!this.popup.hidden){e.preventDefault();e.stopImmediatePropagation();this.dismissed=this.anchor;this.hide();}},true);
  document.addEventListener('scroll',()=>this.place(),true);window.addEventListener('resize',()=>this.place());
 }
 private cancelHover(){clearTimeout(this.hoverTimer);this.hoverTimer=0;this.hoverTarget=null;}
 private show(a:HTMLElement){if(!tips.has(a.dataset.tip!))return;this.cancelHover();clearTimeout(this.timer);this.anchor?.removeAttribute('aria-describedby');this.anchor=a;const parent=a.closest('dialog[open]')||document.body;if(this.popup.parentElement!==parent)parent.append(this.popup);a.setAttribute('aria-describedby',this.popup.id);this.popup.hidden=false;this.refresh(true);}
 refresh(force=false){if(!this.anchor||this.popup.hidden)return;if(!this.anchor.isConnected||!this.anchor.getClientRects().length){this.hide();return;}if(!force&&performance.now()-this.updatedAt<800){this.place();return;}this.updatedAt=performance.now();const tip=tips.get(this.anchor.dataset.tip!);if(!tip){this.hide();return;}const content=`<strong>${esc(tip.title)}</strong><p>${esc(tip.what)}</p><div>${esc(tip.now)}</div>${tip.next?`<p class="tip-direction">${esc(tip.next)}</p>`:''}`;if(this.popup.innerHTML!==content)this.popup.innerHTML=content;this.place();}
 private place(){if(!this.anchor||this.popup.hidden)return;const a=this.anchor.getBoundingClientRect();this.popup.style.maxWidth=`${Math.min(285,innerWidth-24)}px`;const w=this.popup.offsetWidth,h=this.popup.offsetHeight;let x=a.left-w-14;if(x<12)x=a.right+14;if(x+w>innerWidth-12)x=Math.max(12,Math.min(a.left,innerWidth-w-12));let y=Math.max(12,Math.min(a.top,innerHeight-h-12));if(x<a.right&&x+w>a.left)y=a.bottom+h+12<innerHeight?a.bottom+10:Math.max(12,a.top-h-10);this.popup.style.left=`${x}px`;this.popup.style.top=`${y}px`;}
 hide(){this.cancelHover();this.anchor?.removeAttribute('aria-describedby');this.anchor=null;this.pinned=false;this.popup.hidden=true;clearTimeout(this.timer);}
}
export const metricDefinitions:Record<string,string>={
 aerobic:'A relative teaching index of circulatory support derived from modeled heart rate. It is not a measured share of energy supplied aerobically, VO₂ or blood oxygen saturation.',
 glycolytic:'The share of current ATP regeneration supplied by glycolysis. It supports rapid effort and becomes a smaller share during walking recovery.',
 bodyfat:'Fat tissue as a proportion of total body mass. Its change is shown in percentage points; absolute fat change is shown in kilograms above.',
 glucose:'Glucose circulating in blood and available to tissues. The curve is a relative response, not a blood-test reading.',
 insulin:'A hormone signal that helps tissues take up nutrients and coordinates energy storage. It is not an energy store.',
 liver:'Carbohydrate stored in the liver. It helps maintain circulating glucose between meals and overnight.',
 muscle:'Carbohydrate stored inside skeletal muscle. It supplies exercise locally and refills from dietary carbohydrate.',
 fat:'How strongly stored fat is being mobilized in this model. It is not a measure of fat loss or grams burned.',
 recovery:'An illustrative recovery indicator based on activity, time and food energy/protein support. It cannot tell whether you are ready to train.',
 power:'The sprint power currently available relative to a fresh effort. During a walk it shows capacity, not power being produced.',
 pcr:'Phosphocreatine rapidly regenerates ATP during explosive effort. It falls during sprints and restores partly during recovery.',
 glycogen:'Carbohydrate available in the modeled working-muscle pool. Starting availability comes from the selected diet day.',
 fatigue:'A combined teaching indicator of fast muscle stress and slower fatigue. A brief walk does not fully reset it.',
 oxygen:'A relative indicator of oxygen delivery and oxidative support. It is not blood oxygen saturation or a VO₂ measurement.',
 atp:'The immediate energy carrier used by cells. PCr, glycolysis and aerobic metabolism continually regenerate it.',
 lean:'Body mass excluding fat: muscle, organs, bone and water. Resistance training can gradually increase part of it.',
 mass:'Total body mass: lean tissue plus fat. The difference is measured against this scenario’s initial body mass.',
 fatmass:'Fat tissue stores energy mainly as triglycerides. The model changes it gradually through repeated energy balance.',
 conditioning:'Additional modeled conditioning relative to the starting person, not an absolute fitness score.',
 hr:'Heartbeats per minute. The model increases circulation with activity and lowers it during rest and sleep.'
};

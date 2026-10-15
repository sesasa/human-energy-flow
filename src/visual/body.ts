import { type DayState } from '../model/day';
import type { CaffeineState } from '../model/caffeine';
import { type AdaptationState, muscleResponse } from '../model/longTerm';
import { type SprintState } from '../model/sprint';
import { anatomyLabel, anatomyMarkup, nutrientRoutes } from './anatomy';
import { defaultScenario, type Scenario } from '../model/config';
import { bodyShape } from './bodyShape';
export class BodyView {
  private svg:SVGSVGElement;private paths:SVGPathElement[];private lengths:number[];
  private particles:SVGGraphicsElement[];private muscles:SVGGElement[];
  private reduced=matchMedia('(prefers-reduced-motion: reduce)');
  private shapeKey='';private definition=1;private sex:Scenario['person']['sex']=defaultScenario.person.sex;
  view:'front'|'back'='front';
  constructor(host:HTMLElement){
    host.innerHTML=anatomyMarkup(this.sex);this.svg=host.querySelector('svg')!;
    this.paths=nutrientRoutes.map(r=>this.svg.querySelector(`#route-${r.id}`)!);this.lengths=this.paths.map(p=>p.getTotalLength());
    this.particles=[...this.svg.querySelectorAll<SVGGraphicsElement>('.particle')];this.muscles=[...this.svg.querySelectorAll<SVGGElement>('[data-muscle]')];
  }
  setView(view:'front'|'back'){this.view=view;this.svg.classList.toggle('posterior',view==='back');this.svg.querySelector('#anatomy-view-label')!.textContent=`${view==='front'?'ANTERIOR':'POSTERIOR'} · EDUCATIONAL ANATOMY`;this.svg.setAttribute('aria-label',anatomyLabel(this.sex,view));}
  update(s:DayState,long:AdaptationState|null,seconds:number,layer:string,sprint:SprintState|null=null,focus='all',person:Scenario['person']=defaultScenario.person,dayLeanGain=0,caffeine:CaffeineState|null=null){
    const mass=long?.weight??person.weight_kg,fat=long?.fat??mass*person.body_fat_fraction;
    const key=`${person.sex}:${person.height_cm}:${mass.toFixed(3)}:${fat.toFixed(3)}`;
    if(key!==this.shapeKey){
      const shape=bodyShape(person,mass,fat);this.shapeKey=key;this.definition=shape.definition;
      if(person.sex!==this.sex){this.sex=person.sex;this.svg.dataset.sex=person.sex;this.svg.setAttribute('aria-label',anatomyLabel(person.sex,this.view));}
      this.svg.querySelector('#body-outline')!.setAttribute('d',shape.outline);
      this.svg.querySelector('#body-clip path')!.setAttribute('d',shape.outline);
      // Soft tissue is the band between the current envelope and the same-sex lean outline.
      this.svg.querySelector('#body-soft-tissue')!.setAttribute('d',shape.fatSignal>0?`${shape.outline} ${shape.baseOutline}`:'');
      this.svg.querySelector('#body-tissues')!.setAttribute('transform',`translate(310 0) scale(${shape.leanWidth} 1) translate(-310 0)`);
      this.svg.dataset.leanWidth=shape.leanWidth.toFixed(3);this.svg.dataset.fatFraction=(fat/mass).toFixed(3);
    }
    const work=sprint?sprint.phase==='sprint':s.exercisePower>0;
    const recovery=sprint?['walk','cooldown','after'].includes(sprint.phase):['recovery','sleep'].includes(s.activity);
    const intense=!!sprint&&['warmup','sprint','walk','cooldown'].includes(sprint.phase);
    this.svg.style.setProperty('--pulse-speed',`${60/(long?long.restingHR:s.hr)}s`);
    this.svg.style.setProperty('--flow-speed',`${intense?1.5-(sprint?.oxygen||0):work?.8:2.8}s`);
    this.svg.classList.toggle('exercising',work);this.svg.classList.toggle('recovering',recovery);this.svg.classList.toggle('intense-anatomy',intense);
    const opacity=(id:string,value:number)=>this.svg.querySelector(id)!.setAttribute('opacity',String(value));
    opacity('#circulation',layer==='all'||layer==='blood'?intense||focus==='blood'?.95:.72:.2);
    opacity('#viscera',layer==='muscle'?.35:intense?.55:layer==='blood'?.55:1);
    opacity('#organ-lungs',layer==='muscle'?.24:intense?.9:.75);
    opacity('#liver-storage',.15+s.liver/s.liverCapacity*.5);
    opacity('#organ-brain',focus==='brain'?1:.78);
    opacity('#insulin-signals',(layer==='all'||layer==='insulin'?1:.1)*s.insulin*.55*(intense?.3:1));
    this.svg.querySelector('#insulin-ring')!.setAttribute('rx',String(26+s.insulin*12));
    const lower=['quadriceps','hamstrings','gluteals','calves','tibialis','adductors'];
    const activeNames=sprint||s.activity==='run'?lower:['chest','shoulders','triceps','core'];
    this.muscles.forEach(g=>{
      const name=g.dataset.muscle!,active=work&&activeNames.includes(name),recovering=intense&&recovery&&lower.includes(name);
      // Muscle lightness encodes PCr availability only in sprint mode; activity is conveyed by outline.
      const pcr=sprint?.pcr??1;
      g.style.setProperty('--muscle-color',intense&&lower.includes(name)?`hsl(24 33% ${25+pcr*30}%)`:'url(#muscle-tissue)');
      g.classList.toggle('active-muscle',active);g.classList.toggle('recovery-muscle',recovering);
      const visible=layer==='muscle'||intense&&lower.includes(name)? .95:focus==='muscle'?.7:layer==='blood'?.25:layer==='nutrients'||focus==='digestion'?.3:.38;
      g.style.opacity=String(visible*(intense||layer==='muscle'?1:this.definition));
      const scale=1+(long?.leanGain??dayLeanGain)*.009*(muscleResponse[name]||.35);
      g.style.transformOrigin='310px 350px';g.style.transform=`scaleX(${scale})`;
    });
    opacity('#nutrient-routes',intense?.12:layer==='all'||layer==='nutrients'?.85:.12);
    this.svg.dataset.caffeineMg=(caffeine?.bodyMg??0).toFixed(2);
    opacity('#caffeine-signals',caffeine&&caffeine.bodyMg>.01?1:0);
    if(caffeine){
      const effect=caffeine.alerting;
      opacity('#caffeine-brain',effect*.85);
      opacity('#caffeine-liver',effect*.45);
      const absorbing=caffeine.gutMg>.5&&caffeine.bodyMg>.01;
      opacity('#caffeine-route',absorbing?.65:0);
      const route=this.svg.querySelector<SVGPathElement>('#caffeine-route')!,length=route.getTotalLength();
      this.svg.querySelectorAll<SVGPathElement>('.caffeine-particle').forEach((particle,i)=>{
        const point=route.getPointAtLength(((seconds/7+i/3)%1)*length);
        particle.setAttribute('transform',`translate(${point.x} ${point.y})`);
        particle.setAttribute('opacity',absorbing&&!this.reduced.matches?'.9':'0');
      });
    }
    this.particles.forEach(p=>{
      const j=Number(p.dataset.route),kind=nutrientRoutes[j].kind,f=(seconds/(kind==='fat'?9:5)+Number(p.dataset.offset))%1;
      const point=this.paths[j].getPointAtLength(f*this.lengths[j]);p.setAttribute('transform',`translate(${point.x} ${point.y}) scale(2)`);
      const signal=j===9?s.fatMobilization:kind==='amino'?s.amino:kind==='fat'?s.dietaryFat:s.glucose;
      const visible=(layer==='all'||layer==='nutrients')&&!intense;
      p.setAttribute('opacity',String(this.reduced.matches?0:visible?(j===2?.55:.12+signal*.8):0));
    });
  }
}

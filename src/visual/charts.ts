import { type DaySimulation } from '../model/day';
import { sampleLongTerm, type AdaptationState } from '../model/longTerm';
export function dayChart(day: DaySimulation) {
  const line = (key:'glucose'|'insulin') => day.states.filter((_,i)=>i%12===0).map(s=>`${s.minute/1440*300},${82-s[key]*70}`).join(' ');
  return `<svg viewBox="0 0 300 104" class="trace" role="img" aria-label="Glucose and insulin relative activity over 24 hours"><path d="M0 82H300M0 45H300M0 8H300" stroke="#78988b" stroke-opacity=".16"/><polyline points="${line('glucose')}" fill="none" stroke="#eab467" stroke-width="1.7"/><polyline points="${line('insulin')}" fill="none" stroke="#b6a0e3" stroke-width="1.7"/><path id="trace-cursor" d="M0 0V85" stroke="#eef3da" stroke-opacity=".6" stroke-dasharray="3 3"/><g font-size="9" font-family="monospace" fill="#728b7f"><text x="0" y="100">06</text><text x="70" y="100">12</text><text x="145" y="100">18</text><text x="219" y="100">00</text><text x="285" y="100">06</text></g></svg>`;
}
export function longChart(states: AdaptationState[]) {
  const deltas=states.flatMap(s=>[s.lean-states[0].lean,s.fat-states[0].fat]);
  const low=Math.min(-.5,...deltas),high=Math.max(.5,...deltas),span=high-low;
  const y=(delta:number)=>85-(delta-low)/span*75;
  const point=(s:AdaptationState,key:'lean'|'fat')=>`${s.day/1095*300},${y(s[key]-states[0][key])}`;
  const line=(key:'lean'|'fat')=>states.filter((_,i)=>i%7===0||i===1095).map(s=>point(s,key)).join(' ');
  return `<svg viewBox="0 0 300 112" class="trace" role="img" aria-label="Illustrative lean and fat mass change over three years"><path d="M0 ${y(0)}H300" stroke="#78988b" stroke-opacity=".2"/><polyline points="${line('lean')}" fill="none" stroke="#9ec9a2" stroke-width="2"/><polyline points="${line('fat')}" fill="none" stroke="#d1bc8d" stroke-width="2"/><path id="trace-cursor" d="M0 5V95" stroke="#eef3da" stroke-opacity=".6" stroke-dasharray="3 3"/><g font-size="9" font-family="monospace" fill="#728b7f"><text x="2" y="8">+${high.toFixed(1)} kg</text><text x="2" y="96">${low.toFixed(1)} kg</text><text x="0" y="109">NOW</text><text x="90" y="109">YEAR 1</text><text x="190" y="109">YEAR 2</text><text x="260" y="109">YEAR 3</text></g></svg>`;
}

// Interactive long-term composition chart. It is a native slider over the SAME timeline position used by playback:
// the chart only reports requested days through onSeek and draws whatever position main.ts renders.
export type CompositionMetric='mass'|'lean'|'fatmass'|'bodyfat';
const NS='http://www.w3.org/2000/svg';
const COMPOSITION:Record<CompositionMetric,{button:string;label:string;axis:string;unit:string;delta:string;color:string;value:(s:AdaptationState)=>number}>={
  mass:{button:'Body mass',label:'Body mass',axis:'BODY MASS · kg',unit:'kg',delta:'kg',color:'#c4cfa2',value:s=>s.weight},
  lean:{button:'Lean mass',label:'Lean (fat-free) mass',axis:'LEAN MASS · kg',unit:'kg',delta:'kg',color:'#9ec9a2',value:s=>s.lean},
  fatmass:{button:'Fat mass',label:'Fat mass',axis:'FAT MASS · kg',unit:'kg',delta:'kg',color:'#d1bc8d',value:s=>s.fat},
  bodyfat:{button:'Body fat %',label:'Body fat',axis:'BODY FAT · % of body mass',unit:'%',delta:'points',color:'#d7a98a',value:s=>s.fat/s.weight*100}
};
// Shared plot geometry: pointer mapping and drawing use the same constants.
const VW=320,VH=158,PL=38,PR=12,PT=18,PB=24,W=VW-PL-PR,H=VH-PT-PB;
const signedValue=(n:number)=>`${n>=0?'+':'−'}${Math.abs(n).toFixed(1)}`;
function node<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>,parent:Element){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.appendChild(n);return n;}
interface Series {line:string;area:string;lo:number;hi:number;start:number}
export class CompositionChart {
  readonly element:HTMLDivElement;
  private slider:HTMLDivElement;private svg:SVGSVGElement;private line:SVGPathElement;private area:SVGPathElement;private base:SVGPathElement;
  private ticks:SVGTextElement[]=[];private axis:SVGTextElement;private cursor:SVGGElement;private knob:SVGCircleElement;private halo:SVGCircleElement;private tag:SVGTextElement;
  private states:AdaptationState[]=[];private cache=new Map<CompositionMetric,Series>();private metric:CompositionMetric='mass';
  private position=0;private days=1095;private drawn='';private pending:number|null=null;private raf=0;private dragging=false;
  constructor(private onSeek:(day:number)=>void,private onMetric?:(metric:CompositionMetric)=>void){
    this.element=document.createElement('div');this.element.className='composition';
    this.element.innerHTML=`<div class="chart-metrics" role="group" aria-label="Composition measure">${(Object.keys(COMPOSITION) as CompositionMetric[]).map(m=>`<button type="button" data-chart-metric="${m}" aria-pressed="${m===this.metric}">${COMPOSITION[m].button}</button>`).join('')}</div><div id="composition-chart" class="composition-chart" role="slider" tabindex="0" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="1095" aria-valuenow="0"></div><small class="chart-cue"><i aria-hidden="true">⟷</i> Drag or click the chart · ← → one day · Shift one week</small>`;
    this.slider=this.element.querySelector<HTMLDivElement>('#composition-chart')!;
    this.svg=document.createElementNS(NS,'svg');this.svg.setAttribute('viewBox',`0 0 ${VW} ${VH}`);this.svg.setAttribute('class','composition-svg');this.svg.setAttribute('aria-hidden','true');this.slider.appendChild(this.svg);
    const grid=node('g',{stroke:'#78988b','stroke-opacity':.16},this.svg);
    for(let i=0;i<3;i++)node('path',{d:`M${PL} ${PT+H*i/2}H${PL+W}`},grid);
    for(const d of [365,730])node('path',{d:`M${PL+d/1095*W} ${PT}V${PT+H}`,'stroke-dasharray':'2 4'},grid);
    node('path',{d:`M${PL} ${PT+H}H${PL+W}`,stroke:'#78988b','stroke-opacity':.45},this.svg);
    const labels=node('g',{'font-size':8,'font-family':'monospace',fill:'#82997f'},this.svg);
    for(let i=0;i<3;i++)this.ticks.push(node('text',{x:PL-5,y:PT+H*i/2+3,'text-anchor':'end'},labels));
    for(const [d,text]of [[0,'START'],[365,'YEAR 1'],[730,'YEAR 2'],[1095,'YEAR 3']] as [number,string][])node('text',{x:PL+d/1095*W,y:VH-8,'text-anchor':d===0?'start':d===1095?'end':'middle'},labels).textContent=text;
    this.axis=node('text',{x:PL,y:PT-7,'font-size':7.5,'letter-spacing':.6,'font-family':'DM Sans, system-ui',fill:'#a5b991'},this.svg);
    this.base=node('path',{stroke:'#eef3da','stroke-opacity':.3,'stroke-dasharray':'3 3'},this.svg);
    this.area=node('path',{opacity:.13},this.svg);
    this.line=node('path',{fill:'none','stroke-width':2,'stroke-linejoin':'round'},this.svg);
    this.cursor=node('g',{id:'trace-cursor'},this.svg);
    node('path',{d:`M0 ${PT}V${PT+H}`,stroke:'#eef3da','stroke-opacity':.55,'stroke-dasharray':'3 3'},this.cursor);
    this.halo=node('circle',{r:8.5,fill:'#eef3da',opacity:.14,class:'chart-halo'},this.cursor);
    this.knob=node('circle',{r:4.2,stroke:'#f2f5e4','stroke-width':1.4,class:'chart-knob'},this.cursor);
    this.tag=node('text',{'font-size':8.5,'font-family':'Manrope, system-ui','font-weight':600,fill:'#eef3da'},this.cursor);
    for(const b of this.element.querySelectorAll<HTMLButtonElement>('[data-chart-metric]'))b.onclick=()=>this.setMetric(b.dataset.chartMetric as CompositionMetric);
    this.slider.addEventListener('pointerdown',e=>{
      if(e.button>0)return;e.preventDefault();this.slider.focus({preventScroll:true});
      this.slider.setPointerCapture(e.pointerId);this.dragging=true;this.slider.classList.add('dragging');this.onSeek(this.dayAt(e));
    });
    this.slider.addEventListener('pointermove',e=>{if(this.dragging&&this.slider.hasPointerCapture(e.pointerId))this.queue(this.dayAt(e));});
    const end=(e:PointerEvent)=>{if(!this.dragging)return;this.dragging=false;this.slider.classList.remove('dragging');if(this.slider.hasPointerCapture(e.pointerId))this.slider.releasePointerCapture(e.pointerId);this.flush();};
    for(const type of ['pointerup','pointercancel','lostpointercapture'] as const)this.slider.addEventListener(type,end);
    this.slider.addEventListener('keydown',e=>{
      const step=e.shiftKey?7:1,keys:Record<string,number>={ArrowRight:this.position+step,ArrowUp:this.position+step,ArrowLeft:this.position-step,ArrowDown:this.position-step,PageUp:this.position+30,PageDown:this.position-30,Home:0,End:this.days};
      if(!(e.key in keys))return;e.preventDefault();this.onSeek(Math.min(this.days,Math.max(0,keys[e.key])));
    });
  }
  get selected(){return this.metric;}
  setStates(states:AdaptationState[]){if(states===this.states)return;this.states=states;this.days=states.at(-1)?.day??1095;this.cache.clear();this.drawn='';this.slider.setAttribute('aria-valuemax',String(this.days));}
  setMetric(metric:CompositionMetric){
    if(metric===this.metric)return;this.metric=metric;
    for(const b of this.element.querySelectorAll<HTMLButtonElement>('[data-chart-metric]'))b.setAttribute('aria-pressed',String(b.dataset.chartMetric===metric));
    this.update(this.position);this.onMetric?.(metric);
  }
  private series():Series{
    let s=this.cache.get(this.metric);if(s)return s;
    const value=COMPOSITION[this.metric].value,values=this.states.map(value),min=Math.min(...values),max=Math.max(...values);
    const pad=Math.max((max-min)*.14,.5),lo=min-pad,hi=max+pad;
    const pts=this.states.filter((_,i)=>i%3===0||i===this.states.length-1).map(st=>`${(PL+st.day/this.days*W).toFixed(1)},${this.y(value(st),lo,hi).toFixed(1)}`);
    s={line:`M${pts.join('L')}`,area:`M${PL},${PT+H}L${pts.join('L')}L${PL+W},${PT+H}Z`,lo,hi,start:values[0]};
    this.cache.set(this.metric,s);return s;
  }
  private y(v:number,lo:number,hi:number){return PT+H-(v-lo)/(hi-lo)*H;}
  private dayAt(e:PointerEvent){
    // Map screen pixels into viewBox units, so padding and aspect-ratio letterboxing are respected.
    const ctm=this.svg.getScreenCTM();if(!ctm)return this.position;
    const p=this.svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const local=p.matrixTransform(ctm.inverse());
    return Math.min(this.days,Math.max(0,(local.x-PL)/W*this.days));
  }
  private queue(day:number){this.pending=day;if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;this.flush();});}
  private flush(){if(this.pending===null)return;const day=this.pending;this.pending=null;this.onSeek(day);}
  update(position:number){
    if(!this.states.length)return;
    const m=COMPOSITION[this.metric],s=this.series(),key=`${this.metric}`;
    if(this.drawn!==key){
      this.drawn=key;this.line.setAttribute('d',s.line);this.line.setAttribute('stroke',m.color);this.area.setAttribute('d',s.area);this.area.setAttribute('fill',m.color);
      const by=this.y(s.start,s.lo,s.hi);this.base.setAttribute('d',`M${PL} ${by.toFixed(1)}H${PL+W}`);this.knob.setAttribute('fill',m.color);
      this.ticks.forEach((t,i)=>t.textContent=(s.hi-(s.hi-s.lo)*i/2).toFixed(1));this.axis.textContent=m.axis;
      this.slider.setAttribute('aria-label',`Over-time position · ${m.label} chart`);
    }
    this.position=Math.min(this.days,Math.max(0,position));
    const st=sampleLongTerm(this.states,this.position),v=m.value(st),x=PL+this.position/this.days*W,y=this.y(v,s.lo,s.hi);
    this.cursor.setAttribute('transform',`translate(${x.toFixed(2)} 0)`);
    this.knob.setAttribute('cy',y.toFixed(2));this.halo.setAttribute('cy',y.toFixed(2));
    const right=x>PL+W-58;this.tag.setAttribute('text-anchor',right?'end':'start');this.tag.setAttribute('x',right?'-8':'8');this.tag.setAttribute('y',Math.max(PT+8,Math.min(PT+H-4,y-6)).toFixed(1));
    this.tag.textContent=`${v.toFixed(1)}${m.unit==='%'?'%':' kg'}`;
    const day=Math.min(this.days,Math.floor(this.position)+1);
    this.slider.setAttribute('aria-valuenow',String(Math.round(this.position)));
    this.slider.setAttribute('aria-valuetext',`Day ${day.toLocaleString('en')} of ${this.days.toLocaleString('en')}, month ${(this.position/365*12).toFixed(1)}: ${m.label} ${v.toFixed(1)} ${m.unit}, ${signedValue(v-s.start)} ${m.delta} vs start`);
  }
}

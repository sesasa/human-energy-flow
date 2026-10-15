// Reusable, model-agnostic time-series card. Paths are drawn once from an immutable spec;
// update() only moves the cursor and rewrites legend text. One native pointer/keyboard slider
// per card reports a requested master-timeline position through onSeek; the card never seeks itself.
export type SystemId = 'guided'|'cardiovascular'|'metabolism'|'muscular'|'digestion'|'brain'|'micronutrients';
export interface PlotPoint { x:number; y:number|null; low?:number|null; high?:number|null }
export interface PlotReadout { value:string; detail?:string; change?:string }
export interface PlotSeries {
  id:string; label:string; color:string; points:PlotPoint[]; dash?:string;
  format?:(value:number)=>string;
  readout?:(x:number)=>PlotReadout;
  tip?:string;
  /** Exact model value at x for the cursor dot; defaults to interpolating points (null if either neighbour is null). */
  sample?:(x:number)=>number|null;
}
export interface PlotSpec {
  id:string; title:string; unit:string; domain:[number,number]; xDomain:[number,number];
  xTicks:{x:number;label:string}[]; series:PlotSeries[]; systems:SystemId[]; note?:string;
  bands?:{start:number;end:number;color?:string;label?:string;tick?:boolean}[]; // tick: short solid mark on the x axis instead of full-height shading
  reference?:{low?:number;high?:number};
  observed?:{x:number;y:number};
  toTimeline?:(x:number)=>number; fromTimeline?:(t:number)=>number;
  /** Optional extras. */
  xLabel?:string; yTicks?:number[]; formatY?:(value:number)=>string; formatX?:(x:number)=>string;
  step?:number; pageStep?:number; referenceLabel?:string;
  limits?:{y:number;label?:string;color?:string}[];
}

const NS='http://www.w3.org/2000/svg';
// Plot area in viewBox units. The SVG stretches (preserveAspectRatio="none"), so every stroke is
// non-scaling and all text is HTML: labels stay readable at any card width.
const VW=1000,VH=100;
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
function svg<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,string|number>,parent:Element){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));parent.appendChild(n);return n;}
function html<K extends keyof HTMLElementTagNameMap>(tag:K,cls:string,parent?:Element,text?:string){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.appendChild(n);return n;}
const setText=(el:Element,text:string)=>{if(el.textContent!==text)el.textContent=text;};
const fixed=(n:number)=>n.toFixed(1);
const defaultFormat=(v:number)=>Math.abs(v)>=10?String(Math.round(v)):String(Math.round(v*10)/10);

/** Linear interpolation over x-sorted points. A null neighbour yields null: gaps are never bridged. */
export function interpolate(points:PlotPoint[],x:number):number|null {
  if(!points.length||x<points[0].x||x>points.at(-1)!.x)return null;
  let lo=0,hi=points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].x<=x)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi];
  if(a.x===x)return a.y;if(b.x===x)return b.y;
  if(a.y===null||b.y===null)return null;
  return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);
}
/** Path data in viewBox units; a null y (or a null bound) starts a new subpath. */
export function linePath(points:PlotPoint[],X:(x:number)=>number,Y:(y:number)=>number):string {
  let d='',open=false;
  for(const p of points){if(p.y===null){open=false;continue;}d+=`${open?'L':'M'}${fixed(X(p.x))} ${fixed(Y(p.y))}`;open=true;}
  return d;
}
export function bandPath(points:PlotPoint[],X:(x:number)=>number,Y:(y:number)=>number):string {
  let d='',run:PlotPoint[]=[];
  const flush=()=>{if(run.length>1)d+=`M${run.map(p=>`${fixed(X(p.x))} ${fixed(Y(p.high!))}`).join('L')}L${[...run].reverse().map(p=>`${fixed(X(p.x))} ${fixed(Y(p.low!))}`).join('L')}Z`;run=[];};
  for(const p of points){if(p.y===null||p.low===null||p.low===undefined||p.high===null||p.high===undefined)flush();else run.push(p);}
  flush();return d;
}

export class PlotCard {
  readonly element:HTMLElement;
  readonly spec:PlotSpec;
  private area:HTMLDivElement;private cursor:SVGGElement;private dots=new Map<string,SVGPathElement>();
  private rows=new Map<string,{row:HTMLElement;value:HTMLElement;note:HTMLElement;change:HTMLElement}>();
  private paths=new Map<string,SVGPathElement[]>();
  private x:number;private dragging=false;private keyboardFocus=false;private pending:number|null=null;private raf=0;private last='';
  private X:(x:number)=>number;private Y:(y:number)=>number;
  constructor(spec:PlotSpec,private onSeek:(timeline:number)=>void,namespace=''){
    this.spec=spec;const [x0,x1]=spec.xDomain,[lo,hi]=spec.domain;
    this.X=x=>(x-x0)/(x1-x0)*VW;this.Y=y=>VH-(clamp(y,lo-(hi-lo)*.02,hi+(hi-lo)*.02)-lo)/(hi-lo)*VH;
    this.x=x0;
    const root=this.element=html('section','plot-card');
    root.id=`${namespace}plot-${spec.id}`;root.dataset.plot=spec.id;root.dataset.systems=spec.systems.join(' ');
    const head=html('header','plot-head',root);
    html('h3','plot-title',head,spec.title);html('span','plot-unit',head,spec.unit);
    // Current readings: HTML, focusable tooltip targets. Not a live region; the slider carries value text.
    const legend=html('div','plot-readout',root);
    for(const s of spec.series){
      const row=html('div','plot-row',legend);row.id=`${namespace}row-${s.id}`;row.tabIndex=0;row.dataset.tip=`metric-${s.id}`;row.dataset.legend=s.id;
      row.style.setProperty('--series-color',s.color);
      const key=html('i',`plot-key${s.dash?' dashed':''}`,row);key.setAttribute('aria-hidden','true');
      html('span','plot-label',row,s.label);
      const value=html('strong','plot-value',row);value.id=`${namespace}${s.id}-value`;
      const note=html('small','plot-detail',row);note.id=`${namespace}${s.id}-note`;
      const change=html('small','plot-change',row);change.id=`${namespace}${s.id}-change`;
      this.rows.set(s.id,{row,value,note,change});
    }
    const frame=html('div','plot-frame',root);
    const yAxis=html('div','plot-y',frame);yAxis.setAttribute('aria-hidden','true');
    const fy=spec.formatY??defaultFormat;
    for(const t of spec.yTicks??[lo,(lo+hi)/2,hi]){const l=html('span','',yAxis,fy(t));l.style.top=`${(1-(t-lo)/(hi-lo))*100}%`;}
    this.area=html('div','plot-area plot-slider',frame);
    const a=this.area;a.tabIndex=0;a.setAttribute('role','slider');a.setAttribute('aria-orientation','horizontal');
    a.setAttribute('aria-label',`${spec.title} — time position`);a.setAttribute('aria-valuemin',String(x0));a.setAttribute('aria-valuemax',String(x1));
    const plot=svg('svg',{viewBox:`0 0 ${VW} ${VH}`,preserveAspectRatio:'none',class:'plot-svg','aria-hidden':'true',focusable:'false'},a);
    this.draw(plot);
    this.cursor=svg('g',{class:'plot-cursor'},plot);
    svg('path',{d:`M0 0V${VH}`,class:'plot-cursor-line','vector-effect':'non-scaling-stroke'},this.cursor);
    for(const s of spec.series)this.dots.set(s.id,svg('path',{class:'plot-dot',stroke:s.color,'vector-effect':'non-scaling-stroke','data-dot':s.id},this.cursor));
    for(const b of spec.bands??[])if(b.label){const l=html('span','plot-band-label',a,b.label);l.style.left=`${clamp(this.X(b.start)/VW*100,0,100)}%`;l.setAttribute('aria-hidden','true');}
    const xAxis=html('div','plot-x',root);xAxis.setAttribute('aria-hidden','true');
    for(const t of spec.xTicks){const l=html('span','',xAxis,t.label);const p=(t.x-x0)/(x1-x0);l.style.left=`${p*100}%`;l.classList.toggle('start',p<.04);l.classList.toggle('end',p>.96);}
    if(spec.xLabel)html('div','plot-x-label',root,spec.xLabel).setAttribute('aria-hidden','true');
    if(spec.referenceLabel)html('small','plot-reference-label',root,spec.referenceLabel);
    if(spec.note){const n=html('p','plot-note',root,spec.note);n.id=`${namespace}plot-${spec.id}-note`;}
    this.bind();this.render(x0);
  }
  private draw(plot:SVGSVGElement){
    const s=this.spec,[lo,hi]=s.domain,{X,Y}=this;
    // Colours go through CSSOM so they win over the stylesheet defaults.
    for(const b of s.bands??[]){const r=svg('rect',{class:b.tick?'plot-band plot-tick':'plot-band',x:fixed(X(b.start)),y:b.tick?VH-10:0,width:Math.max(b.tick?3:.6,X(b.end)-X(b.start)).toFixed(2),height:b.tick?10:VH},plot);if(b.color)r.style.fill=b.color;}
    if(s.reference&&(s.reference.low!==undefined||s.reference.high!==undefined)){
      const top=Y(Math.min(hi,s.reference.high??hi)),bottom=Y(Math.max(lo,s.reference.low??lo));
      if(bottom>top)svg('rect',{class:'plot-reference',x:0,y:fixed(top),width:VW,height:fixed(bottom-top)},plot);
      for(const v of [s.reference.low,s.reference.high])if(v!==undefined&&v>=lo&&v<=hi)svg('path',{class:'plot-reference-line',d:`M0 ${fixed(Y(v))}H${VW}`,'vector-effect':'non-scaling-stroke'},plot);
    }
    const grid=svg('g',{class:'plot-grid'},plot);
    for(const t of s.yTicks??[lo,(lo+hi)/2,hi])svg('path',{d:`M0 ${fixed(Y(t))}H${VW}`,'vector-effect':'non-scaling-stroke'},grid);
    if(lo<0&&hi>0)svg('path',{class:'plot-zero',d:`M0 ${fixed(Y(0))}H${VW}`,'vector-effect':'non-scaling-stroke'},plot);
    for(const l of s.limits??[]){const n=svg('path',{class:'plot-limit',d:`M0 ${fixed(Y(l.y))}H${VW}`,'vector-effect':'non-scaling-stroke'},plot);if(l.color)n.style.stroke=l.color;}
    for(const series of s.series){
      const list:SVGPathElement[]=[],area=bandPath(series.points,X,Y);
      if(area)list.push(svg('path',{class:'plot-uncertainty',d:area,fill:series.color,'data-series':series.id},plot));
      const line=svg('path',{class:'plot-line',d:linePath(series.points,X,Y),stroke:series.color,'vector-effect':'non-scaling-stroke','data-series':series.id},plot);
      if(series.dash)line.setAttribute('stroke-dasharray',series.dash);
      list.push(line);this.paths.set(series.id,list);
    }
    if(s.observed)svg('path',{class:'plot-observed',d:`M${fixed(X(s.observed.x))} ${fixed(Y(s.observed.y))}h0`,'vector-effect':'non-scaling-stroke'},plot);
  }
  private bind(){
    const a=this.area,[x0,x1]=this.spec.xDomain;
    const xAt=(e:PointerEvent)=>{const r=a.getBoundingClientRect();return r.width>0?x0+clamp((e.clientX-r.left)/r.width,0,1)*(x1-x0):this.x;};
    a.addEventListener('pointerdown',e=>{
      if(e.button>0)return;e.preventDefault();a.focus({preventScroll:true});
      this.keyboardFocus=false;a.setPointerCapture?.(e.pointerId);this.dragging=true;a.classList.add('dragging');this.seek(xAt(e));
    });
    a.addEventListener('focus',()=>{this.keyboardFocus=a.matches(':focus-visible');});
    a.addEventListener('blur',()=>{this.keyboardFocus=false;});
    a.addEventListener('pointermove',e=>{if(this.dragging)this.queue(xAt(e));});
    const end=(e:PointerEvent)=>{if(!this.dragging)return;this.dragging=false;a.classList.remove('dragging');if(a.hasPointerCapture?.(e.pointerId))a.releasePointerCapture(e.pointerId);this.flush();};
    for(const type of ['pointerup','pointercancel','lostpointercapture'] as const)a.addEventListener(type,end);
    a.addEventListener('keydown',e=>{
      const step=this.spec.step??(x1-x0)/200,page=this.spec.pageStep??(x1-x0)/20,small=e.shiftKey?page:step;
      const keys:Record<string,number>={ArrowRight:this.x+small,ArrowUp:this.x+small,ArrowLeft:this.x-small,ArrowDown:this.x-small,PageUp:this.x+page,PageDown:this.x-page,Home:x0,End:x1};
      if(!(e.key in keys))return;e.preventDefault();this.keyboardFocus=true;this.seek(keys[e.key]);
    });
  }
  /** Keep this coordinate system while the user drags or navigates it by keyboard. */
  get interacting(){return this.dragging||this.keyboardFocus&&document.activeElement===this.area;}
  private seek(x:number){const [x0,x1]=this.spec.xDomain,c=clamp(x,x0,x1);this.onSeek(this.spec.toTimeline?this.spec.toTimeline(c):c);}
  private queue(x:number){this.pending=x;if(!this.raf)this.raf=requestAnimationFrame(()=>{this.raf=0;this.flush();});}
  private flush(){if(this.pending===null)return;const x=this.pending;this.pending=null;this.seek(x);}
  /** Plot x for a master-timeline position. */
  xFor(timeline:number){return this.spec.fromTimeline?this.spec.fromTimeline(timeline):timeline;}
  update(timeline:number){this.render(this.xFor(timeline));}
  private render(x:number){
    const s=this.spec,[x0,x1]=s.xDomain,inside=x>=x0-1e-9&&x<=x1+1e-9,cx=clamp(x,x0,x1);
    this.x=cx;
    this.cursor.setAttribute('transform',`translate(${fixed(this.X(cx))} 0)`);
    this.cursor.classList.toggle('outside',!inside);this.element.classList.toggle('plot-outside',!inside);
    const spoken:string[]=[];
    for(const series of s.series){
      const r=this.rows.get(series.id)!,dot=this.dots.get(series.id)!;
      const v=inside?(series.sample?series.sample(cx):interpolate(series.points,cx)):null;
      if(v===null||!Number.isFinite(v))dot.setAttribute('d','');else dot.setAttribute('d',`M0 ${fixed(this.Y(v))}h0`);
      const out:PlotReadout=!inside?{value:'—',detail:'Outside this plot'}:series.readout?series.readout(cx):v===null?{value:'Not estimated'}:{value:(series.format??defaultFormat)(v)};
      setText(r.value,out.value);setText(r.note,out.detail??'');r.note.hidden=!out.detail;setText(r.change,out.change??'');r.change.hidden=!out.change;
      r.row.classList.toggle('no-value',v===null);
      spoken.push(`${series.label} ${out.value}${out.change?`, ${out.change}`:''}`);
    }
    const a=this.area,when=inside?(s.formatX?s.formatX(cx):defaultFormat(cx)):'Outside this plot';
    a.setAttribute('aria-valuenow',String(Math.round(cx*100)/100));
    const text=`${when}: ${spoken.join('; ')}`;if(text!==this.last){this.last=text;a.setAttribute('aria-valuetext',text);}
  }
  /** true=guided focus, false=quiet, null=neutral. */
  emphasize(active:boolean|null,series?:string[]){
    this.element.classList.toggle('is-active',active===true);this.element.classList.toggle('is-dimmed',active===false);
    const focus=active&&series?.length?new Set(series):null;
    for(const [id,list]of this.paths)for(const p of list){p.classList.toggle('is-focus',!!focus?.has(id));p.classList.toggle('is-dim',!!focus&&!focus.has(id));}
    for(const [id,r]of this.rows){r.row.classList.toggle('is-focus',!!focus?.has(id));r.row.classList.toggle('is-dim',!!focus&&!focus.has(id));}
  }
  dispose(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.pending=null;}
}

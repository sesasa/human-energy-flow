import { type Activity } from '../model/day';
type DisplayActivity=Activity|'coffee';
import { type Scenario } from '../model/config';
import { bodyComposition } from '../model/composition';

// Side-view miniature figure. Every pose is a pure function of simulation seconds, so seeking is deterministic
// and a paused clock freezes the scene. Nodes are created once; frames only update attributes.
const NS='http://www.w3.org/2000/svg',RAD=Math.PI/180,TAU=Math.PI*2;
const FLOOR=100,SOLE=2.6,THIGH=16,SHIN=16,UPPER=11.5,FORE=10.5,SHOULDER=21.5,NECK=24,HEAD=6.4;
const C={skin:'#e8c29e',skinFar:'#c9a17f',skinLine:'#b88a68',hair:'#43302a',shirt:'#9fc48e',shirtFar:'#7fa270',shirtLine:'#698c5b',
  shorts:'#5f7393',shortsFar:'#4c5d78',accent:'#e39a72',shoe:'#f1ece0',shoeFar:'#d4cbb3',sole:'#7d6a52',cream:'#efe7d2',wood:'#8b7150',woodDark:'#6c5740',metal:'#56635a',
  sofa:'#a8735c',sofaFar:'#8a5d4a',sofaLine:'#7a4f3e',cushion:'#bb8169',pillow:'#e2b96f'};
const LABELS:Record<DisplayActivity,string>={coffee:'Drinking coffee',rest:'Resting on a sofa',meal:'Eating a meal',work:'Mental work at a laptop',run:'Running',resistance:'Resistance training with dumbbells',
  recovery:'Seated recovery',sleep:'Sleeping',warmup:'Warming up',sprint:'Sprinting',walk:'Walking recovery',cooldown:'Cooling down'};
type PropName='chair'|'table'|'plate'|'glass'|'laptop'|'mug'|'bed'|'blanket'|'towel'|'dumbbells'|'spoon'|'bottle'|'ticks'|'shadow'|'sofa'|'lounge'|'coffeeCup';
const SCENES:Record<DisplayActivity,PropName[]>={coffee:['chair','table','coffeeCup'],rest:['sofa','lounge'],meal:['chair','table','plate','glass','spoon'],work:['chair','table','laptop','mug'],
  run:['shadow','ticks'],sprint:['shadow','ticks'],walk:['shadow','ticks'],warmup:['shadow','ticks'],cooldown:['shadow','ticks'],
  resistance:['shadow','dumbbells'],recovery:['chair','towel','bottle'],sleep:['bed','blanket']};
const FLOOR_SPEED:Partial<Record<DisplayActivity,number>>={walk:10,warmup:12,cooldown:8,run:26,sprint:40};
// Static frames chosen to read clearly when motion is reduced.
const REPRESENTATIVE:Partial<Record<DisplayActivity,number>>={meal:1.4,resistance:1.25,coffee:1.4};

type P={x:number;y:number};
interface Arm{a:P;b:P;c:P}
interface Leg extends Arm{shoe:number}
type Mouth='smile'|'rest'|'effort'|'open';
interface Frame{sh:P;farSh:P;neck:P;head:P;rot:number}
interface Pose{hip:P;torso:number;breath:number;head:P;rot:number;neck:P;near:Arm;far:Arm;nearLeg:Leg;farLeg:Leg;spoon:P|null;cupAngle?:number;mouth:Mouth;flush:number;sweat:number}
interface Gait{hz:number;amp:number;bias:number;knee:number;flex:number;arm:number;armBias:number;elbow:number;lean:number;bob:number;breathHz:number}
const GAITS:Partial<Record<DisplayActivity,Gait>>={
  walk:{hz:.85,amp:20,bias:2,knee:5,flex:38,arm:16,armBias:2,elbow:18,lean:2,bob:0,breathHz:.3},
  warmup:{hz:.95,amp:23,bias:3,knee:6,flex:44,arm:20,armBias:3,elbow:26,lean:3,bob:.3,breathHz:.35},
  cooldown:{hz:.7,amp:17,bias:2,knee:5,flex:34,arm:13,armBias:2,elbow:16,lean:1,bob:0,breathHz:.3},
  run:{hz:1.35,amp:32,bias:6,knee:18,flex:78,arm:40,armBias:6,elbow:82,lean:7,bob:1.6,breathHz:.7},
  sprint:{hz:1.85,amp:42,bias:10,knee:22,flex:98,arm:58,armBias:10,elbow:78,lean:15,bob:2.2,breathHz:1}
};

const pt=(x:number,y:number):P=>({x,y});
const ORIGIN=pt(0,0);
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
const ease=(t:number)=>{const u=clamp(t,0,1);return u*u*(3-2*u);};
const mix=(a:P,b:P,t:number):P=>pt(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
// Angles are degrees from straight down, positive toward the direction the figure faces (+x).
const down=(p:P,len:number,deg:number):P=>pt(p.x+len*Math.sin(deg*RAD),p.y+len*Math.cos(deg*RAD));
const up=(p:P,len:number,deg:number):P=>pt(p.x+len*Math.sin(deg*RAD),p.y-len*Math.cos(deg*RAD));
const fmt=(n:number)=>n.toFixed(2);

function legAt(hip:P,thigh:number,shin:number,shoe:number):Leg{const b=down(hip,THIGH,thigh);return {a:hip,b,c:down(b,SHIN,shin),shoe};}
function armAt(sh:P,upper:number,fore:number):Arm{const b=down(sh,UPPER,upper);return {a:sh,b,c:down(b,FORE,fore)};}
// Two-bone IK; sign +1 keeps the elbow below the shoulder-to-hand line.
function armTo(sh:P,target:P,sign=1):Arm{
  const dx=target.x-sh.x,dy=target.y-sh.y,d=clamp(Math.hypot(dx,dy),UPPER-FORE+.01,UPPER+FORE-.01);
  const base=Math.atan2(dy,dx),a=Math.acos((UPPER*UPPER+d*d-FORE*FORE)/(2*UPPER*d));
  const b=pt(sh.x+UPPER*Math.cos(base+sign*a),sh.y+UPPER*Math.sin(base+sign*a));
  const len=Math.hypot(target.x-b.x,target.y-b.y)||1;
  return {a:sh,b,c:pt(b.x+(target.x-b.x)/len*FORE,b.y+(target.y-b.y)/len*FORE)};
}
const shift=(l:Leg,o:P):Leg=>({a:pt(l.a.x+o.x,l.a.y+o.y),b:pt(l.b.x+o.x,l.b.y+o.y),c:pt(l.c.x+o.x,l.c.y+o.y),shoe:l.shoe});
function frame(hip:P,torso:number,breath:number,tilt:number):Frame{
  const s=1+.012*breath,sh=up(hip,SHOULDER*s,torso),neck=up(hip,NECK*s,torso);
  return {sh,farSh:pt(sh.x-1.3,sh.y+.5),neck,head:up(neck,HEAD,torso+tilt*.6),rot:torso+tilt};
}
function headPoint(f:Frame,x:number,y:number):P{const c=Math.cos(f.rot*RAD),s=Math.sin(f.rot*RAD);return pt(f.head.x+x*c-y*s,f.head.y+x*s+y*c);}
function compose(f:Frame,hip:P,torso:number,breath:number,limbs:{near:Arm;far:Arm;nearLeg:Leg;farLeg:Leg},extra:Partial<Pose>={}):Pose{
  return {hip,torso,breath,head:f.head,rot:f.rot,neck:f.neck,...limbs,spoon:null,mouth:'smile',flush:.08,sweat:0,...extra};
}
function stand(x:number,nt:number,ns:number,ft:number,fs:number){
  const n=legAt(ORIGIN,nt,ns,0),f=legAt(ORIGIN,ft,fs,0),hip=pt(x,FLOOR-SOLE-Math.max(n.c.y,f.c.y));
  return {hip,nearLeg:shift(n,hip),farLeg:shift(f,pt(hip.x-1,hip.y))};
}
function seat(nt:number,ns:number,ft:number,fs:number){
  const hip=pt(60,79);
  return {hip,nearLeg:legAt(hip,nt,ns,0),farLeg:legAt(pt(hip.x-1,hip.y+.2),ft,fs,0)};
}

function gait(g:Gait,s:number,m:number):Pose{
  const ph=TAU*g.hz*s,b=Math.sin(TAU*g.breathHz*s)*m;
  const leg=(q:number)=>{
    const thigh=g.bias+g.amp*Math.sin(q),shin=thigh-g.knee-g.flex*Math.max(0,Math.sin(q+.75*Math.PI))**1.4;
    return legAt(ORIGIN,thigh,shin,clamp(-shin*.7,-28,55));
  };
  const n=leg(ph),f=leg(ph+Math.PI);
  // Ground the lower foot so the stance leg carries the body; running adds a short flight bob.
  const hip=pt(74,FLOOR-SOLE-Math.max(n.c.y,f.c.y)-g.bob*Math.abs(Math.sin(ph)));
  const torso=g.lean+.8*Math.sin(2*ph),fr=frame(hip,torso,b*.6,-g.lean*.5);
  const arm=(sh:P,q:number)=>{const upper=g.armBias+g.arm*Math.sin(q);return armAt(sh,upper,upper+g.elbow);};
  const fast=g.hz>1.2;
  return compose(fr,hip,torso,b*.6,{near:arm(fr.sh,ph+Math.PI),far:arm(fr.farSh,ph),nearLeg:shift(n,hip),farLeg:shift(f,pt(hip.x-1,hip.y))},
    {mouth:fast?'open':'smile',flush:g.hz>1.6?.55:fast?.35:.14,sweat:g.hz>1.6?.85:fast?.45:0});
}

function poseFor(a:DisplayActivity,sec:number,reduced:boolean):Pose{
  const m=reduced?0:1,g=GAITS[a];
  if(g)return gait(g,reduced?.25/g.hz:sec,m);
  const s=reduced?REPRESENTATIVE[a]??0:sec;
  switch(a){
    case 'coffee':{
      const u=s%6,k=u<1.5?ease(u/1.5):u<2.8?1:u<4.3?1-ease((u-2.8)/1.5):0;
      const b=Math.sin(TAU*s/4.5)*m,torso=3,legs=seat(82,6,84,0),fr=frame(legs.hip,torso,b,4-7*k);
      const mouth=headPoint(fr,4.6,3.2),hand=mix(pt(80,71),pt(mouth.x+3,mouth.y+5.5),k);
      return compose(fr,legs.hip,torso,b,{near:armTo(fr.sh,hand),far:armTo(fr.farSh,pt(74,72)),nearLeg:legs.nearLeg,farLeg:legs.farLeg},{cupAngle:-18*k,mouth:k>.8?'rest':'smile'});
    }
    case 'meal':{
      const u=s%5.5,k=u<1.3?ease(u/1.3):u<2.6?1:u<3.8?1-ease((u-2.6)/1.2):0;
      const b=Math.sin(TAU*s/4.2)*m,torso=4+3*(1-k),legs=seat(82,6,84,0),fr=frame(legs.hip,torso,b,12*(1-k)-2*k);
      const mouth=headPoint(fr,4.6,3.2),plate=pt(79.5+1.2*Math.sin(TAU*s/1.7)*(k<.05?1:0),71.4);
      const tip=mix(plate,mouth,k),handle=mix(pt(-3.2,-4.2),pt(2.4,4.4),k),hand=pt(tip.x+handle.x,tip.y+handle.y);
      return compose(fr,legs.hip,torso,b,{near:armTo(fr.sh,hand),far:armTo(fr.farSh,pt(72.5,71.8)),nearLeg:legs.nearLeg,farLeg:legs.farLeg},
        {spoon:tip,mouth:k>.8&&u<1.6?'open':'rest'});
    }
    case 'work':{
      const b=Math.sin(TAU*s/4.4)*m,torso=8,legs=seat(82,6,84,0),fr=frame(legs.hip,torso,b,10+1.5*Math.sin(TAU*s/9));
      const tap=(q:number)=>.7*Math.max(0,Math.sin(TAU*3.1*s+q))*m;
      return compose(fr,legs.hip,torso,b,{near:armTo(fr.sh,pt(77.5+.8*Math.sin(TAU*s/2.3)*m,71-tap(0))),far:armTo(fr.farSh,pt(78.5,71.3-tap(Math.PI))),
        nearLeg:legs.nearLeg,farLeg:legs.farLeg},{mouth:'rest'});
    }
    case 'recovery':{
      const b=Math.sin(TAU*s/5.5)*1.4*m,torso=-2,legs=seat(80,12,84,0),fr=frame(legs.hip,torso,b,-4);
      const near=mix(legs.nearLeg.a,legs.nearLeg.b,.45),far=mix(legs.farLeg.a,legs.farLeg.b,.45);
      return compose(fr,legs.hip,torso,b,{near:armTo(fr.sh,pt(near.x,near.y-2.8)),far:armTo(fr.farSh,pt(far.x,far.y-2.6)),nearLeg:legs.nearLeg,farLeg:legs.farLeg},
        {flush:.2});
    }
    case 'sleep':{
      const b=Math.sin(TAU*s/5)*m,hip=pt(74,81.6),torso=-86,fr=frame(hip,torso,b,4);
      return compose(fr,hip,torso,b,{near:armAt(fr.sh,97,86),far:armAt(fr.farSh,92,92),nearLeg:legAt(hip,92,91,-90),farLeg:legAt(pt(hip.x,hip.y+.6),91,90,-90)},
        {mouth:'rest',flush:.05});
    }
    case 'resistance':{
      const u=s%3.4,k=u<1.1?ease(u/1.1):u<1.5?1:u<2.9?1-ease((u-1.5)/1.4):0;
      const b=Math.sin(TAU*s/3.4)*m,torso=1.5-3*k,legs=stand(76,7,5,-6,-4),fr=frame(legs.hip,torso,b,-1);
      return compose(fr,legs.hip,torso,b,{near:armAt(fr.sh,1+7*k,12+136*k),far:armAt(fr.farSh,-1+7*k,8+136*k),nearLeg:legs.nearLeg,farLeg:legs.farLeg},
        {mouth:k>.15&&u<1.5?'effort':'smile',flush:.18+.35*k,sweat:.4});
    }
    default:{
      // Rest: reclined on the lounge sofa, legs stretched forward, one hand on the belly and one on the armrest.
      const b=Math.sin(TAU*s/5)*1.2*m,hip=pt(62,80.5),torso=-13+.5*Math.sin(TAU*s/11)*m,fr=frame(hip,torso,b,9+1.4*Math.sin(TAU*s/9)*m);
      const nearLeg=legAt(hip,78,32,0),farLeg=legAt(pt(hip.x-1,hip.y+.2),75,40,0);
      return compose(fr,hip,torso,b,{near:armTo(fr.sh,pt(65,77.2)),far:armTo(fr.farSh,pt(66,70.2)),nearLeg,farLeg},{flush:.12});
    }
  }
}

type Attrs=Record<string,string|number>;
function make<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Attrs={},parent?:Element):SVGElementTagNameMap[K]{
  const node=document.createElementNS(NS,tag);
  for(const [k,v]of Object.entries(attrs))node.setAttribute(k,String(v));
  parent?.appendChild(node);return node;
}
const written=new WeakMap<Element,Map<string,string>>();
function set(node:Element,name:string,value:string|number){
  const v=typeof value==='number'?fmt(value):value;let m=written.get(node);
  if(!m){m=new Map();written.set(node,m);}
  if(m.get(name)!==v){m.set(name,v);node.setAttribute(name,v);}
}
function setLine(node:SVGLineElement,a:P,b:P){set(node,'x1',a.x);set(node,'y1',a.y);set(node,'x2',b.x);set(node,'y2',b.y);}

interface ArmParts{upper:SVGLineElement;fore:SVGLineElement;sleeve:SVGLineElement;hand:SVGCircleElement;dumbbell:SVGGElement;spoon:SVGGElement;spoonHandle:SVGLineElement;spoonBowl:SVGEllipseElement;bottle:SVGGElement}
interface LegParts{thigh:SVGLineElement;shin:SVGLineElement;shorts:SVGLineElement;shoe:SVGGElement}
const SHOE='M-1.7 -1.6C-2.4 .2-2.3 1.8-1.7 2.4H5.4C6.6 2.4 6.7 1.2 5.8 .6C4.6-.2 3.2-.5 2.2-1.2L1.4-1.9Z';
const HAIR='M-5.4 2.2C-6.6-3.6-3.4-7.4 1.2-6.9C4.2-6.6 5.9-4.6 5.5-2.4C4.4-3.4 2.4-3.9.4-3.7C-.4-2.6-1.2-1.2-2.6-.6C-3.4.4-3.8 1.6-4.2 3.2Z';
const MOUTHS:Record<Mouth,[string,string]>={smile:['M3 3.2Q3.9 3.8 4.7 3.1','none'],rest:['M3.1 3.3Q3.9 3.5 4.6 3.3','none'],effort:['M3 3.3L4.8 3.2','none'],open:['M3.2 3Q4 4.6 4.8 3Q4 3.5 3.2 3Z','#7a4436']};
const PEAS:[number,number][]=[[82.4,71.3],[83.3,71.6],[81.6,71.7]];
let sceneCount=0;

export class ActivityView {
  private host:HTMLElement;private svg:SVGSVGElement;private title:SVGTitleElement;
  private torso:SVGGElement;private shirt:SVGPathElement;private shorts:SVGPathElement;private waist:SVGPathElement;private collar:SVGPathElement;
  private neck:SVGLineElement;private head:SVGGElement;private ponytail:SVGGElement;
  private eyeOpen:SVGGElement;private eyeClosed:SVGPathElement;private mouth:SVGPathElement;private blush:SVGCircleElement;private sweat:SVGPathElement;
  private nearArm:ArmParts;private farArm:ArmParts;private nearLeg:LegParts;private farLeg:LegParts;
  private ticks:SVGGElement;private shadow:SVGEllipseElement;private blanket:SVGPathElement;private blanketEdge:SVGPathElement;
  private props:Record<PropName,SVGElement[]>;private coffeeCup:SVGGElement;
  private activity:DisplayActivity|''='';private personKey='';private label='';
  constructor(host:HTMLElement){
    this.host=host;
    const id=`activity-clip-${++sceneCount}`;
    this.svg=make('svg',{viewBox:'0 0 156 116',width:150,height:112,role:'img','aria-label':'Resting',class:'activity-scene'});
    this.title=make('title',{},this.svg);this.title.textContent='Resting';
    make('rect',{x:.5,y:.5,width:155,height:115,rx:9},make('clipPath',{id},make('defs',{},this.svg)));
    const scene=make('g',{'clip-path':`url(#${id})`},this.svg);
    make('rect',{width:156,height:116,fill:'#15211a'},scene);
    make('circle',{cx:78,cy:58,r:44,fill:'#263b28',opacity:.35},scene);
    make('rect',{y:FLOOR,width:156,height:16,fill:'#121c15'},scene);
    make('line',{x1:0,x2:156,y1:FLOOR,y2:FLOOR,stroke:'#3d5338','stroke-width':.8},scene);
    this.ticks=make('g',{stroke:'#2f4330','stroke-width':.8,'stroke-linecap':'round'},scene);
    for(let x=0;x<=170;x+=14)make('line',{x1:x,x2:x+4,y1:104,y2:104},this.ticks);
    this.shadow=make('ellipse',{cy:FLOOR+.4,ry:1.6,fill:'#0b130e',opacity:.5},scene);

    const chair=make('g',{fill:C.wood},scene);
    make('rect',{x:48.5,y:57,width:4.5,height:15,rx:2},chair);
    make('line',{x1:51,y1:62,x2:51,y2:FLOOR,stroke:C.woodDark,'stroke-width':1.6},chair);
    make('line',{x1:67,y1:83,x2:67,y2:FLOOR,stroke:C.woodDark,'stroke-width':1.6},chair);
    make('line',{x1:51,y1:92,x2:67,y2:92,stroke:C.woodDark,'stroke-width':.8},chair);
    make('rect',{x:48.5,y:81.5,width:21,height:2.6,rx:1},chair);

    const bed=make('g',{},scene);
    make('rect',{x:18,y:71,width:5,height:29,rx:1.6,fill:C.wood},bed);
    make('rect',{x:121,y:81,width:4,height:19,rx:1.4,fill:C.wood},bed);
    make('rect',{x:20,y:90.5,width:104,height:5,rx:1,fill:C.woodDark},bed);
    make('rect',{x:22,y:85.6,width:100,height:5.4,rx:2,fill:'#ddd5bd'},bed);
    make('ellipse',{cx:39,cy:83.8,rx:10,ry:3.7,fill:'#f2eddd',stroke:'#d6ccb3','stroke-width':.4},bed);

    // Lounge corner for rest: a warm arc lamp and a plant, clearly separate from the work/meal table.
    const lounge=make('g',{},scene);
    make('circle',{cx:33,cy:40,r:15,fill:'#f3d9a0',opacity:.08},lounge);
    make('path',{d:'M17 100V44Q17 33 29 34.5',fill:'none',stroke:'#7d8a76','stroke-width':1.1,'stroke-linecap':'round'},lounge);
    make('rect',{x:13.5,y:98.6,width:7,height:1.6,rx:.8,fill:'#5d6a58'},lounge);
    make('path',{d:'M25.6 34.2Q30.5 30.4 35.4 34.6L34.4 37.6H26.4Z',fill:'#e9cf95'},lounge);
    make('ellipse',{cx:30.4,cy:37.8,rx:3.6,ry:.7,fill:'#fff3cf',opacity:.75},lounge);
    make('path',{d:'M127 90Q119.5 82 121 72.5Q126 80.5 127 90Z',fill:'#7fa76a'},lounge);
    make('path',{d:'M127 90Q132 79.5 138.5 75.5Q136.5 85.5 127 90Z',fill:'#94bb7c'},lounge);
    make('path',{d:'M127 90Q125.8 77.5 129.6 67.5Q131.8 79 127 90Z',fill:'#6b965b'},lounge);
    make('path',{d:'M121.6 91H132.4L130.9 100H123.1Z',fill:'#c98f6a'},lounge);
    make('rect',{x:121,y:89.6,width:12,height:2.2,rx:.9,fill:'#b27b58'},lounge);

    const sofa=make('g',{},scene);
    make('ellipse',{cx:57,cy:100.4,rx:27,ry:1.5,fill:'#0b130e',opacity:.45},sofa);
    make('rect',{x:38,y:93.5,width:2.6,height:6.5,rx:.8,fill:C.woodDark},sofa);
    make('rect',{x:73.5,y:93.5,width:2.6,height:6.5,rx:.8,fill:C.woodDark},sofa);
    make('path',{d:'M37 88L33.5 60Q33 54.5 38.5 54.5H46Q50.6 54.8 51.2 59.6L55.5 86Z',fill:C.sofa,stroke:C.sofaLine,'stroke-width':.5},sofa);
    make('path',{d:'M36.6 61Q37 57.5 40.5 57.4',fill:'none',stroke:'#fff',opacity:.12,'stroke-width':.9,'stroke-linecap':'round'},sofa);
    make('rect',{x:40,y:69,width:38,height:12,rx:5,fill:C.sofaFar},sofa);
    make('path',{d:'M42 64Q44.5 59.5 49.5 62L51.5 72Q47 74 43.6 71.5Z',fill:C.pillow},sofa);
    make('rect',{x:35,y:84,width:44,height:10.5,rx:3.5,fill:C.sofa,stroke:C.sofaLine,'stroke-width':.5},sofa);
    make('rect',{x:41,y:78.6,width:38,height:7.2,rx:3.4,fill:C.cushion,stroke:C.sofaLine,'stroke-width':.4},sofa);
    make('path',{d:'M44 80.4H76',stroke:'#fff',opacity:.14,'stroke-width':.8,'stroke-linecap':'round'},sofa);

    this.farArm=this.makeArm(scene,true);this.farLeg=this.makeLeg(scene,true);
    this.neck=make('line',{stroke:C.skin,'stroke-width':2.8,'stroke-linecap':'round'},scene);
    this.torso=make('g',{},scene);
    this.shirt=make('path',{fill:C.shirt,stroke:C.shirtLine,'stroke-width':.4},this.torso);
    this.collar=make('path',{fill:'none',stroke:C.shirtLine,'stroke-width':.6,'stroke-linecap':'round'},this.torso);
    this.shorts=make('path',{fill:C.shorts,stroke:C.shortsFar,'stroke-width':.35},this.torso);
    this.waist=make('path',{fill:'none',stroke:C.shortsFar,'stroke-width':.7},this.torso);
    const towel=make('g',{},this.torso);
    make('path',{d:'M-2.8-24.4Q.6-26.4 3.2-23L4-13.8Q3.1-12.6 2-13.5L1.5-20.8Q0-22.8-2.2-21.8Z',fill:C.cream,stroke:'#d6ccb3','stroke-width':.3},towel);
    make('path',{d:'M2.1-15.2L3.9-15.6',stroke:C.accent,'stroke-width':.6},towel);
    this.nearLeg=this.makeLeg(scene,false);

    const blanketGroup=make('g',{},scene);
    this.blanket=make('path',{fill:'#7f9a6c',stroke:'#6f8a5e','stroke-width':.4},blanketGroup);
    this.blanketEdge=make('path',{fill:'none',stroke:C.cream,'stroke-width':1.3,'stroke-linecap':'round',opacity:.85},blanketGroup);
    const table=make('g',{},scene);
    make('rect',{x:108,y:75,width:3,height:23.5,fill:C.woodDark},table);
    make('rect',{x:99,y:98,width:21,height:2,rx:1,fill:C.woodDark},table);
    make('rect',{x:70,y:73,width:64,height:2.2,rx:1,fill:C.wood},table);
    make('line',{x1:71,y1:73.3,x2:133,y2:73.3,stroke:'#a88d64','stroke-width':.4},table);
    const plate=make('g',{},scene);
    make('ellipse',{cx:80,cy:72.5,rx:6.5,ry:1.3,fill:C.cream,stroke:'#d6ccb3','stroke-width':.35},plate);
    make('path',{d:'M76.4 72.1Q77.9 69.9 80 70.7Q81.7 69.7 83.5 71.9Z',fill:'#d9a75c'},plate);
    for(const [cx,cy]of PEAS)make('circle',{cx,cy,r:.75,fill:'#8fae74'},plate);
    const glass=make('g',{},scene);
    make('path',{d:'M114 64.5H119L118.4 73H114.6Z',fill:'#cfe4e6',opacity:.22,stroke:'#cfe4e6','stroke-width':.4},glass);
    make('path',{d:'M114.3 67.5H118.7L118.4 73H114.6Z',fill:'#89c5ce',opacity:.45},glass);
    const laptop=make('g',{},scene);
    make('path',{d:'M90.4 72.9L91.9 72.9L96.3 59.7L94.8 59.4Z',fill:'#b8c0b4'},laptop);
    make('line',{x1:90.8,y1:71.9,x2:94.9,y2:60.4,stroke:'#cfe8dc','stroke-width':.7,opacity:.85},laptop);
    make('rect',{x:74,y:71.6,width:17.5,height:1.5,rx:.5,fill:'#c7cec3'},laptop);
    const mug=make('g',{},scene);
    make('path',{d:'M121 68.5Q124 68.6 123.6 70.6Q123.3 72 121 71.8',fill:'none',stroke:'#e6b66f','stroke-width':.8},mug);
    make('rect',{x:116,y:67.6,width:5.4,height:5.6,rx:1,fill:'#e6b66f'},mug);

    this.head=make('g',{},scene);
    this.ponytail=make('g',{},this.head);
    make('path',{d:'M-4.6-2.6Q-9.8-1-8.4 4.8Q-6.8 2-5 1.2Z',fill:C.hair},this.ponytail);
    make('circle',{cx:-5.2,cy:-1.6,r:.8,fill:C.accent},this.ponytail);
    make('ellipse',{rx:5.3,ry:6,fill:C.skin},this.head);
    make('path',{d:'M4.9-1Q6.5.9 5.1 1.6',fill:C.skin,stroke:C.skinLine,'stroke-width':.3},this.head);
    make('path',{d:HAIR,fill:C.hair},this.head);
    make('path',{d:'M-3.6-4.6Q-.6-6.6 2.6-5.4',fill:'none',stroke:'#6a4c3c','stroke-width':.5,'stroke-linecap':'round',opacity:.8},this.head);
    make('ellipse',{cx:-1,cy:.8,rx:1.1,ry:1.5,fill:C.skinFar,stroke:C.skinLine,'stroke-width':.25},this.head);
    this.eyeOpen=make('g',{},this.head);
    make('circle',{cx:2.9,cy:-.4,r:.66,fill:'#2e2620'},this.eyeOpen);
    make('circle',{cx:3.1,cy:-.64,r:.2,fill:'#fff',opacity:.9},this.eyeOpen);
    this.eyeClosed=make('path',{d:'M2.1-.4Q2.9.2 3.7-.4',fill:'none',stroke:'#2e2620','stroke-width':.45,'stroke-linecap':'round'},this.head);
    make('path',{d:'M2-2.2Q3-2.8 4.1-2.3',fill:'none',stroke:C.hair,'stroke-width':.55,'stroke-linecap':'round'},this.head);
    this.mouth=make('path',{stroke:'#8c5a46','stroke-width':.5,'stroke-linecap':'round'},this.head);
    this.blush=make('circle',{cx:2.3,cy:1.9,r:1.4,fill:'#e8927c'},this.head);
    this.sweat=make('path',{d:'M0 0Q.8 1.2 0 1.8Q-.8 1.2 0 0Z',fill:'#bfe0ea'},this.head);
    this.nearArm=this.makeArm(scene,false);
    this.coffeeCup=make('g',{'data-prop':'coffee-cup'},scene);
    make('path',{d:'M2-5H4Q7-5 6-2Q5 0 2-1',fill:'none',stroke:'#e8c88d','stroke-width':1},this.coffeeCup);
    make('path',{d:'M-4-6H2L1.5 0Q-1 1.7-3.5 0Z',fill:'#e8c88d',stroke:'#ae875d','stroke-width':.4},this.coffeeCup);
    make('ellipse',{cx:-1,cy:-6,rx:3,ry:1,fill:'#694832',stroke:'#f0d8a5','stroke-width':.45},this.coffeeCup);
    make('rect',{x:.5,y:.5,width:155,height:115,rx:9,fill:'none',stroke:'#2f4330'},this.svg);

    this.props={coffeeCup:[this.coffeeCup],chair:[chair],table:[table],plate:[plate],glass:[glass],laptop:[laptop],mug:[mug],bed:[bed],blanket:[blanketGroup],towel:[towel],sofa:[sofa],lounge:[lounge],
      dumbbells:[this.nearArm.dumbbell,this.farArm.dumbbell],spoon:[this.nearArm.spoon],bottle:[this.nearArm.bottle],ticks:[this.ticks],shadow:[this.shadow]};
    host.replaceChildren(this.svg);
  }
  private makeArm(parent:Element,far:boolean):ArmParts{
    const g=make('g',{},parent),skin=far?C.skinFar:C.skin;
    const line=(stroke:string)=>make('line',{stroke,'stroke-linecap':'round'},g);
    const upper=line(skin),fore=line(skin),sleeve=line(far?C.shirtFar:C.shirt);
    const dumbbell=make('g',{},g);
    make('line',{x1:-3.4,x2:3.4,y1:0,y2:0,stroke:'#9aa595','stroke-width':1.1,'stroke-linecap':'round'},dumbbell);
    for(const x of [-4.8,3.2])make('rect',{x,y:-2.8,width:1.6,height:5.6,rx:.6,fill:far?'#3f4a42':C.metal},dumbbell);
    for(const x of [-3.4,2.4])make('rect',{x,y:-2,width:1,height:4,rx:.4,fill:far?'#4a564d':'#6b786e'},dumbbell);
    const spoon=make('g',{},g);
    const spoonHandle=make('line',{stroke:'#cfd5c9','stroke-width':.7,'stroke-linecap':'round'},spoon);
    const spoonBowl=make('ellipse',{rx:1.3,ry:.7,fill:'#dfe4d8'},spoon);
    const bottle=make('g',{},g);
    make('rect',{x:-1.5,y:-7.5,width:3,height:9,rx:1,fill:'#89c5ce',opacity:.9},bottle);
    make('rect',{x:-1,y:-8.8,width:2,height:1.5,rx:.4,fill:'#e4e8d5'},bottle);
    make('rect',{x:-1.5,y:-4.6,width:3,height:2,fill:'#e6b66f',opacity:.85},bottle);
    const hand=make('circle',{r:1.65,fill:skin,stroke:C.skinLine,'stroke-width':.3},g);
    if(far){spoon.setAttribute('display','none');bottle.setAttribute('display','none');}
    return {upper,fore,sleeve,hand,dumbbell,spoon,spoonHandle,spoonBowl,bottle};
  }
  private makeLeg(parent:Element,far:boolean):LegParts{
    const g=make('g',{},parent),skin=far?C.skinFar:C.skin;
    const line=(stroke:string)=>make('line',{stroke,'stroke-linecap':'round'},g);
    const thigh=line(skin),shin=line(skin),shorts=line(far?C.shortsFar:C.shorts),shoe=make('g',{},g);
    make('path',{d:SHOE,fill:far?C.shoeFar:C.shoe,stroke:C.sole,'stroke-width':.25},shoe);
    make('path',{d:'M-1.9 2.6H5.9',stroke:C.sole,'stroke-width':.9,'stroke-linecap':'round'},shoe);
    make('path',{d:'M.6-.8L2.6.1',stroke:C.accent,'stroke-width':.5},shoe);
    return {thigh,shin,shorts,shoe};
  }
  private applyPerson(person:Scenario['person']){
    const key=`${person.height_cm}:${person.weight_kg}:${person.body_fat_fraction}:${person.sex}`;
    if(key===this.personKey)return;this.personKey=key;
    // Width follows mass and fat share only; muscularity is not inferred.
    const c=bodyComposition(person),w=clamp(1+(c.bmi-24.5)*.032,.84,1.38),bf=clamp(1+(c.fatFraction-.17)*1.5,.92,1.4),k=1+(w-1)*.55;
    const b=3.9*w,f=3.7*w,belly=3.8*w*bf;
    this.shirt.setAttribute('d',`M${fmt(-b)} 0C${fmt(-b*1.12)}-8 ${fmt(-b*1.12)}-16 ${fmt(-b*.95)}-21.5Q${fmt(-b*.7)}-24.8 0-24.8Q${fmt(f*.8)}-24.8 ${fmt(f)}-21.6C${fmt(f*1.15)}-18.5 ${fmt(f*1.1)}-15 ${fmt(belly*.98)}-11.5C${fmt(belly*1.12)}-7.5 ${fmt(belly*1.05)}-2.5 ${fmt(f)} 0Q0 2.2 ${fmt(-b)} 0Z`);
    this.shorts.setAttribute('d',`M${fmt(-b*1.06)}-5.5L${fmt(belly*1.04)}-5.5C${fmt(belly*1.06)}-2 ${fmt(f*1.04)} 1 ${fmt(f*.9)} 2.6Q0 4 ${fmt(-b*1.04)} 2.4Q${fmt(-b*1.16)}-1.5 ${fmt(-b*1.06)}-5.5Z`);
    this.waist.setAttribute('d',`M${fmt(-b*1.05)}-5.1L${fmt(belly*1.03)}-5.1`);
    this.collar.setAttribute('d',`M${fmt(f*.2)}-24.6Q${fmt(f*.55)}-22.6 ${fmt(f*.85)}-22.8`);
    for(const arm of [this.nearArm,this.farArm]){arm.upper.setAttribute('stroke-width',fmt(3.1*k));arm.fore.setAttribute('stroke-width',fmt(2.6*k));arm.sleeve.setAttribute('stroke-width',fmt(4.3*k));}
    const thigh=k*(1+(bf-1)*.4);
    for(const leg of [this.nearLeg,this.farLeg]){leg.thigh.setAttribute('stroke-width',fmt(4.9*thigh));leg.shorts.setAttribute('stroke-width',fmt(5.8*thigh));leg.shin.setAttribute('stroke-width',fmt(3.7*k));}
    this.ponytail.setAttribute('display',person.sex==='female'?'inline':'none');
  }
  private applyActivity(a:DisplayActivity){
    this.activity=a;this.host.dataset.activity=a;
    const on=new Set(SCENES[a]);
    for(const [name,nodes]of Object.entries(this.props) as [PropName,SVGElement[]][])for(const n of nodes)n.setAttribute('display',on.has(name)?'inline':'none');
  }
  // label optionally overrides the accessible name, e.g. "Eating breakfast" to match the visible caption.
  update(activity:Activity,simulationSeconds:number,person:Scenario['person'],playing:boolean,reducedMotion:boolean,label?:string,drinkingCoffee=false):void{
    this.applyPerson(person);
    const shown:DisplayActivity=drinkingCoffee?'coffee':activity;
    if(shown!==this.activity)this.applyActivity(shown);
    const name=label||LABELS[activity];
    if(name!==this.label){this.label=name;this.title.textContent=name;this.svg.setAttribute('aria-label',name);}
    set(this.svg,'data-motion',reducedMotion?'reduced':playing?'playing':'paused');
    const sec=Number.isFinite(simulationSeconds)?Math.max(0,simulationSeconds):0,p=poseFor(shown,sec,reducedMotion);
    set(this.torso,'transform',`translate(${fmt(p.hip.x)} ${fmt(p.hip.y)}) rotate(${fmt(p.torso)}) scale(${fmt(1+.014*p.breath)} ${fmt(1+.008*p.breath)})`);
    setLine(this.neck,p.neck,p.head);
    set(this.head,'transform',`translate(${fmt(p.head.x)} ${fmt(p.head.y)}) rotate(${fmt(p.rot)})`);
    set(this.coffeeCup,'transform',`translate(${fmt(p.near.c.x)} ${fmt(p.near.c.y)}) rotate(${fmt(p.cupAngle??0)})`);
    this.drawArm(this.nearArm,p.near);this.drawArm(this.farArm,p.far);
    this.drawLeg(this.nearLeg,p.nearLeg);this.drawLeg(this.farLeg,p.farLeg);
    if(p.spoon){
      const hand=p.near.c,angle=Math.atan2(p.spoon.y-hand.y,p.spoon.x-hand.x)/RAD;
      setLine(this.nearArm.spoonHandle,hand,p.spoon);
      set(this.nearArm.spoonBowl,'cx',p.spoon.x);set(this.nearArm.spoonBowl,'cy',p.spoon.y);
      set(this.nearArm.spoonBowl,'transform',`rotate(${fmt(angle)} ${fmt(p.spoon.x)} ${fmt(p.spoon.y)})`);
    }
    set(this.nearArm.bottle,'transform',`translate(${fmt(p.near.c.x)} ${fmt(p.near.c.y+1.5)})`);
    if(activity==='sleep'){
      const r=.8*p.breath,top=`M53 ${fmt(78-r)}Q60 ${fmt(76.2-r)} 70 ${fmt(77.4-r*.6)}Q88 78.6 104 78.4Q114 78.2 118.5 80.2`;
      set(this.blanket,'d',`${top}L119.5 88.8H52.5Z`);set(this.blanketEdge,'d',top);
    }
    const speed=FLOOR_SPEED[activity]??0;
    set(this.ticks,'transform',`translate(${fmt(reducedMotion?0:-(sec*speed%14))} 0)`);
    set(this.shadow,'cx',p.hip.x);set(this.shadow,'rx',11+Math.abs(p.nearLeg.c.x-p.farLeg.c.x)*.35);
    const blink=!reducedMotion&&sec%4.7<.13,closed=activity==='sleep'||blink;
    set(this.eyeOpen,'display',closed?'none':'inline');set(this.eyeClosed,'display',closed?'inline':'none');
    const [d,fill]=MOUTHS[p.mouth];set(this.mouth,'d',d);set(this.mouth,'fill',fill);set(this.mouth,'stroke-width',p.mouth==='effort'?.7:.5);
    set(this.blush,'opacity',p.flush);
    const drip=reducedMotion?.3:sec*.5%1;
    set(this.sweat,'transform',`translate(1.4 ${fmt(-3.8+drip*2.6)})`);set(this.sweat,'opacity',p.sweat*(1-drip*.8));
  }
  private drawArm(parts:ArmParts,arm:Arm){
    setLine(parts.upper,arm.a,arm.b);setLine(parts.fore,arm.b,arm.c);setLine(parts.sleeve,arm.a,mix(arm.a,arm.b,.55));
    set(parts.hand,'cx',arm.c.x);set(parts.hand,'cy',arm.c.y);
    // Dumbbell handle sits across the grip, perpendicular to the forearm.
    const angle=Math.atan2(arm.c.y-arm.b.y,arm.c.x-arm.b.x)/RAD-90;
    set(parts.dumbbell,'transform',`translate(${fmt(arm.c.x)} ${fmt(arm.c.y)}) rotate(${fmt(angle)})`);
  }
  private drawLeg(parts:LegParts,leg:Leg){
    setLine(parts.thigh,leg.a,leg.b);setLine(parts.shin,leg.b,leg.c);setLine(parts.shorts,leg.a,mix(leg.a,leg.b,.6));
    set(parts.shoe,'transform',`translate(${fmt(leg.c.x)} ${fmt(leg.c.y)}) rotate(${fmt(leg.shoe)})`);
  }
}

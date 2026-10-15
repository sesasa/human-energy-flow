import {labMarkers,type NutritionMarker} from '../model/labs';
import {metricDefinitions,type Tip} from './tooltips';
import {interpolate,type PlotSeries,type PlotSpec} from './plotCard';

const definitions:Record<string,string>={
 carbShare:'The model’s share of energy demand assigned to carbohydrate. Working muscles use local glycogen and glucose from circulation; this is not measured fuel oxidation.',
 fatShare:'The model’s share of energy demand assigned to fat. It complements the carbohydrate share, rather than measuring the amount of body fat lost.',
 oxygen:'Relative oxygen delivery and oxidative support during this session. This is an illustrative index, not oxygen saturation or a measured aerobic percentage.',
 pcrSource:'The share of modeled ATP regeneration supplied by phosphocreatine during a sprint. During a walk, PCr is rebuilt, so no sprint pathway share is plotted.',
 aerobicSource:'The share of modeled ATP regeneration supplied through oxidative metabolism during a sprint. Oxygen also supports PCr restoration during recovery.',
 glycolytic:'The share of modeled ATP regeneration supplied by glycolysis during a sprint. Local carbohydrate helps support rapid effort; walks are left as gaps in this plot.',
 glycogen:'Stored carbohydrate in the working-muscle pool, as a percentage of its reference capacity. It declines through repeated sprints and is replenished more slowly than PCr.',
};
export function plotTip(spec:PlotSpec,series:PlotSeries,position:number):Tip{
 const x=spec.fromTimeline?.(position)??position,at=(t:number)=>series.sample?.(t)??interpolate(series.points,t);
 const now=at(x),isSprint=!!spec.fromTimeline,isDay=spec.xDomain[1]===1440;
 const next=at(Math.min(spec.xDomain[1],x+(isSprint?2/60:isDay?15:30)));
 const r=series.readout?.(x),value=r?.value??(now===null?'Not estimated':series.format?.(now)??now.toFixed(2));
 const marker=series.id as NutritionMarker;
 const what=series.tip||definitions[series.id]||(spec.id.startsWith('lab-')?labMarkers[marker]?.note:metricDefinitions[series.id])||spec.note||'';
 let direction=now===null?'This part of the trajectory is not estimated.':next===null?'The model does not estimate the next part of this trajectory.':Math.abs(next-now)<(spec.domain[1]-spec.domain[0])*.002?'Approximately steady over the next modeled interval.':`${next>now?'Rising':'Falling'} over the next ${isSprint?'two seconds':isDay?'15 minutes':'month'} in this model.`;
 if(series.id==='atp')direction='ATP is continually regenerated. A stable pool does not mean low ATP use.';
 if(spec.id==='pathways'&&now===null)direction='Pathway shares are shown during sprints; PCr is restored during walks.';
 return {title:series.label,what,now:`Now: ${value}${r?.detail?` · ${r.detail}`:''}${r?.change?` · ${r.change}${r.change.includes('vs entered')?'':' from start'}`:''}.`,next:direction};
}

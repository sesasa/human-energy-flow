import {sampleLongTerm,type AdaptationState} from '../model/longTerm';
import type {Story} from './presentation';

/** Context follows the actual recent trajectory, not an assumed progression by year. */
export function longStory(states:AdaptationState[],position:number):Story{
 const now=sampleLongTerm(states,position),before=sampleLongTerm(states,Math.max(0,position-90));
 if(now.atLimit)return {id:'long-limit',title:'Projection limit reached.',eyebrow:'LONG-TERM / MODEL BOUNDARY',keys:['Outside supported range','Body held at the limit','Adjust the scenario'],caption:'The body-composition projection stops here. The held body is the last supported state, not a prediction beyond this point.',focus:'all'};
 const span=Math.max(.000001,Math.min(90,position));
 const fat=(now.fat-before.fat)/span*90,lean=(now.lean-before.lean)/span*90;
 const f=fat>.15?'up':fat<-.15?'down':'steady',l=lean>.1?'up':lean<-.1?'down':'steady';
 return {id:`long-${position===0?'start':f+'-'+l}`,title:position===0?'Small changes add up.':f==='up'?'Fat stores are growing.':f==='down'?'Drawing on body stores.':l==='up'?'Building lean tissue.':'A steadier state.',eyebrow:'REPEATED WEEKS / LONG-TERM',
  keys:position===0?['Same person & activity','Repeat the chosen food week','Follow fat and lean tissue']:[f==='up'?'Fat mass increasing':f==='down'?'Fat stores declining':'Fat mass nearly steady',l==='up'?'Lean tissue increasing':l==='down'?'Lean tissue declining':'Lean mass nearly steady','Same weekly routine'],
  caption:'These curves illustrate a repeating routine, not an individual forecast. The scene follows change over the preceding three months (or since the start). Fat and lean tissue can move in different directions.',focus:'all'};
}

// Raw laboratory observations stay separate from educational projections.
import type { PhysiologyProfile } from './profile';
import type { DietApplication } from './diet';
// Units are displayed as supplied. A unit change clears numeric fields instead of silently reinterpreting them.
export type LabMarker = 'ferritin'|'b12'|'vitd'|'folate'|'calcium'|'magnesium'|'zinc'|'hemoglobin'|'tsat'|'mcv'|'mch';
export type NutritionMarker='ferritin'|'b12'|'folate'|'vitd';
export const nutritionMarkers:NutritionMarker[]=['ferritin','b12','folate','vitd'];
export interface LabObservation { value?:number; low?:number; high?:number; unit:string; dietAtResult?:Pick<DietApplication,'week'|'startDay'|'once'> }
export interface MicronutrientContext { intent:'none'|'lab'|'hypothetical'; observations:Partial<Record<LabMarker,LabObservation>>; selected?:NutritionMarker[] }
export const emptyMicronutrientContext=():MicronutrientContext=>({intent:'lab',observations:{},selected:[]});
export interface MarkerDefinition { name:string; short:string; symbol:string; units:string[]; note:string; source:string; pool?:'iron'|'b12'|'vitd'|'folate' }
export const labMarkers:Record<LabMarker,MarkerDefinition>={
 ferritin:{name:'Ferritin',short:'Iron',symbol:'Fe',units:['µg/L','ng/mL'],pool:'iron',note:'Ferritin reflects stored iron, but inflammation can raise it. Hemoglobin and other iron tests add context; one result does not establish the cause.',source:'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'},
 b12:{name:'Serum vitamin B12',short:'B12',symbol:'B₁₂',units:['pmol/L','pg/mL'],pool:'b12',note:'Serum B12 is one observation. Clinical context and sometimes methylmalonic acid help clarify status. It does not directly measure the liver’s B12 reserve.',source:'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/'},
 vitd:{name:'25-OH vitamin D',short:'Vitamin D',symbol:'D',units:['nmol/L','ng/mL'],pool:'vitd',note:'25-hydroxyvitamin D reflects inputs from food and other sources. Assays and reference intervals vary; this model does not forecast your next blood result.',source:'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'},
 folate:{name:'Serum folate',short:'Folate',symbol:'B₉',units:['nmol/L','ng/mL'],pool:'folate',note:'Serum folate responds to recent intake. Red-cell folate is a different test and reflects a longer period; enter serum results here only.',source:'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/'},
 calcium:{name:'Total serum calcium',short:'Calcium',symbol:'Ca',units:['mmol/L','mg/dL'],note:'Total serum calcium is tightly regulated and affected by albumin. It does not measure dietary adequacy or calcium stored in bone. Ionized calcium is a different test.',source:'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'},
 magnesium:{name:'Serum magnesium',short:'Magnesium',symbol:'Mg',units:['mmol/L','mg/dL','mEq/L'],note:'Less than 1% of body magnesium is in serum. A blood result does not directly reveal tissue or bone stores; clinical context matters.',source:'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'},
 zinc:{name:'Serum / plasma zinc',short:'Zinc',symbol:'Zn',units:['µmol/L','µg/dL'],note:'Zinc results vary with sampling time, fasting and inflammation. This is an additional observation, not a routine test recommended for everyone.',source:'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'},
 hemoglobin:{name:'Hemoglobin',short:'Hemoglobin',symbol:'Hb',units:['g/L','g/dL','mmol/L'],note:'Hemoglobin is an oxygen-carrying protein. A low result has several possible causes; this app does not diagnose anemia.',source:'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'},
 mcv:{name:'MCV',short:'MCV',symbol:'MCV',units:['fL'],note:'Average red-cell volume. This supporting hematology result has several possible explanations and is not modeled as a nutrient.',source:'https://www.mayocliniclabs.com/test-catalog/overview/9109'},
 mch:{name:'MCH',short:'MCH',symbol:'MCH',units:['pg','fmol'],note:'Average hemoglobin amount per red cell. This is a supporting observation, not a separate nutrient or an inferred diagnosis.',source:'https://www.mayocliniclabs.com/test-catalog/overview/9109'},
 tsat:{name:'Transferrin saturation',short:'Transferrin saturation',symbol:'TSAT',units:['%'],note:'The proportion of iron-binding sites occupied on transferrin. It adds context to ferritin and other tests; no diagnosis is inferred here.',source:'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'}
};
export function observationError(marker:LabMarker,o:LabObservation):string {
 if(!labMarkers[marker]?.units.includes(o.unit))return 'Choose the unit printed on your result.';
 for(const value of [o.value,o.low,o.high])if(value!==undefined&&(!Number.isFinite(value)||value<0))return 'Enter a non-negative, finite value or leave the field empty.';
 if(o.low!==undefined&&o.high!==undefined&&o.low>=o.high)return 'The upper reference limit must be greater than the lower limit.';
 if(marker==='tsat'&&[o.value,o.low,o.high].some(v=>v!==undefined&&v>100))return 'Transferrin saturation is a percentage between 0 and 100.';
 return '';
}
export function compareObservation(marker:LabMarker,o?:LabObservation):string {
 if(!o||o.value===undefined)return 'No result entered';
 if(observationError(marker,o))return 'Check the value and reference limits';
 if(o.low===undefined&&o.high===undefined)return 'Reference range not supplied';
 if(o.low!==undefined&&o.value<o.low)return 'Below supplied laboratory reference range';
 if(o.high!==undefined&&o.value>o.high)return 'Above supplied laboratory reference range';
 return o.low!==undefined&&o.high!==undefined?'Within supplied laboratory reference range':'Within supplied one-sided laboratory limit';
}
export function validateMicronutrientContext(context:MicronutrientContext){
 if(!['none','lab','hypothetical'].includes(context.intent))throw new Error('Choose the context for this micronutrient experiment.');
 if(context.selected&&(!Array.isArray(context.selected)||context.selected.some(k=>!nutritionMarkers.includes(k))||new Set(context.selected).size!==context.selected.length))throw new Error('Choose supported nutrition markers once each.');
 for(const [key,value]of Object.entries(context.observations)){
  if(!labMarkers[key as LabMarker])throw new Error('Unsupported laboratory marker.');
  const error=observationError(key as LabMarker,value!);if(error)throw new Error(`${labMarkers[key as LabMarker].name}: ${error}`);
 }
}

// Fixed examples, not personalized lab intervals. The patient's supplied bounds always take priority.
// Factors convert DISPLAY units into canonical µg/L ferritin, pmol/L B12, nmol/L folate and 25-OH D.
export function canonicalFactor(marker:NutritionMarker,unit:string):number {
 if(!labMarkers[marker].units.includes(unit))throw new Error('Unsupported marker unit.');
 return marker==='b12'&&unit==='pg/mL'?.7378:marker==='folate'&&unit==='ng/mL'?2.266:marker==='vitd'&&unit==='ng/mL'?2.5:1;
}
export function defaultLabRange(marker:NutritionMarker,unit:string,profile?:PhysiologyProfile){
 const defaults={
  ferritin:{low:profile?.sex==='female'?(profile.age>=51?11:6):31,high:profile?.sex==='female'?(profile.age>=51?328:175):409,source:'https://www.mayocliniclabs.com/test-catalog/overview/619953',label:profile?.sex==='female'?`Default · Mayo female ${profile.age>=51?'51+':'18–50'} interval`:'Default · Mayo adult male interval'},
  b12:{low:180*.7378,high:914*.7378,source:'https://www.mayocliniclabs.com/test-catalog/overview/9154',label:'Default · Mayo laboratory interval'},
  folate:{low:4*2.266,high:undefined,source:'https://www.mayocliniclabs.com/api/sitecore/testcatalog/TestCatalogSetupPDF?testid=800139',label:'Default · Mayo lower reference limit'},
  vitd:{low:50,high:125,source:'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/',label:'Default · NIH guide, not a lab interval'}
 }[marker],factor=canonicalFactor(marker,unit);
 return {...defaults,low:defaults.low/factor,high:defaults.high===undefined?undefined:defaults.high/factor,supplied:false};
}
export function effectiveLabRange(marker:NutritionMarker,o:LabObservation,profile?:PhysiologyProfile){
 return o.low!==undefined||o.high!==undefined?{low:o.low,high:o.high,source:'',label:'Your laboratory’s supplied range',supplied:true}:defaultLabRange(marker,o.unit,profile);
}
export function selectedLabMarkers(context?:MicronutrientContext):NutritionMarker[]{
 return context?.selected??nutritionMarkers.filter(k=>context?.observations[k]?.value!==undefined);
}
export function compareLabResult(marker:NutritionMarker,o:LabObservation,profile?:PhysiologyProfile):string {
 if(observationError(marker,o))return 'Check this entry';if(o.value===undefined)return 'Enter the measured result';
 const range=effectiveLabRange(marker,o,profile),kind=range.supplied?'supplied lab range':marker==='vitd'?'default guide':'default reference';
 return `${range.low!==undefined&&o.value<range.low?'Below':range.high!==undefined&&o.value>range.high?'Above':'Within'} ${kind}`;
}

import {cleanObjectText,normalizeObjectText} from './stable.js';

const fields=['CATEGORY','TEXT','BRAND','MANUFACTURER','MODEL','CAPACITY','BARCODE','SKU','QUANTITY','DIMENSIONS','MATERIAL','FEATURE','CONDITION','COMPLETENESS','UNKNOWN','CONFLICT'];
const string={type:'string'};
export const subjectObservationSchema={type:'object',additionalProperties:false,
 required:['observationId','objectId','field','value','imageIds','certainty','attribution','conflictsWith'],properties:{
  observationId:string,objectId:string,field:{type:'string',enum:fields},value:string,
  imageIds:{type:'array',maxItems:6,items:string},certainty:{type:'string',enum:['CLEAR','UNCERTAIN']},
  attribution:{type:'string',enum:['CONFIRMED','UNASSIGNED']},conflictsWith:{type:'array',maxItems:12,items:string}
 }};
export const subjectRelationshipSchema={type:'object',additionalProperties:false,
 required:['fromObjectId','toObjectId','relation','certainty'],properties:{fromObjectId:string,toObjectId:string,
  relation:{type:'string',enum:['PART_OF','CONTAINS','ON','NEAR','UNKNOWN']},certainty:{type:'string',enum:['CLEAR','UNCERTAIN']}}};
const fail=()=>{throw Object.assign(new Error('The object observations could not be associated safely. Please try clearer photographs.'),{code:'INVALID_SUBJECT_OBSERVATIONS'});};
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(value)?value:'';
const clean=value=>cleanObjectText(value,180);

// Missing version is the compatibility path for already-retained pre-contract continuations.
// A present but invalid version/graph must never downgrade to that path.
export function normalizeSubjectObservationContract(resolution,{imageCount=6}={}){
 if(!resolution||resolution.observationVersion===undefined)return resolution;
 if(resolution.observationVersion!=='1'||!Array.isArray(resolution.candidates)||!resolution.candidates.length||resolution.candidates.length>6)fail();
 const seen=new Set(),observations=new Map(),unassigned=[];
 const candidates=resolution.candidates.map(candidate=>{
  const objectId=id(candidate.objectId);if(!objectId||seen.has(objectId)||!Array.isArray(candidate.observations)||candidate.observations.length>32)fail();seen.add(objectId);
  return {...candidate,objectId,label:cleanObjectText(candidate.label,60),observations:[]};
 });
 const normalize=(observation,containerId)=>{
  if(!observation||!id(observation.observationId)||observations.has(observation.observationId)||!fields.includes(observation.field)||!['CLEAR','UNCERTAIN'].includes(observation.certainty)||!['CONFIRMED','UNASSIGNED'].includes(observation.attribution)||!Array.isArray(observation.imageIds)||observation.imageIds.length>6||!Array.isArray(observation.conflictsWith)||observation.conflictsWith.length>12||!clean(observation.value))fail();
  if(observation.objectId&&!seen.has(observation.objectId))fail();
  if(observation.imageIds.some(ref=>!/^image-[1-6]$/.test(ref)||Number(ref.slice(6))>imageCount))fail();
  // Contradictory containment or missing attribution is uncertainty, never a host-to-accessory transfer.
  const assigned=containerId&&observation.objectId===containerId&&observation.attribution==='CONFIRMED';
  const record={observationId:observation.observationId,objectId:assigned?containerId:'',field:observation.field,value:clean(observation.value),
   imageIds:[...new Set(observation.imageIds)],certainty:observation.certainty,attribution:assigned?'CONFIRMED':'UNASSIGNED',conflictsWith:observation.conflictsWith.map(id)};
  if(record.conflictsWith.some(v=>!v))fail();observations.set(record.observationId,record);
  if(!assigned)unassigned.push(record);return assigned?record:null;
 };
 resolution.candidates.forEach((candidate,index)=>{candidates[index].observations=candidate.observations.map(o=>normalize(o,candidates[index].objectId)).filter(Boolean);});
 if(!Array.isArray(resolution.unassignedObservations)||resolution.unassignedObservations.length>32)fail();
 for(const observation of resolution.unassignedObservations)normalize(observation,'');
 for(const record of observations.values())if(record.conflictsWith.some(ref=>!observations.has(ref)||ref===record.observationId))fail();
 // Treat conflict edges symmetrically; neither side can silently become a search fact.
 for(const record of observations.values())for(const ref of record.conflictsWith){const other=observations.get(ref);if(!other.conflictsWith.includes(record.observationId))other.conflictsWith.push(record.observationId);}
 if(!Array.isArray(resolution.relationships)||resolution.relationships.length>24)fail();
 const relationships=resolution.relationships.map(r=>{
  if(!seen.has(r.fromObjectId)||!seen.has(r.toObjectId)||r.fromObjectId===r.toObjectId||!['PART_OF','CONTAINS','ON','NEAR','UNKNOWN'].includes(r.relation)||!['CLEAR','UNCERTAIN'].includes(r.certainty))fail();
  return {fromObjectId:r.fromObjectId,toObjectId:r.toObjectId,relation:r.relation,certainty:r.certainty};
 });
 return {...resolution,candidates,unassignedObservations:unassigned,relationships};
}

export function supportedSubjectObservation(observation){
 const prose=/\b(?:likely|possibly|uncertain|unverified|not (?:independently )?verified|attribution|holding|containing|next to|beside)\b/i;
 return observation.attribution==='CONFIRMED'&&observation.certainty==='CLEAR'&&!observation.conflictsWith.length&&observation.imageIds.length>0&&!['UNKNOWN','CONFLICT'].includes(observation.field)&&!prose.test(observation.value);
}
export function projectSubjectObservations(identity,selected,resolution){
 if(resolution.observationVersion!=='1')return null;
 const observations=selected.observations||[],supported=observations.filter(supportedSubjectObservation);
 const values=field=>supported.filter(o=>o.field===field).map(o=>o.value);
 const first=field=>values(field)[0]||'';
 // Display labels are useful for the question, but are never category/identity evidence.
 const categories=[...new Set(values('CATEGORY'))];
 if(categories.length!==1)fail();
 const category=categories[0];
 const normalizedCategory=` ${normalizeObjectText(category)} `;
 const ownMarks=new Set(supported.filter(o=>['TEXT','BRAND','MANUFACTURER','MODEL'].includes(o.field)).map(o=>normalizeObjectText(o.value)));
 const foreignMarks=resolution.candidates.filter(c=>c.objectId!==selected.objectId).flatMap(c=>c.observations||[])
  .filter(o=>supportedSubjectObservation(o)&&['TEXT','BRAND','MANUFACTURER','MODEL'].includes(o.field)).map(o=>normalizeObjectText(o.value));
 if(foreignMarks.some(mark=>!ownMarks.has(mark)&&normalizedCategory.includes(` ${mark} `)))fail();
 const markFields=new Set(['TEXT','BRAND','MANUFACTURER','MODEL','CAPACITY','BARCODE','SKU','QUANTITY','DIMENSIONS']);
 const marks=supported.filter(o=>markFields.has(o.field)).map(o=>o.value);
 const uncertain=observations.filter(o=>!supportedSubjectObservation(o));
 return {
  candidate:{...selected,label:category,visibleMarks:marks,brand:first('BRAND'),manufacturer:first('MANUFACTURER'),model:first('MODEL'),capacity:first('CAPACITY'),upcBarcode:first('BARCODE'),sku:first('SKU'),packageQuantity:first('QUANTITY'),dimensions:first('DIMENSIONS'),material:first('MATERIAL'),features:values('FEATURE'),description:category},
  context:{version:'1',selectedObjectId:selected.objectId,observations,relationships:resolution.relationships,
   unassignedObservations:resolution.unassignedObservations,
   // Global pre-projection claims remain unbound and are never promoted into selected-object facts.
   unassignedCaveats:{unknowns:identity.identityUnknowns||[],conflicts:identity.identityConflictNotes||[],condition:identity.condition||'Unknown'}},
  unknowns:uncertain.map(o=>`${o.field}: ${o.value}`),conflicts:observations.filter(o=>o.field==='CONFLICT'||o.conflictsWith.length).map(o=>o.value),
  condition:values('CONDITION').join('; ')||'Unknown',completeness:values('COMPLETENESS').join('; ')||'Unknown'
 };
}

// Used by every query constructor, including fallback/refinement paths. No scene prose or
// unassigned/uncertain/conflicted observation may acquire search authority here.
export function selectedSubjectSearchTerms(identity){
 const context=identity.observationContext;if(!context)return null;
 const fields=new Set(['TEXT','BRAND','MANUFACTURER','MODEL','CAPACITY','BARCODE','SKU','QUANTITY','DIMENSIONS','MATERIAL','FEATURE']);
 return [...new Set([identity.subjectIdentity,...context.observations.filter(o=>supportedSubjectObservation(o)&&fields.has(o.field)).map(o=>o.value)])].filter(Boolean);
}
export function observationQuerySupported(query,identity){
 const terms=selectedSubjectSearchTerms(identity);if(!terms)return true;
 const corpus=new Set(terms.flatMap(term=>normalizeObjectText(term).split(/\s+/)));
 const searchSyntax=new Set(['site','comparable','market','context','exact','item','identification','sold','completed','ebay','etsy','com','www','amazon','walmart','target','bestbuy','auctions','auction']);
 return normalizeObjectText(query.replace(/site:[^\s]+/g,'')).split(/\s+/).filter(Boolean).every(token=>corpus.has(token)||searchSyntax.has(token));
}

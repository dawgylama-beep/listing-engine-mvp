import {cleanObjectText,normalizeObjectText,stableInternalId} from './stable.js';
import {wholeObjectCategory} from './whole-object.js';

const candidateSchema={type:'object',additionalProperties:false,required:['label','kind','description','visibleMarks','brand','model','capacity','features','upcBarcode','sku','manufacturer','packageQuantity','dimensions','material'],properties:{
 label:{type:'string'},kind:{type:'string',enum:['OBJECT','COMPONENT','ACCESSORY','CONTENTS']},description:{type:'string'},
 visibleMarks:{type:'array',maxItems:12,items:{type:'string'}},brand:{type:'string'},model:{type:'string'},capacity:{type:'string'},features:{type:'array',maxItems:12,items:{type:'string'}},
 upcBarcode:{type:'string'},sku:{type:'string'},manufacturer:{type:'string'},packageQuantity:{type:'string'},dimensions:{type:'string'},material:{type:'string'}
}};
export const subjectResolutionSchema={type:'object',additionalProperties:false,required:['status','selectedIndex','candidates'],properties:{
 status:{type:'string',enum:['CLEAR','AMBIGUOUS']},selectedIndex:{type:'integer',minimum:-1,maximum:5},candidates:{type:'array',minItems:1,maxItems:6,items:candidateSchema}
}};
const text=value=>cleanObjectText(value,180);
export function resolveEvaluationSubject(identity={},intake={}){
 const raw=identity.subjectResolution;
 const candidates=(raw?.candidates||[]).slice(0,6).map(candidate=>({
  ...candidate,label:cleanObjectText(candidate.label,60),description:text(candidate.description),
  visibleMarks:(candidate.visibleMarks||[]).map(text).filter(Boolean),features:(candidate.features||[]).map(text).filter(Boolean)
 })).filter(candidate=>candidate.label).map((candidate,index)=>({...candidate,id:stableInternalId('subject',[index,candidate.label,candidate.kind],16)}));
 if(!candidates.length){
  const label=wholeObjectCategory(identity.visualRecognition?.visualSubject||identity.subjectIdentity||identity.category||'');
  return {status:'CLEAR',selected:{id:stableInternalId('subject',label,16),label,kind:'OBJECT'},candidates:[],legacy:true};
 }
 const description=normalizeObjectText(intake.item_name);
 const described=candidates.filter(candidate=>description&&(normalizeObjectText(candidate.label)===description||normalizeObjectText(candidate.label).includes(description)));
 const chosen=candidates.find(candidate=>candidate.id===intake.subject_selection);
 const selected=chosen|| (described.length===1?described[0]:null)
  || (raw.status==='CLEAR'&&Number.isInteger(raw.selectedIndex)?candidates[raw.selectedIndex]:null)
  || (candidates.length===1?candidates[0]:null);
 const names=candidates.map(candidate=>candidate.label);
 const joined=names.length<3?names.join(' or '):names.slice(0,-1).join(', ')+', or '+names.at(-1);
 return {status:selected?'CLEAR':'AMBIGUOUS',selected,candidates,question:`Which item would you like evaluated: ${joined}?`};
}
export function projectEvaluationSubject(identity,resolution){
 const selected=resolution.selected;
 if(!selected)throw Object.assign(new Error('Subject selection is required.'),{code:'SUBJECT_SELECTION_REQUIRED'});
 const subjectSelection={id:selected.id,label:selected.label,kind:selected.kind,options:resolution.candidates.map(({id,label,kind})=>({id,label,kind}))};
 if(resolution.legacy)return {...identity,subjectSelection};
 const marks=selected.visibleMarks||[];
 const supported=value=>value&&marks.some(mark=>normalizeObjectText(mark).includes(normalizeObjectText(value)))?value:'Unknown';
 // The other objects' maker/model/price clues cannot identify the chosen subject.
 const cleared=Object.fromEntries(['brand','manufacturer','makerIdentity','model','modelOrItemNumber','sku','styleNumber','upcBarcode','brandSeries','manufacturerLocationText','copyrightWording','year','size','dimensions','material','color','shape','construction','currentAskingPrice','visiblePrice','frontBoxWording','backLabelWording','licensingStickerText','teamName','schoolName','mascot','recognizedOrganization','recognizedInstitution','recognizedCharacter','recognizedTheme','eraEstimate','packageQuantity','packageSize','unitCount','missingComponentStatus','accessories','condition'].map(key=>[key,'Unknown']));
 const label=wholeObjectCategory(selected.label);
 const brand=supported(selected.brand),model=supported(selected.model),capacity=supported(selected.capacity);
 return {...identity,...cleared,subjectSelection,subjectResolution:{status:'CLEAR',selectedIndex:0,candidates:[selected]},subjectIdentity:label,visualSubject:label,visualSubjectCategory:label,category:label,
  likelyItemDescription:label,productNameOrBoxTitle:label,exactProductIdentity:'Unknown',exactProductConfidence:'Insufficient',
  brand,recognizedBrand:brand,manufacturer:supported(selected.manufacturer)==='Unknown'?brand:supported(selected.manufacturer),makerIdentity:brand,model,modelOrItemNumber:model,dimensions:capacity!=='Unknown'?capacity:supported(selected.dimensions),
  upcBarcode:supported(selected.upcBarcode),sku:supported(selected.sku),packageQuantity:supported(selected.packageQuantity),material:selected.material||'Unknown',
  licensingStatus:'Not verified',authenticityStatus:'Not verified',exactComparableStatus:'No exact comparable verified',
  visibleText:marks,textIdentityEvidence:marks,strongestSearchableIdentifiers:marks,visualIdentityEvidence:selected.features||[],diagnosticVisualDetails:selected.features||[],
  distinctiveVisualDescription:selected.description||label,identityHypotheses:[],identityConflictNotes:[],
  identityUnknowns:['Exact variant','Working condition','Compatible market evidence'],
  canonicalEvidenceProjection:{...(identity.canonicalEvidenceProjection||{}),directlySupportedFields:['brand','manufacturer','makerIdentity','model','modelOrItemNumber','dimensions'].filter(key=>({brand,manufacturer:brand,makerIdentity:brand,model,modelOrItemNumber:model,dimensions:capacity})[key]!=='Unknown')},
  visualRecognition:{...(identity.visualRecognition||{}),visualSubject:label,visualSubjectCategory:label,recognizedBrand:brand,
   recognizedOrganization:'Unknown',recognizedInstitution:'Unknown',recognizedCharacter:'Unknown',recognizedTheme:'Unknown',
   visibleWords:marks,visibleLetters:[],visibleLogos:[],visibleColors:[],visualStyle:'Unknown',distinctiveFeatures:selected.features||[],visualEvidence:selected.features||[],visualSummary:selected.description||label,possibleInterpretations:[label]}
 };
}

// Unattributed owner clues cannot migrate to a different subject in a scene.
export function scopeEvaluationSubjectInput(intake={},notes='',resolution){
 if(resolution.legacy)return {intake,notes};
 const description=normalizeObjectText(intake.item_name);
 const described=resolution.candidates.filter(candidate=>description&&(normalizeObjectText(candidate.label)===description||normalizeObjectText(candidate.label).includes(description)));
 const associated=resolution.candidates.length===1||(described.length===1&&described[0].id===resolution.selected.id);
 const scoped={...intake,item_name:resolution.selected.label};
 if(associated)return {intake:scoped,notes};
 for(const key of ['known_brand','known_manufacturer','known_model','known_sku','known_upc','known_upc_digits','approximate_age_era','size_dimensions','package_quantity','item_condition','item_completeness','buyer_notes','identity_confirmation'])scoped[key]='';
 scoped.condition_concerns=[];
 return {intake:scoped,notes:resolution.selected.description||resolution.selected.label};
}

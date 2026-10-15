// SYNTHETIC recognition-response contracts, not new model observations or live trials.
// Scene/caveat provenance: retained Oct12 scale report and blind-object-v1 OBJ-002
// frozen key + RUN-002. These annotations cannot establish recognition accuracy.
import {controlledBrowserModelResponse} from '../helpers/build-browser-handler-response.mjs';
export const observation=(observationId,objectId,field,value,extra={})=>({observationId,objectId,field,value,imageIds:['image-1'],certainty:'CLEAR',attribution:'CONFIRMED',conflictsWith:[],...extra});
export const object=(objectId,label,kind,observations)=>({objectId,label,kind,description:label,visibleMarks:[],brand:'',model:'',capacity:'',features:[],upcBarcode:'',sku:'',manufacturer:'',packageQuantity:'',dimensions:'',material:'',observations:[observation(objectId+'-category',objectId,'CATEGORY',label),...observations]});
export function syntheticScaleContract(){
 return {...controlledBrowserModelResponse('item_identity','customer-model-corroboration'),
  // Deliberately inconsistent legacy summaries prove graph authority in parsing/projection.
  identityConflictNotes:['Manufacturing attribution remains unverified'],identityUnknowns:['Scene-level condition unassigned'],
  subjectResolution:{observationVersion:'1',status:'AMBIGUOUS',selectedIndex:-1,candidates:[
   {...object('scale','mechanical weighing scale','OBJECT',[
    observation('scale-maker','scale','BRAND','Alexanderwerk'),observation('scale-capacity','scale','CAPACITY','10 kg'),
    observation('scale-feature','scale','FEATURE','round dial'),observation('scale-condition','scale','CONDITION','surface wear'),
    observation('scale-unknown','scale','UNKNOWN','Working condition unverified',{certainty:'UNCERTAIN'})
   ]),description:'Scale with bowl holding six apples',visibleMarks:['Alexanderwerk','precise manufacturing attribution is not independently verified'],brand:'Alexanderwerk'},
   {...object('bowl','weighing bowl','ACCESSORY',[observation('misplaced-mark','scale','BRAND','HostMark')]),visibleMarks:['HostMark'],brand:'HostMark'},
   object('apples','apples','CONTENTS',[])
  ],unassignedObservations:[observation('unreadable','', 'MODEL','Uncertain numeral',{certainty:'UNCERTAIN',attribution:'UNASSIGNED'})],
  relationships:[{fromObjectId:'scale',toObjectId:'bowl',relation:'CONTAINS',certainty:'CLEAR'},{fromObjectId:'bowl',toObjectId:'apples',relation:'CONTAINS',certainty:'CLEAR'}]}
 };
}
export function syntheticBialettiContract(){
 return {...controlledBrowserModelResponse('item_identity','customer-model-corroboration'),
  identityConflictNotes:['Earlier description called this a pot base with missing upper chamber'],identityUnknowns:['Production year unverified'],
  subjectResolution:{observationVersion:'1',status:'CLEAR',selectedIndex:0,candidates:[
   {...object('coffee-maker','stovetop coffee maker','OBJECT',[
    observation('bialetti-mark','coffee-maker','BRAND','Bialetti'),observation('single-spout','coffee-maker','FEATURE','single delivery spout'),
    observation('boiler','coffee-maker','FEATURE','faceted lower boiler'),observation('coffee-condition','coffee-maker','CONDITION','surface wear'),
    observation('gasket','coffee-maker','UNKNOWN','Gasket and safety valve function unverified',{certainty:'UNCERTAIN'}),
    observation('capacity-conflict','coffee-maker','CAPACITY','2 Tazza',{certainty:'UNCERTAIN',conflictsWith:['capacity-unknown']}),
    observation('capacity-unknown','coffee-maker','UNKNOWN','Capacity uncertain',{certainty:'UNCERTAIN'})
   ]),description:'Espresso pot base, likely 2 Tazza, credited to L. Durchin',visibleMarks:['2 Tazza','L. Durchin'],brand:'L. Durchin',model:'2 Tazza'}
  ],unassignedObservations:[observation('missing-parts','', 'COMPLETENESS','Missing upper chamber is an unverified interpretation',{certainty:'UNCERTAIN',attribution:'UNASSIGNED'})],relationships:[]}
 };
}

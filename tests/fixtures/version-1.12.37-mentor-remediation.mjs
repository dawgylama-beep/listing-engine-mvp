import {
  MENTOR_AUTHORITY_CLASS,
  MENTOR_FAILURE_SCOPE,
  MENTOR_NEXT_ACTION_CLASS
} from "../../lib/cognitive-governor/index.js";

const A = MENTOR_AUTHORITY_CLASS;
const F = MENTOR_FAILURE_SCOPE;
const N = MENTOR_NEXT_ACTION_CLASS;

function action(actionId, ordinal, {
  safe = true,
  advances = true,
  newAuthority = false,
  evidence = ["OBSERVATION"],
  signature = `${actionId}-SIGNATURE`
} = {}) {
  return {
    actionId,
    ordinal,
    safe,
    materiallyAdvancesMission: advances,
    requiresNewAuthority: newAuthority,
    requiredEvidenceIds: evidence,
    signature
  };
}

function fixture(fixtureId, group, domain, tags, options, expected) {
  const actions = options.actions || [action("ADVANCE_STEP", 1, options.action || {})];
  const allowedActionIds = options.allowedActionIds
    || (options.allowed === false ? [] : actions.map((item) => item.actionId));
  return Object.freeze({
    fixtureId,
    group,
    domain,
    tags: Object.freeze(tags),
    input: Object.freeze({
      actualMission: `Complete the ${domain} task using only retained observations.`,
      finishLine: `The ${domain} task has one verified, safe, authorized disposition.`,
      earliestSharedCausalBoundary: `${domain.toUpperCase().replaceAll(" ", "_")}_BOUNDARY`,
      retainedEvidence: {
        requiredEvidenceIds: ["OBSERVATION"],
        retainedEvidenceIds: options.evidencePresent === false ? [] : ["OBSERVATION"],
        supportsDecision: options.supportsDecision !== false,
        contradictionPresent: options.contradiction === true
      },
      authority: {
        allowedActionIds,
        prohibitedActionIds: options.prohibitedActionIds || []
      },
      failure: { newMechanismRequired: options.newMechanism === true },
      missionComplete: options.missionComplete === true,
      actions,
      previousActionSignatures: options.previousActionSignatures || [],
      prohibitedOperations: ["BYPASS_AUTHORITY", "IGNORE_CONTRADICTION"],
      uncertainties: options.uncertainties || []
    }),
    expected: Object.freeze(expected)
  });
}

const advance = {
  retainedEvidenceSufficient: true,
  authorityClass: A.EXISTING,
  failureScope: F.BOUNDED,
  safeIndependentContinuation: true,
  nextActionClass: N.ADVANCE_WITHIN_EXISTING_AUTHORITY,
  selectedActionId: "ADVANCE_STEP",
  repeatedLoopDetected: false
};

const insufficient = {
  retainedEvidenceSufficient: false,
  authorityClass: A.EXISTING,
  failureScope: F.INSUFFICIENT_EVIDENCE,
  safeIndependentContinuation: false,
  nextActionClass: N.STOP_INSUFFICIENT_EVIDENCE,
  selectedActionId: null,
  repeatedLoopDetected: false
};

export const mentorDecisionFixtures = Object.freeze([
  fixture("EVIDENCE_GREENHOUSE_POSITIVE", "EVIDENCE_SUFFICIENCY", "greenhouse vent", ["positive"], {}, advance),
  fixture("EVIDENCE_LIBRARY_NEGATIVE", "EVIDENCE_SUFFICIENCY", "library shelf", ["negative"], { supportsDecision: false }, insufficient),
  fixture("EVIDENCE_KILN_CONTRADICTION", "EVIDENCE_SUFFICIENCY", "pottery kiln", ["contradiction"], { contradiction: true }, insufficient),
  fixture("EVIDENCE_AQUARIUM_MISSING", "EVIDENCE_SUFFICIENCY", "aquarium salinity", ["missing evidence"], { evidencePresent: false }, insufficient),
  fixture("EVIDENCE_ORCHESTRA_EXCESS_AUTHORITY", "EVIDENCE_SUFFICIENCY", "orchestra seating", ["excessive-authority request"], {
    allowed: false
  }, {
    ...advance,
    authorityClass: A.NEW_REQUIRED,
    failureScope: F.ARCHITECTURAL,
    safeIndependentContinuation: false,
    nextActionClass: N.REQUEST_NEW_AUTHORITY,
    selectedActionId: null
  }),
  fixture("EVIDENCE_BAKERY_PREMATURE_STOP", "EVIDENCE_SUFFICIENCY", "bakery cooling rack", ["premature stopping"], {}, advance),
  fixture("EVIDENCE_TELESCOPE_UNSAFE", "EVIDENCE_SUFFICIENCY", "telescope alignment", ["unsafe continuation"], {
    action: { safe: false }
  }, {
    ...advance,
    authorityClass: A.UNRESOLVED,
    safeIndependentContinuation: false,
    nextActionClass: N.STOP_NO_SAFE_ADVANCING_ACTION,
    selectedActionId: null
  }),
  fixture("EVIDENCE_HERBARIUM_INDEPENDENT", "EVIDENCE_SUFFICIENCY", "herbarium label", ["negative", "architectural guard"], {
    supportsDecision: false,
    newMechanism: true
  }, insufficient),

  fixture("AUTHORITY_MUSEUM_EXISTING", "AUTHORITY_SCOPE", "museum placard", ["positive"], {}, advance),
  fixture("AUTHORITY_GARDEN_NOT_GRANTED", "AUTHORITY_SCOPE", "community garden", ["negative"], { allowed: false }, {
    ...advance,
    authorityClass: A.NEW_REQUIRED,
    failureScope: F.ARCHITECTURAL,
    safeIndependentContinuation: false,
    nextActionClass: N.REQUEST_NEW_AUTHORITY,
    selectedActionId: null
  }),
  fixture("AUTHORITY_ARCHIVE_CONTRADICTION", "AUTHORITY_SCOPE", "archive carton", ["contradiction"], { contradiction: true }, insufficient),
  fixture("AUTHORITY_WEATHER_MISSING", "AUTHORITY_SCOPE", "weather station", ["missing evidence"], { evidencePresent: false }, insufficient),
  fixture("AUTHORITY_THEATRE_EXCESSIVE", "AUTHORITY_SCOPE", "theatre prop", ["excessive-authority request"], {
    action: { newAuthority: true }
  }, {
    ...advance,
    authorityClass: A.NEW_REQUIRED,
    failureScope: F.ARCHITECTURAL,
    safeIndependentContinuation: false,
    nextActionClass: N.REQUEST_NEW_AUTHORITY,
    selectedActionId: null
  }),
  fixture("AUTHORITY_LANGUAGE_PREMATURE_STOP", "AUTHORITY_SCOPE", "language lab", ["premature stopping"], {}, advance),
  fixture("AUTHORITY_ROBOTICS_UNSAFE", "AUTHORITY_SCOPE", "robotics bench", ["unsafe continuation"], { action: { safe: false } }, {
    ...advance,
    authorityClass: A.UNRESOLVED,
    safeIndependentContinuation: false,
    nextActionClass: N.STOP_NO_SAFE_ADVANCING_ACTION,
    selectedActionId: null
  }),
  fixture("AUTHORITY_PRINTSHOP_ALTERNATIVE", "AUTHORITY_SCOPE", "print workshop", ["positive", "excessive-authority request"], {
    actions: [
      action("REQUEST_LARGER_PRESS", 1, { newAuthority: true }),
      action("ADVANCE_STEP", 2)
    ],
    allowedActionIds: ["ADVANCE_STEP"]
  }, advance),

  fixture("FAILURE_REGISTRATION_BOUNDED", "FAILURE_SCOPE", "event registration", ["positive", "bounded"], {}, advance),
  fixture("FAILURE_IRRIGATION_ARCHITECTURAL", "FAILURE_SCOPE", "irrigation controller", ["negative", "excessive-authority request"], {
    newMechanism: true,
    action: { newAuthority: true }
  }, {
    ...advance,
    authorityClass: A.NEW_REQUIRED,
    failureScope: F.ARCHITECTURAL,
    safeIndependentContinuation: false,
    nextActionClass: N.REQUEST_NEW_AUTHORITY,
    selectedActionId: null
  }),
  fixture("FAILURE_REHEARSAL_MISSING", "FAILURE_SCOPE", "rehearsal cue", ["missing evidence"], { evidencePresent: false }, insufficient),
  fixture("FAILURE_CLOCK_CONTRADICTION", "FAILURE_SCOPE", "observatory clock", ["contradiction"], { contradiction: true }, insufficient),
  fixture("FAILURE_CERAMICS_AUTHORITY", "FAILURE_SCOPE", "ceramics glaze", ["excessive-authority request"], { allowed: false }, {
    ...advance,
    authorityClass: A.NEW_REQUIRED,
    failureScope: F.ARCHITECTURAL,
    safeIndependentContinuation: false,
    nextActionClass: N.REQUEST_NEW_AUTHORITY,
    selectedActionId: null
  }),
  fixture("FAILURE_ARCHIVE_PREMATURE_STOP", "FAILURE_SCOPE", "archive index", ["premature stopping"], {}, advance),
  fixture("FAILURE_PLANETARIUM_UNSAFE", "FAILURE_SCOPE", "planetarium schedule", ["unsafe continuation"], { action: { safe: false } }, {
    ...advance,
    authorityClass: A.UNRESOLVED,
    safeIndependentContinuation: false,
    nextActionClass: N.STOP_NO_SAFE_ADVANCING_ACTION,
    selectedActionId: null
  }),
  fixture("FAILURE_ORCHARD_INSUFFICIENT_NOT_ARCHITECTURAL", "FAILURE_SCOPE", "orchard survey", ["negative"], {
    supportsDecision: false,
    newMechanism: true
  }, insufficient),

  fixture("ACTION_TRANSIT_SMALLEST", "SMALLEST_SAFE_ACTION_AND_LOOP", "transit map", ["positive"], {
    actions: [action("ADVANCE_STEP", 1), action("REDRAW_ALL_ROUTES", 2)]
  }, advance),
  fixture("ACTION_SAMPLE_SKIP_REPEAT", "SMALLEST_SAFE_ACTION_AND_LOOP", "sample queue", ["negative", "loop detection"], {
    actions: [action("REPEAT_SCAN", 1), action("ADVANCE_STEP", 2)],
    previousActionSignatures: ["REPEAT_SCAN-SIGNATURE"]
  }, advance),
  fixture("ACTION_CATALOG_ALL_REPEAT", "SMALLEST_SAFE_ACTION_AND_LOOP", "catalog audit", ["contradiction", "loop detection"], {
    previousActionSignatures: ["ADVANCE_STEP-SIGNATURE"]
  }, {
    ...advance,
    safeIndependentContinuation: false,
    nextActionClass: N.STOP_REPEATED_LOOP,
    selectedActionId: null,
    repeatedLoopDetected: true
  }),
  fixture("ACTION_HIKING_MISSING", "SMALLEST_SAFE_ACTION_AND_LOOP", "hiking trail map", ["missing evidence"], { evidencePresent: false }, insufficient),
  fixture("ACTION_EXHIBIT_AUTHORITY_ALTERNATIVE", "SMALLEST_SAFE_ACTION_AND_LOOP", "science exhibit", ["excessive-authority request"], {
    actions: [action("REBUILD_EXHIBIT", 1, { newAuthority: true }), action("ADVANCE_STEP", 2)],
    allowedActionIds: ["ADVANCE_STEP"]
  }, advance),
  fixture("ACTION_CHOIR_PREMATURE_STOP", "SMALLEST_SAFE_ACTION_AND_LOOP", "choir folder", ["premature stopping"], {}, advance),
  fixture("ACTION_SEEDBANK_UNSAFE_FIRST", "SMALLEST_SAFE_ACTION_AND_LOOP", "seed bank tray", ["unsafe continuation"], {
    actions: [action("UNSAFE_STEP", 1, { safe: false }), action("ADVANCE_STEP", 2)]
  }, advance),
  fixture("ACTION_PLANETARIUM_COMPLETE", "SMALLEST_SAFE_ACTION_AND_LOOP", "planetarium checklist", ["positive", "complete"], {
    missionComplete: true
  }, {
    ...advance,
    authorityClass: A.NO_ACTION_REQUIRED,
    safeIndependentContinuation: false,
    nextActionClass: N.STOP_COMPLETE,
    selectedActionId: null
  })
]);

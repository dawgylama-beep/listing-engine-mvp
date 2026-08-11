import assert from "node:assert/strict";
import { boundedNumber, boundedString, boundedStringArray, fieldContract } from "./bounded-request-contract.mjs";
import { ACTION_REGISTRY_VERSION, actionDefinition, legalActionsForState } from "./executive-action-registry.mjs";

const closedObject = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

function referenceArray(ids, minimum, contractPath) {
  const contract = fieldContract(contractPath);
  assert.equal(contract.type, "array");
  return {
    type: "array",
    items: ids.length ? { type: "string", enum: [...ids] } : boundedString(`${contractPath}[]`),
    minItems: minimum,
    maxItems: Math.min(ids.length, contract.maxItems)
  };
}

export function createStateConditionedProviderActionSchema({
  episodeId, executiveState, observedStateHash, actionId,
  availableEvidenceIds = ["template-visible-artifact"], availableMemoryIds = []
}) {
  assert.match(episodeId, /^[A-Za-z0-9._:-]+$/);
  assert.match(actionId, /^[A-Za-z0-9._:-]+$/);
  assert.match(observedStateHash, /^[a-f0-9]{64}$/);
  assert.ok(Array.isArray(availableEvidenceIds) && availableEvidenceIds.length > 0);
  assert.ok(Array.isArray(availableMemoryIds));
  const actions = legalActionsForState(executiveState, { memoryIds: availableMemoryIds });
  assert.ok(actions.length, `unsupported qualification executive state ${executiveState}`);
  return closedObject({
    schemaVersion: { type: "string", enum: [ACTION_REGISTRY_VERSION] },
    actionId: { type: "string", enum: [actionId] },
    episodeId: { type: "string", enum: [episodeId] },
    executiveState: { type: "string", enum: [executiveState] },
    observedStateHash: { type: "string", enum: [observedStateHash] },
    factualFindings: boundedStringArray("provider.factualFindings", "provider.factualFindings[]"),
    uncertainties: boundedStringArray("provider.uncertainties", "provider.uncertainties[]"),
    confidence: boundedNumber("provider.confidence"),
    boundedRationaleSummary: boundedString("provider.boundedRationaleSummary", { minLength: 1, pattern: "\\S" }),
    prohibitedOperations: boundedStringArray("provider.prohibitedOperations", "provider.prohibitedOperations[]", { minimum: 1 }),
    decision: {
      anyOf: actions.map((actionType) => {
        const definition = actionDefinition(actionType);
        return closedObject({
          actionType: { type: "string", enum: [actionType] },
          details: structuredClone(definition.detailsSchema),
          evidenceReferences: referenceArray(availableEvidenceIds, definition.minimumEvidenceReferences, "provider.decision.evidenceReferences"),
          memoryReferences: referenceArray(availableMemoryIds, definition.minimumMemoryReferences, "provider.decision.memoryReferences"),
          authorityClass: { type: "string", enum: [...definition.authorityClasses] }
        });
      })
    }
  });
}

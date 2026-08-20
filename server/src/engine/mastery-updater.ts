// ============================================================
// Mastery Updater — Evidence-weighted proficiency updates
// ============================================================
// Stronger evidence types produce larger proficiency changes.
// Proficiency is updated using a weighted Bayesian-inspired approach:
//   new_proficiency = old × (1 - weight) + score × weight
// Confidence increases with stronger evidence types.
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { SkillState, Evidence, EvidenceType } from '../models/types.js';
import { EVIDENCE_WEIGHTS } from '../models/types.js';

/**
 * Recency decay factor — evidence loses confidence over time.
 * Returns a factor between 0.5 and 1.0.
 */
function recencyFactor(evidenceDate: Date, now: Date = new Date()): number {
  const daysSince = (now.getTime() - evidenceDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince < 7) return 1.0;
  if (daysSince < 30) return 0.95;
  if (daysSince < 90) return 0.85;
  if (daysSince < 180) return 0.75;
  if (daysSince < 365) return 0.65;
  return 0.5;
}

/**
 * Update proficiency for a single skill based on new evidence.
 *
 * Returns the updated SkillState (does not mutate the input).
 */
export function updateProficiency(
  currentState: SkillState | undefined,
  newEvidence: Evidence,
): SkillState {
  const now = new Date();
  const weight = EVIDENCE_WEIGHTS[newEvidence.type];
  const score = newEvidence.score ?? 0;

  if (!currentState) {
    // No prior state — initialize from this evidence
    return {
      skillId: '',  // Caller should set this
      proficiency: score * weight,
      confidence: weight * 0.7,
      evidence: [newEvidence],
      lastUpdated: now,
    };
  }

  // Calculate recency-adjusted old proficiency
  const oldRecency = currentState.evidence.length > 0
    ? recencyFactor(new Date(currentState.lastUpdated), now)
    : 0.5;

  // Weighted update: stronger evidence has more influence
  const effectiveWeight = weight * 0.5; // Scale weight to prevent over-correction
  const newProficiency = Math.round(
    Math.min(100, Math.max(0,
      currentState.proficiency * (1 - effectiveWeight) + score * effectiveWeight
    ))
  );

  // Update confidence based on evidence strength and recency
  const evidenceConfidence = weight;
  const combinedConfidence = Math.min(1,
    currentState.confidence * oldRecency * 0.6 + evidenceConfidence * 0.4
  );

  return {
    skillId: currentState.skillId,
    proficiency: newProficiency,
    confidence: Math.round(combinedConfidence * 100) / 100,
    evidence: [...currentState.evidence, newEvidence],
    lastUpdated: now,
  };
}

/**
 * Update multiple skills based on a diagnostic result.
 *
 * Each diagnostic answer maps to a skill and provides DIAGNOSTIC evidence.
 */
export function updateFromDiagnostic(
  skillStates: SkillState[],
  diagnosticResults: Array<{ skillId: string; score: number }>,
): {
  updatedStates: SkillState[];
  changes: Array<{ skillId: string; before: number; after: number; confidenceBefore: number; confidenceAfter: number }>;
} {
  const stateMap = new Map<string, SkillState>();
  for (const state of skillStates) {
    stateMap.set(state.skillId, { ...state });
  }

  const changes: Array<{ skillId: string; before: number; after: number; confidenceBefore: number; confidenceAfter: number }> = [];

  for (const result of diagnosticResults) {
    const current = stateMap.get(result.skillId);
    const before = current?.proficiency ?? 0;
    const confBefore = current?.confidence ?? 0;

    const evidence: Evidence = {
      type: 'DIAGNOSTIC',
      score: result.score,
      source: 'diagnostic',
      timestamp: new Date(),
    };

    const updated = updateProficiency(current, evidence);
    updated.skillId = result.skillId;

    stateMap.set(result.skillId, updated);

    changes.push({
      skillId: result.skillId,
      before,
      after: updated.proficiency,
      confidenceBefore: confBefore,
      confidenceAfter: updated.confidence,
    });
  }

  return {
    updatedStates: Array.from(stateMap.values()),
    changes,
  };
}

/**
 * Update a skill after an assessment completion.
 */
export function updateFromAssessment(
  skillStates: SkillState[],
  skillId: string,
  score: number,
  assessmentId: string,
): { updatedState: SkillState; before: number; after: number } {
  const stateMap = new Map<string, SkillState>();
  for (const state of skillStates) {
    stateMap.set(state.skillId, { ...state });
  }

  const current = stateMap.get(skillId);
  const before = current?.proficiency ?? 0;

  const evidence: Evidence = {
    type: 'ASSESSMENT',
    score,
    source: assessmentId,
    timestamp: new Date(),
  };

  const updated = updateProficiency(current, evidence);
  updated.skillId = skillId;

  return {
    updatedState: updated,
    before,
    after: updated.proficiency,
  };
}

/**
 * Update a skill after project completion.
 */
export function updateFromProject(
  skillStates: SkillState[],
  skillIds: string[],
  score: number,
  projectId: string,
): Array<{ skillId: string; updatedState: SkillState; before: number; after: number }> {
  const stateMap = new Map<string, SkillState>();
  for (const state of skillStates) {
    stateMap.set(state.skillId, { ...state });
  }

  return skillIds.map(skillId => {
    const current = stateMap.get(skillId);
    const before = current?.proficiency ?? 0;

    const evidence: Evidence = {
      type: 'PROJECT',
      score,
      source: projectId,
      timestamp: new Date(),
    };

    const updated = updateProficiency(current, evidence);
    updated.skillId = skillId;

    return { skillId, updatedState: updated, before, after: updated.proficiency };
  });
}

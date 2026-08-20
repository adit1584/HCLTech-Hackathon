// ============================================================
// Gap Engine — Computes skill gaps between current and target
// ============================================================
// This is a DETERMINISTIC module. No LLM calls.
// gap = max(0, targetProficiency - currentProficiency)
// ============================================================

import type { SkillState, SkillGap, Skill } from '../models/types.js';

export interface GapInput {
  skillId: string;
  currentProficiency: number;
  currentConfidence: number;
  targetProficiency: number;
  roleImportance: number;
}

/**
 * Calculate the raw gap for a single skill.
 * Adjusts the effective gap by confidence — lower confidence means
 * the learner might be weaker than reported, so we add uncertainty.
 */
export function calculateGap(input: GapInput): number {
  const rawGap = Math.max(0, input.targetProficiency - input.currentProficiency);

  // If there's no gap, return 0 — confidence penalty doesn't create gaps
  if (rawGap === 0) return 0;

  // Confidence-adjusted gap: if confidence is low, the real gap could be larger
  // We add up to 10% extra gap for very low confidence
  const confidencePenalty = (1 - input.currentConfidence) * 0.1 * input.targetProficiency;
  const adjustedGap = Math.min(100, rawGap + confidencePenalty);

  return adjustedGap;
}

/**
 * Calculate normalized gap (0–1 range) for use in priority scoring.
 */
export function normalizeGap(gap: number): number {
  return Math.min(1, gap / 100);
}

/**
 * Compute all skill gaps for a learner given their current state
 * and the target role requirements.
 */
export function computeSkillGaps(
  skillStates: SkillState[],
  targetRequirements: Array<{ skillId: string; targetProficiency: number; importance: number }>,
  allSkills: Skill[],
): SkillGap[] {
  const stateMap = new Map<string, SkillState>();
  for (const state of skillStates) {
    stateMap.set(state.skillId, state);
  }

  const skillMap = new Map<string, Skill>();
  for (const skill of allSkills) {
    skillMap.set(skill.id, skill);
  }

  const gaps: SkillGap[] = [];

  for (const req of targetRequirements) {
    const state = stateMap.get(req.skillId);
    const skill = skillMap.get(req.skillId);

    const currentProficiency = state?.proficiency ?? 0;
    const currentConfidence = state?.confidence ?? 0;

    const gap = calculateGap({
      skillId: req.skillId,
      currentProficiency,
      currentConfidence,
      targetProficiency: req.targetProficiency,
      roleImportance: req.importance,
    });

    if (gap > 0) {
      gaps.push({
        skillId: req.skillId,
        skillName: skill?.name ?? req.skillId,
        currentProficiency,
        targetProficiency: req.targetProficiency,
        gap,
        roleImportance: req.importance,
        centrality: 0,       // Filled by centrality engine
        unlockValue: 0,      // Filled by unlock-value engine
        goalRelevance: 0,    // Filled by priority scorer
        learningCost: 0,     // Filled by priority scorer
        priorityScore: 0,    // Filled by priority scorer
      });
    }
  }

  return gaps;
}

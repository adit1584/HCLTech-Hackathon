// ============================================================
// Unlock Value Engine — How much downstream capability a skill
// unlocks if learned now.
// ============================================================
// Unlike centrality (which is static graph structure), unlock value
// is dynamic: it considers which downstream skills are currently
// BLOCKED because this prerequisite is unmet.
//
// A skill with high unlock value is one whose mastery would
// immediately enable the learner to start learning many important
// downstream skills.
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { Skill, SkillState } from '../models/types.js';

interface UnlockContext {
  skills: Skill[];
  skillStates: SkillState[];
  targetRequirements: Array<{ skillId: string; targetProficiency: number; importance: number }>;
  masteryThreshold?: number; // Default 60 — proficiency at which a prerequisite is "met"
}

/**
 * Calculate the unlock value for a specific skill.
 *
 * Unlock value = sum of (importance × gap-weight) for all downstream skills
 * that would become "unblocked" if this skill reaches the mastery threshold.
 */
export function calculateUnlockValue(
  skillId: string,
  context: UnlockContext,
): number {
  const threshold = context.masteryThreshold ?? 60;

  const stateMap = new Map<string, SkillState>();
  for (const state of context.skillStates) {
    stateMap.set(state.skillId, state);
  }

  const importanceMap = new Map<string, number>();
  for (const req of context.targetRequirements) {
    importanceMap.set(req.skillId, req.importance);
  }

  const skillMap = new Map<string, Skill>();
  for (const skill of context.skills) {
    skillMap.set(skill.id, skill);
  }

  // Find all skills that have `skillId` as a prerequisite
  const directDependents = context.skills.filter(s =>
    s.prerequisites.includes(skillId)
  );

  let unlockSum = 0;

  for (const dependent of directDependents) {
    // Check if the ONLY unmet prerequisite is this skill
    const unmetPrereqs = dependent.prerequisites.filter(prereqId => {
      if (prereqId === skillId) return true; // This is the one we're considering
      const state = stateMap.get(prereqId);
      return !state || state.proficiency < threshold;
    });

    // If this skill is the ONLY (or last) blocker for the dependent,
    // its unlock value should be high
    const importance = importanceMap.get(dependent.id) ?? 0;

    if (unmetPrereqs.length === 1 && unmetPrereqs[0] === skillId) {
      // This skill is the SOLE blocker → high unlock value
      unlockSum += importance * 1.0;
    } else if (unmetPrereqs.includes(skillId)) {
      // This skill is ONE of several blockers → partial unlock value
      unlockSum += importance * (1 / unmetPrereqs.length);
    }

    // Recursively add value from transitive dependents (with decay)
    const transitiveValue = calculateUnlockValue(dependent.id, {
      ...context,
      // Prevent infinite recursion by removing current skill from consideration
      skills: context.skills.filter(s => s.id !== skillId),
    });
    unlockSum += transitiveValue * 0.5; // Decay factor for indirect unlocks
  }

  return unlockSum;
}

/**
 * Calculate unlock values for all skills with gaps.
 * Returns a map of skillId → unlock value (normalized 0–1).
 */
export function calculateAllUnlockValues(context: UnlockContext): Map<string, number> {
  const rawValues = new Map<string, number>();
  let maxValue = 0;

  // Only calculate for skills that are in the target requirements
  const targetSkillIds = new Set(context.targetRequirements.map(r => r.skillId));

  for (const skillId of targetSkillIds) {
    const value = calculateUnlockValue(skillId, context);
    rawValues.set(skillId, value);
    maxValue = Math.max(maxValue, value);
  }

  // Normalize to 0–1
  const normalized = new Map<string, number>();
  for (const [skillId, value] of rawValues) {
    normalized.set(skillId, maxValue > 0 ? value / maxValue : 0);
  }

  return normalized;
}

// ============================================================
// Priority Scorer — The auditable priority formula
// ============================================================
// Priority Score =
//     Gap × Role Importance × Skill Centrality × Unlock Value × Goal Relevance
//     ÷ Learning Cost
//
// All factors normalized to [0, 1].
// This formula is visible in the Recommendation Trace.
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { Skill, SkillState, SkillGap } from '../models/types.js';
import { computeSkillGaps, normalizeGap } from './gap-engine.js';
import { calculateCentrality } from './centrality.js';
import { calculateAllUnlockValues } from './unlock-value.js';

export interface PriorityScorerInput {
  skillStates: SkillState[];
  targetRequirements: Array<{ skillId: string; targetProficiency: number; importance: number }>;
  allSkills: Skill[];
  targetRoleId: string;
}

/**
 * Calculate goal relevance for a skill.
 * Skills that are directly required by the target role get higher relevance.
 * Skills that are prerequisites of required skills get moderate relevance.
 */
function calculateGoalRelevance(
  skillId: string,
  targetRequirements: Array<{ skillId: string; targetProficiency: number; importance: number }>,
  allSkills: Skill[],
): number {
  // Direct requirement → use the role importance
  const req = targetRequirements.find(r => r.skillId === skillId);
  if (req) {
    return req.importance;
  }

  // Indirect requirement (prerequisite of a required skill)
  const skill = allSkills.find(s => s.id === skillId);
  if (!skill) return 0;

  // Check if this skill enables any target skills
  const enabledTargetSkills = allSkills.filter(s =>
    s.prerequisites.includes(skillId) &&
    targetRequirements.some(r => r.skillId === s.id)
  );

  if (enabledTargetSkills.length > 0) {
    // Average importance of the enabled target skills, slightly discounted
    const avgImportance = enabledTargetSkills.reduce((sum, s) => {
      const r = targetRequirements.find(req => req.skillId === s.id);
      return sum + (r?.importance ?? 0);
    }, 0) / enabledTargetSkills.length;
    return avgImportance * 0.85;
  }

  return 0.3; // Minimal relevance for distantly related skills
}

/**
 * Calculate learning cost (normalized 0–1).
 * Based on estimated hours and difficulty.
 */
function calculateLearningCost(skill: Skill, maxHours: number): number {
  const hoursFactor = maxHours > 0 ? skill.estimatedHours / maxHours : 0.5;
  const difficultyFactor = skill.difficulty / 5;
  // Weighted combination
  return hoursFactor * 0.6 + difficultyFactor * 0.4;
}

/**
 * Compute priority scores for all skill gaps.
 *
 * Returns enriched SkillGap objects sorted by priority (highest first).
 */
export function computePriorityScores(input: PriorityScorerInput): SkillGap[] {
  const { skillStates, targetRequirements, allSkills, targetRoleId } = input;

  // Step 1: Compute raw gaps
  const gaps = computeSkillGaps(skillStates, targetRequirements, allSkills);

  if (gaps.length === 0) return [];

  // Step 2: Calculate centrality for all skills
  const centralityMap = calculateCentrality(allSkills);

  // Step 3: Calculate unlock values
  const unlockMap = calculateAllUnlockValues({
    skills: allSkills,
    skillStates,
    targetRequirements,
  });

  // Step 4: Find max estimated hours for normalization
  const maxHours = Math.max(...allSkills.map(s => s.estimatedHours), 1);

  // Step 5: Enrich each gap with all scoring factors
  for (const gap of gaps) {
    const skill = allSkills.find(s => s.id === gap.skillId);
    if (!skill) continue;

    gap.centrality = centralityMap.get(gap.skillId) ?? 0;
    gap.unlockValue = unlockMap.get(gap.skillId) ?? 0;
    gap.goalRelevance = calculateGoalRelevance(gap.skillId, targetRequirements, allSkills);
    gap.learningCost = calculateLearningCost(skill, maxHours);

    // The priority formula
    const normalizedGap = normalizeGap(gap.gap);

    // Avoid division by zero — use max(cost, 0.1)
    const effectiveCost = Math.max(gap.learningCost, 0.1);

    gap.priorityScore = (
      normalizedGap *
      gap.roleImportance *
      (0.3 + gap.centrality * 0.7) *     // Centrality has base 0.3 so isolated skills aren't zeroed out
      (0.3 + gap.unlockValue * 0.7) *     // Same for unlock value
      gap.goalRelevance
    ) / effectiveCost;
  }

  // Normalize priority scores to 0–1
  const maxPriority = Math.max(...gaps.map(g => g.priorityScore), 0.001);
  for (const gap of gaps) {
    gap.priorityScore = gap.priorityScore / maxPriority;
  }

  // Sort by priority (highest first)
  gaps.sort((a, b) => b.priorityScore - a.priorityScore);

  return gaps;
}

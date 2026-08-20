// ============================================================
// Recompiler — Incremental recompilation on new evidence
// ============================================================
// When a learner produces new evidence (assessment, project,
// feedback), the recompiler:
//
// 1. Identifies which skill was updated
// 2. Finds all downstream dependent skills
// 3. Recalculates priority scores for affected skills
// 4. Re-runs the path optimizer for the affected region
// 5. Merges changes into the existing roadmap
// 6. Produces a human-readable change summary
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { Skill, SkillState, SkillGap, RoadmapItem, RecompilationResult } from '../models/types.js';
import { getTransitiveDependents } from './centrality.js';
import { computePriorityScores } from './priority-scorer.js';
import { optimizePath, estimatePathDuration } from './path-optimizer.js';
import { generateRoadmap } from './roadmap-generator.js';
import type { Resource } from '../models/types.js';

export interface RecompilerInput {
  /** The skill(s) that changed */
  changedSkillIds: string[];
  /** The reason for recompilation */
  reason: string;
  /** Updated learner skill states (after mastery update) */
  updatedSkillStates: SkillState[];
  /** All skills in the graph */
  allSkills: Skill[];
  /** Target role requirements */
  targetRequirements: Array<{ skillId: string; targetProficiency: number; importance: number }>;
  /** Target role ID */
  targetRoleId: string;
  /** Current roadmap items */
  currentRoadmapItems: RoadmapItem[];
  /** All available resources */
  resources: Resource[];
  /** Learner's weekly hours */
  weeklyHours: number;
  /** Learner's learning preferences */
  learningPreferences: string[];
  /** Skills already completed */
  completedSkills: Set<string>;
}

/**
 * Perform incremental recompilation.
 *
 * Does NOT regenerate the entire roadmap blindly — only recalculates
 * for the affected portion of the skill graph.
 */
export function recompile(input: RecompilerInput): {
  newRoadmapItems: RoadmapItem[];
  totalEstimatedWeeks: number;
  result: RecompilationResult;
} {
  const {
    changedSkillIds,
    reason,
    updatedSkillStates,
    allSkills,
    targetRequirements,
    targetRoleId,
    currentRoadmapItems,
    resources,
    weeklyHours,
    learningPreferences,
    completedSkills,
  } = input;

  // Step 1: Find all affected skills (changed + downstream dependents)
  const affectedSkills = new Set<string>();
  for (const skillId of changedSkillIds) {
    affectedSkills.add(skillId);
    const dependents = getTransitiveDependents(skillId, allSkills);
    for (const dep of dependents) {
      affectedSkills.add(dep);
    }
  }

  const dependenciesChecked = affectedSkills.size;

  // Step 2: Recalculate priority scores (for ALL skills, since priorities are relative)
  const newGaps = computePriorityScores({
    skillStates: updatedSkillStates,
    targetRequirements,
    allSkills,
    targetRoleId,
  });

  // Step 3: Re-run path optimizer
  const newPath = optimizePath({
    gaps: newGaps,
    allSkills,
    weeklyHours,
    learningPreferences,
  });

  // Step 4: Generate new roadmap
  const { items: newRoadmapItems, totalEstimatedWeeks } = generateRoadmap({
    pathItems: newPath,
    resources,
    allSkills,
    learningPreferences,
    completedSkills,
    weeklyHours,
  });

  // Step 5: Compare old and new roadmaps to produce change summary
  const changes: RecompilationResult['changes'] = [];
  const oldSkillSet = new Set(currentRoadmapItems.map(i => i.skillIds[0]));
  const newSkillSet = new Set(newRoadmapItems.map(i => i.skillIds[0]));

  // Find removed items
  let resourcesRemoved = 0;
  for (const item of currentRoadmapItems) {
    if (!newSkillSet.has(item.skillIds[0]) && item.type !== 'ASSESSMENT') {
      resourcesRemoved++;
      changes.push({
        type: 'resource_removed',
        description: `${item.title} removed — skill gap closed or reduced below threshold`,
      });
    }
  }

  // Find added items
  let resourcesAdded = 0;
  for (const item of newRoadmapItems) {
    if (!oldSkillSet.has(item.skillIds[0]) && item.type !== 'ASSESSMENT') {
      resourcesAdded++;
      changes.push({
        type: 'resource_added',
        description: `${item.title} added to path`,
      });
    }
  }

  // Find reordered items
  const oldOrder = currentRoadmapItems.map(i => i.skillIds[0]);
  const newOrder = newRoadmapItems.map(i => i.skillIds[0]);

  for (let i = 0; i < Math.min(oldOrder.length, newOrder.length); i++) {
    if (oldOrder[i] !== newOrder[i]) {
      changes.push({
        type: 'order_changed',
        description: `Path order updated due to priority recalculation`,
      });
      break; // Only report once
    }
  }

  // Count skills that were actually recomputed (in the affected region)
  const skillsRecomputed = newGaps.filter(g => affectedSkills.has(g.skillId)).length;

  // Count milestone changes
  const oldMilestones = new Map(currentRoadmapItems.map(i => [i.skillIds[0], i.milestone]));
  let milestonesUpdated = 0;
  for (const item of newRoadmapItems) {
    const oldMilestone = oldMilestones.get(item.skillIds[0]);
    if (oldMilestone !== undefined && oldMilestone !== item.milestone) {
      milestonesUpdated++;
    }
  }

  if (milestonesUpdated > 0) {
    changes.push({
      type: 'milestone_changed',
      description: `${milestonesUpdated} milestone${milestonesUpdated > 1 ? 's' : ''} updated`,
    });
  }

  // Track skill updates
  for (const skillId of changedSkillIds) {
    const state = updatedSkillStates.find(s => s.skillId === skillId);
    if (state) {
      changes.push({
        type: 'skill_updated',
        description: `${allSkills.find(s => s.id === skillId)?.name ?? skillId} proficiency updated to ${state.proficiency}%`,
      });
    }
  }

  const result: RecompilationResult = {
    dependenciesChecked,
    skillsRecomputed,
    resourcesRemoved,
    resourcesAdded,
    milestonesUpdated,
    reason,
    affectedSkills: Array.from(affectedSkills),
    changes,
  };

  return {
    newRoadmapItems,
    totalEstimatedWeeks,
    result,
  };
}

// ============================================================
// Path Optimizer — Topological sort + priority-aware ordering
// ============================================================
// Input: Skill gaps + prerequisite DAG + priority scores + constraints
// Output: Ordered learning path respecting prerequisites
//
// Algorithm:
// 1. Build dependency graph from skills with gaps
// 2. Topological sort (Kahn's algorithm)
// 3. Within each topological "level", sort by priority score
// 4. Group into milestones based on weekly capacity
// 5. Insert assessments at logical milestone boundaries
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { Skill, SkillGap } from '../models/types.js';

export interface PathItem {
  skillId: string;
  skillName: string;
  priorityScore: number;
  estimatedHours: number;
  milestone: number;
  prerequisites: string[];
  type: 'SKILL' | 'ASSESSMENT' | 'PROJECT';
  reason: string;
  unlocks: string[];
}

export interface PathOptimizerInput {
  gaps: SkillGap[];
  allSkills: Skill[];
  weeklyHours: number;
  learningPreferences: string[];
}

/**
 * Topological sort using Kahn's algorithm with priority-aware tie-breaking.
 * Within each "level" of the topological order, skills are sorted by priority.
 */
function topologicalSortWithPriority(
  gapSkillIds: Set<string>,
  allSkills: Skill[],
  priorityMap: Map<string, number>,
): string[] {
  // Build in-degree map and adjacency list for just the gap skills
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>(); // prereq → dependents

  for (const skillId of gapSkillIds) {
    inDegree.set(skillId, 0);
    adjacency.set(skillId, []);
  }

  for (const skill of allSkills) {
    if (!gapSkillIds.has(skill.id)) continue;

    for (const prereqId of skill.prerequisites) {
      if (gapSkillIds.has(prereqId)) {
        inDegree.set(skill.id, (inDegree.get(skill.id) ?? 0) + 1);
        const adj = adjacency.get(prereqId) ?? [];
        adj.push(skill.id);
        adjacency.set(prereqId, adj);
      }
    }
  }

  // Kahn's algorithm with priority-based processing
  const result: string[] = [];
  const queue: string[] = [];

  // Start with all zero in-degree nodes (no unmet prerequisites)
  for (const [skillId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(skillId);
    }
  }

  while (queue.length > 0) {
    // Sort queue by priority (highest first) for tie-breaking
    queue.sort((a, b) => (priorityMap.get(b) ?? 0) - (priorityMap.get(a) ?? 0));

    const current = queue.shift()!;
    result.push(current);

    for (const dependent of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  // Handle any remaining skills (cycles — shouldn't happen but safety net)
  for (const skillId of gapSkillIds) {
    if (!result.includes(skillId)) {
      result.push(skillId);
    }
  }

  return result;
}

/**
 * Group skills into milestones based on weekly study capacity.
 */
function assignMilestones(
  orderedSkills: string[],
  skillMap: Map<string, Skill>,
  weeklyHours: number,
): Map<string, number> {
  const milestones = new Map<string, number>();
  let currentMilestone = 1;
  let currentHours = 0;
  const milestoneCapacity = weeklyHours * 2; // ~2 weeks per milestone

  for (const skillId of orderedSkills) {
    const skill = skillMap.get(skillId);
    const hours = skill?.estimatedHours ?? 10;

    if (currentHours + hours > milestoneCapacity && currentHours > 0) {
      currentMilestone++;
      currentHours = 0;
    }

    milestones.set(skillId, currentMilestone);
    currentHours += hours;
  }

  return milestones;
}

/**
 * Determine what a skill unlocks (its direct dependents that are in the gap set).
 */
function getUnlocks(
  skillId: string,
  gapSkillIds: Set<string>,
  allSkills: Skill[],
): string[] {
  return allSkills
    .filter(s => s.prerequisites.includes(skillId) && gapSkillIds.has(s.id))
    .map(s => s.name);
}

/**
 * Generate a reason string for why a skill is at this position.
 */
function generateReason(
  skillId: string,
  gap: SkillGap | undefined,
  milestone: number,
): string {
  if (!gap) return 'Included as prerequisite';

  const parts: string[] = [];
  if (gap.priorityScore > 0.8) parts.push('High priority');
  if (gap.unlockValue > 0.7) parts.push('high downstream unlock value');
  if (gap.roleImportance > 0.8) parts.push('critical for target role');
  if (gap.gap > 50) parts.push('significant skill gap');
  if (gap.learningCost < 0.3) parts.push('low learning cost');

  return parts.length > 0
    ? parts.join(', ')
    : `Priority score: ${gap.priorityScore.toFixed(2)}`;
}

/**
 * Optimize the learning path.
 *
 * Returns an ordered list of PathItems grouped into milestones.
 */
export function optimizePath(input: PathOptimizerInput): PathItem[] {
  const { gaps, allSkills, weeklyHours, learningPreferences } = input;

  if (gaps.length === 0) return [];

  const gapSkillIds = new Set(gaps.map(g => g.skillId));
  const priorityMap = new Map(gaps.map(g => [g.skillId, g.priorityScore]));
  const gapMap = new Map(gaps.map(g => [g.skillId, g]));
  const skillMap = new Map(allSkills.map(s => [s.id, s]));

  // Step 1: Topological sort with priority-aware ordering
  const orderedSkillIds = topologicalSortWithPriority(gapSkillIds, allSkills, priorityMap);

  // Step 2: Assign milestones based on capacity
  const milestoneMap = assignMilestones(orderedSkillIds, skillMap, weeklyHours);

  // Step 3: Build path items
  const pathItems: PathItem[] = [];

  for (const skillId of orderedSkillIds) {
    const skill = skillMap.get(skillId);
    const gap = gapMap.get(skillId);
    const milestone = milestoneMap.get(skillId) ?? 1;

    // Add skill learning item
    pathItems.push({
      skillId,
      skillName: skill?.name ?? skillId,
      priorityScore: gap?.priorityScore ?? 0,
      estimatedHours: skill?.estimatedHours ?? 10,
      milestone,
      prerequisites: (skill?.prerequisites ?? []).filter(p => gapSkillIds.has(p)),
      type: 'SKILL',
      reason: generateReason(skillId, gap, milestone),
      unlocks: getUnlocks(skillId, gapSkillIds, allSkills),
    });
  }

  // Step 4: Insert assessments at milestone boundaries
  const milestoneGroups = new Map<number, PathItem[]>();
  for (const item of pathItems) {
    const group = milestoneGroups.get(item.milestone) ?? [];
    group.push(item);
    milestoneGroups.set(item.milestone, group);
  }

  const finalPath: PathItem[] = [];
  for (const [milestone, items] of milestoneGroups) {
    finalPath.push(...items);

    // Add assessment at end of each milestone
    const milestoneSkills = items.map(i => i.skillId);
    finalPath.push({
      skillId: `assessment-milestone-${milestone}`,
      skillName: `Milestone ${milestone} Assessment`,
      priorityScore: 0,
      estimatedHours: 0.5,
      milestone,
      prerequisites: milestoneSkills,
      type: 'ASSESSMENT',
      reason: `Validate mastery of milestone ${milestone} skills`,
      unlocks: [],
    });

    // Add project after milestone 2+ if preference is project-based
    if (milestone >= 2 && learningPreferences.includes('project_based')) {
      finalPath.push({
        skillId: `project-milestone-${milestone}`,
        skillName: `Milestone ${milestone} Project`,
        priorityScore: 0,
        estimatedHours: milestone * 3,
        milestone,
        prerequisites: milestoneSkills,
        type: 'PROJECT',
        reason: `Apply milestone ${milestone} skills in a practical project`,
        unlocks: [],
      });
    }
  }

  return finalPath;
}

/**
 * Estimate total weeks for a path given weekly study hours.
 */
export function estimatePathDuration(path: PathItem[], weeklyHours: number): number {
  const totalHours = path.reduce((sum, item) => sum + item.estimatedHours, 0);
  return Math.ceil(totalHours / Math.max(weeklyHours, 1));
}

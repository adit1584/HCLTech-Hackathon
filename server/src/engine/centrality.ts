// ============================================================
// Centrality Engine — Calculates skill centrality in the DAG
// ============================================================
// Centrality = normalized count of downstream dependencies.
// A skill with many downstream dependents is more "central"
// to the learning graph and should be prioritized.
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { Skill } from '../models/types.js';

/**
 * Build an adjacency list of direct dependents for each skill.
 * If A is a prerequisite of B, then B is a downstream dependent of A.
 */
function buildDependentsMap(skills: Skill[]): Map<string, Set<string>> {
  const dependents = new Map<string, Set<string>>();

  // Initialize all skills
  for (const skill of skills) {
    if (!dependents.has(skill.id)) {
      dependents.set(skill.id, new Set());
    }
  }

  // For each skill, register it as a dependent of its prerequisites
  for (const skill of skills) {
    for (const prereqId of skill.prerequisites) {
      if (!dependents.has(prereqId)) {
        dependents.set(prereqId, new Set());
      }
      dependents.get(prereqId)!.add(skill.id);
    }
  }

  return dependents;
}

/**
 * Count ALL downstream dependencies (transitive) using BFS.
 */
function countTransitiveDependents(
  skillId: string,
  dependentsMap: Map<string, Set<string>>,
): number {
  const visited = new Set<string>();
  const queue = [skillId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const directDeps = dependentsMap.get(current) ?? new Set();

    for (const dep of directDeps) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
      }
    }
  }

  return visited.size;
}

/**
 * Calculate centrality scores for all skills.
 * Returns a map of skillId → centrality (normalized 0–1).
 */
export function calculateCentrality(skills: Skill[]): Map<string, number> {
  const dependentsMap = buildDependentsMap(skills);
  const rawCounts = new Map<string, number>();

  let maxCount = 0;

  for (const skill of skills) {
    const count = countTransitiveDependents(skill.id, dependentsMap);
    rawCounts.set(skill.id, count);
    maxCount = Math.max(maxCount, count);
  }

  // Normalize to 0–1
  const centrality = new Map<string, number>();
  for (const [skillId, count] of rawCounts) {
    centrality.set(skillId, maxCount > 0 ? count / maxCount : 0);
  }

  return centrality;
}

/**
 * Get the direct dependents (children) of a skill.
 */
export function getDirectDependents(skillId: string, skills: Skill[]): string[] {
  return skills
    .filter(s => s.prerequisites.includes(skillId))
    .map(s => s.id);
}

/**
 * Get all transitive dependents of a skill (for recompilation scope).
 */
export function getTransitiveDependents(skillId: string, skills: Skill[]): string[] {
  const dependentsMap = buildDependentsMap(skills);
  const visited = new Set<string>();
  const queue = [skillId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const deps = dependentsMap.get(current) ?? new Set();
    for (const dep of deps) {
      if (!visited.has(dep)) {
        visited.add(dep);
        queue.push(dep);
      }
    }
  }

  return Array.from(visited);
}

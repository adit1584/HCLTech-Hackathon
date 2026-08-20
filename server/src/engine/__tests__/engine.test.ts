// ============================================================
// Learning Engine Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { calculateGap, normalizeGap, computeSkillGaps } from '../gap-engine.js';
import { calculateCentrality, getDirectDependents, getTransitiveDependents } from '../centrality.js';
import { calculateAllUnlockValues } from '../unlock-value.js';
import { computePriorityScores } from '../priority-scorer.js';
import { optimizePath, estimatePathDuration } from '../path-optimizer.js';
import { updateProficiency, updateFromDiagnostic } from '../mastery-updater.js';
import type { Skill, SkillState, Evidence } from '../../models/types.js';

// ── Test Data ──────────────────────────────────────────────

const testSkills: Skill[] = [
  {
    id: 'python', name: 'Python', category: 'Programming',
    description: 'Python programming',
    prerequisites: [], relatedSkills: ['numpy'],
    roleImportance: [{ roleId: 'ds', importance: 0.95 }],
    difficulty: 2, estimatedHours: 40,
  },
  {
    id: 'numpy', name: 'NumPy', category: 'Libraries',
    description: 'Numerical computing',
    prerequisites: ['python'], relatedSkills: [],
    roleImportance: [{ roleId: 'ds', importance: 0.75 }],
    difficulty: 2, estimatedHours: 15,
  },
  {
    id: 'pandas', name: 'Pandas', category: 'Libraries',
    description: 'Data manipulation',
    prerequisites: ['python', 'numpy'], relatedSkills: [],
    roleImportance: [{ roleId: 'ds', importance: 0.90 }],
    difficulty: 2, estimatedHours: 25,
  },
  {
    id: 'statistics', name: 'Statistics', category: 'Math',
    description: 'Statistical analysis',
    prerequisites: [], relatedSkills: [],
    roleImportance: [{ roleId: 'ds', importance: 0.92 }],
    difficulty: 3, estimatedHours: 35,
  },
  {
    id: 'ml', name: 'Machine Learning', category: 'ML',
    description: 'ML fundamentals',
    prerequisites: ['python', 'statistics', 'numpy'], relatedSkills: [],
    roleImportance: [{ roleId: 'ds', importance: 0.95 }],
    difficulty: 4, estimatedHours: 45,
  },
  {
    id: 'feature-eng', name: 'Feature Engineering', category: 'ML',
    description: 'Feature creation',
    prerequisites: ['pandas', 'statistics'], relatedSkills: [],
    roleImportance: [{ roleId: 'ds', importance: 0.85 }],
    difficulty: 3, estimatedHours: 25,
  },
];

const testRequirements = [
  { skillId: 'python', targetProficiency: 80, importance: 0.95 },
  { skillId: 'numpy', targetProficiency: 70, importance: 0.75 },
  { skillId: 'pandas', targetProficiency: 80, importance: 0.90 },
  { skillId: 'statistics', targetProficiency: 80, importance: 0.92 },
  { skillId: 'ml', targetProficiency: 80, importance: 0.95 },
  { skillId: 'feature-eng', targetProficiency: 75, importance: 0.85 },
];

const testSkillStates: SkillState[] = [
  { skillId: 'python', proficiency: 72, confidence: 0.65, evidence: [], lastUpdated: new Date() },
  { skillId: 'statistics', proficiency: 41, confidence: 0.38, evidence: [], lastUpdated: new Date() },
  { skillId: 'ml', proficiency: 21, confidence: 0.25, evidence: [], lastUpdated: new Date() },
];

// ── Gap Engine Tests ───────────────────────────────────────

describe('Gap Engine', () => {
  it('calculates raw gap correctly', () => {
    const gap = calculateGap({
      skillId: 'python',
      currentProficiency: 72,
      currentConfidence: 0.65,
      targetProficiency: 80,
      roleImportance: 0.95,
    });

    // Raw gap = 80 - 72 = 8, plus confidence penalty
    expect(gap).toBeGreaterThan(8);
    expect(gap).toBeLessThan(20);
  });

  it('returns 0 gap when proficiency exceeds target', () => {
    const gap = calculateGap({
      skillId: 'excel',
      currentProficiency: 90,
      currentConfidence: 0.9,
      targetProficiency: 75,
      roleImportance: 0.5,
    });

    // No gap when proficiency exceeds target — confidence penalty doesn't create gaps
    expect(gap).toBe(0);
  });

  it('normalizes gap to 0-1 range', () => {
    expect(normalizeGap(50)).toBe(0.5);
    expect(normalizeGap(0)).toBe(0);
    expect(normalizeGap(100)).toBe(1);
    expect(normalizeGap(150)).toBe(1); // Capped at 1
  });

  it('computes gaps for multiple skills', () => {
    const gaps = computeSkillGaps(testSkillStates, testRequirements, testSkills);

    // Should have gaps for skills below target
    expect(gaps.length).toBeGreaterThan(0);

    // Python gap should be small (72 → 80)
    const pythonGap = gaps.find(g => g.skillId === 'python');
    expect(pythonGap).toBeDefined();
    expect(pythonGap!.gap).toBeLessThan(20);

    // ML gap should be large (21 → 80)
    const mlGap = gaps.find(g => g.skillId === 'ml');
    expect(mlGap).toBeDefined();
    expect(mlGap!.gap).toBeGreaterThan(50);

    // Skills with no state should have full gap
    const numpyGap = gaps.find(g => g.skillId === 'numpy');
    expect(numpyGap).toBeDefined();
    expect(numpyGap!.gap).toBeGreaterThan(60);
  });
});

// ── Centrality Tests ───────────────────────────────────────

describe('Centrality Engine', () => {
  it('calculates centrality correctly', () => {
    const centrality = calculateCentrality(testSkills);

    // Python should have highest centrality (most dependents)
    const pythonCentrality = centrality.get('python')!;
    const mlCentrality = centrality.get('ml')!;

    expect(pythonCentrality).toBeGreaterThan(mlCentrality);

    // ML has no dependents in our test set → low centrality
    expect(mlCentrality).toBe(0);

    // All values should be between 0 and 1
    for (const [, value] of centrality) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('finds direct dependents', () => {
    const deps = getDirectDependents('python', testSkills);
    expect(deps).toContain('numpy');
    expect(deps).toContain('pandas');
    expect(deps).toContain('ml');
  });

  it('finds transitive dependents', () => {
    const deps = getTransitiveDependents('python', testSkills);
    expect(deps).toContain('numpy');
    expect(deps).toContain('pandas');
    expect(deps).toContain('ml');
    expect(deps).toContain('feature-eng'); // Through pandas/statistics
  });
});

// ── Priority Scorer Tests ──────────────────────────────────

describe('Priority Scorer', () => {
  it('computes priority scores for all gaps', () => {
    const gaps = computePriorityScores({
      skillStates: testSkillStates,
      targetRequirements: testRequirements,
      allSkills: testSkills,
      targetRoleId: 'ds',
    });

    expect(gaps.length).toBeGreaterThan(0);

    // All scores should be normalized 0-1
    for (const gap of gaps) {
      expect(gap.priorityScore).toBeGreaterThanOrEqual(0);
      expect(gap.priorityScore).toBeLessThanOrEqual(1);
    }

    // Gaps should be sorted by priority (highest first)
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i - 1].priorityScore).toBeGreaterThanOrEqual(gaps[i].priorityScore);
    }
  });

  it('prioritizes high-unlock skills over pure high-gap skills', () => {
    const gaps = computePriorityScores({
      skillStates: testSkillStates,
      targetRequirements: testRequirements,
      allSkills: testSkills,
      targetRoleId: 'ds',
    });

    // Statistics should have decent priority — it's a prerequisite for ML and feature-eng
    const statsGap = gaps.find(g => g.skillId === 'statistics');
    expect(statsGap).toBeDefined();
    expect(statsGap!.priorityScore).toBeGreaterThan(0.2);
  });
});

// ── Path Optimizer Tests ───────────────────────────────────

describe('Path Optimizer', () => {
  it('produces a valid topological ordering', () => {
    const gaps = computePriorityScores({
      skillStates: testSkillStates,
      targetRequirements: testRequirements,
      allSkills: testSkills,
      targetRoleId: 'ds',
    });

    const path = optimizePath({
      gaps,
      allSkills: testSkills,
      weeklyHours: 8,
      learningPreferences: ['project_based'],
    });

    expect(path.length).toBeGreaterThan(0);

    // Verify prerequisites come before dependents
    const positionMap = new Map<string, number>();
    path.forEach((item, idx) => positionMap.set(item.skillId, idx));

    for (const item of path) {
      for (const prereqId of item.prerequisites) {
        const prereqPos = positionMap.get(prereqId);
        const itemPos = positionMap.get(item.skillId)!;
        if (prereqPos !== undefined) {
          expect(prereqPos).toBeLessThan(itemPos);
        }
      }
    }
  });

  it('inserts assessments at milestone boundaries', () => {
    const gaps = computePriorityScores({
      skillStates: testSkillStates,
      targetRequirements: testRequirements,
      allSkills: testSkills,
      targetRoleId: 'ds',
    });

    const path = optimizePath({
      gaps,
      allSkills: testSkills,
      weeklyHours: 8,
      learningPreferences: ['project_based'],
    });

    const assessments = path.filter(p => p.type === 'ASSESSMENT');
    expect(assessments.length).toBeGreaterThan(0);
  });

  it('estimates path duration', () => {
    const gaps = computePriorityScores({
      skillStates: testSkillStates,
      targetRequirements: testRequirements,
      allSkills: testSkills,
      targetRoleId: 'ds',
    });

    const path = optimizePath({
      gaps,
      allSkills: testSkills,
      weeklyHours: 8,
      learningPreferences: [],
    });

    const weeks = estimatePathDuration(path, 8);
    expect(weeks).toBeGreaterThan(0);
    expect(weeks).toBeLessThan(100);
  });
});

// ── Mastery Updater Tests ──────────────────────────────────

describe('Mastery Updater', () => {
  it('updates proficiency from diagnostic evidence', () => {
    const state: SkillState = {
      skillId: 'statistics',
      proficiency: 41,
      confidence: 0.38,
      evidence: [{ type: 'SELF_REPORT', score: 40, timestamp: new Date() }],
      lastUpdated: new Date(),
    };

    const evidence: Evidence = {
      type: 'DIAGNOSTIC',
      score: 86,
      source: 'diagnostic-1',
      timestamp: new Date(),
    };

    const updated = updateProficiency(state, evidence);

    // Proficiency should increase (diagnostic scored 86, was at 41)
    expect(updated.proficiency).toBeGreaterThan(state.proficiency);
    // Confidence should increase (diagnostic is strong evidence)
    expect(updated.confidence).toBeGreaterThan(state.confidence);
    // Evidence list should grow
    expect(updated.evidence.length).toBe(state.evidence.length + 1);
  });

  it('handles batch diagnostic updates', () => {
    const { updatedStates, changes } = updateFromDiagnostic(
      testSkillStates,
      [
        { skillId: 'statistics', score: 75 },
        { skillId: 'python', score: 85 },
      ]
    );

    expect(changes.length).toBe(2);

    const statsChange = changes.find(c => c.skillId === 'statistics');
    expect(statsChange).toBeDefined();
    expect(statsChange!.after).toBeGreaterThan(statsChange!.before);

    const pythonChange = changes.find(c => c.skillId === 'python');
    expect(pythonChange).toBeDefined();
    expect(pythonChange!.after).toBeGreaterThan(pythonChange!.before);
  });

  it('gives stronger weight to assessment evidence than self-report', () => {
    const baseState: SkillState = {
      skillId: 'sql',
      proficiency: 50,
      confidence: 0.3,
      evidence: [],
      lastUpdated: new Date(),
    };

    const selfReport = updateProficiency(baseState, {
      type: 'SELF_REPORT', score: 80, timestamp: new Date(),
    });

    const assessment = updateProficiency(baseState, {
      type: 'ASSESSMENT', score: 80, timestamp: new Date(),
    });

    // Assessment should move proficiency more than self-report
    expect(assessment.proficiency).toBeGreaterThan(selfReport.proficiency);
    expect(assessment.confidence).toBeGreaterThan(selfReport.confidence);
  });
});

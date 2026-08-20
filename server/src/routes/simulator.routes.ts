import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { ResourceModel } from '../models/Resource.js';
import { computePriorityScores } from '../engine/priority-scorer.js';
import { optimizePath, estimatePathDuration } from '../engine/path-optimizer.js';
import { generateRoadmap } from '../engine/roadmap-generator.js';
import { whatIfSchema } from '../middleware/validation.js';
import { loadRolesData } from '../utils/load-data.js';
import type { Skill, SkillState } from '../models/types.js';

const router = Router();

// POST /api/simulator/what-if — Calculate hypothetical path without mutating DB
router.post('/what-if', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = whatIfSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const learner = await LearnerModel.findById(req.userId).lean();
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    const roles = loadRolesData();
    const activeGoal = learner.goals?.[learner.goals.length - 1];
    const targetRoleId = parsed.data.targetRole || (activeGoal as any)?.targetRole || 'data-scientist';
    const targetRole = roles.find((r: any) => r.id === targetRoleId) || roles[0];

    const weeklyHours = parsed.data.weeklyHours || learner.weeklyHours || 8;
    const skipSkills = new Set(parsed.data.skipSkills || []);

    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId, name: s.name, category: s.category, description: s.description,
      prerequisites: s.prerequisites, relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance, difficulty: s.difficulty, estimatedHours: s.estimatedHours,
    }));

    const allResources = await ResourceModel.find({}).lean();
    const resources = allResources.map(r => ({
      id: r.resourceId, resourceId: r.resourceId, title: r.title, type: r.type as any,
      skills: r.skills, prerequisites: r.prerequisites, difficulty: r.difficulty,
      estimatedHours: r.estimatedHours, qualityScore: r.qualityScore,
      description: r.description, source: r.source, url: r.url,
    }));

    // Construct simulated skill states (skipSkills simulated as mastered at 85%)
    const skillStates: SkillState[] = (learner.skillStates || []).map((s: any) => {
      if (skipSkills.has(s.skillId)) {
        return {
          skillId: s.skillId,
          proficiency: 85,
          confidence: 0.9,
          evidence: s.evidence || [],
          lastUpdated: new Date(),
        };
      }
      return {
        skillId: s.skillId,
        proficiency: s.proficiency,
        confidence: s.confidence,
        evidence: s.evidence || [],
        lastUpdated: s.lastUpdated || new Date(),
      };
    });

    // Add any skipSkills that weren't in current state
    for (const skillId of skipSkills) {
      if (!skillStates.some(s => s.skillId === skillId)) {
        skillStates.push({
          skillId,
          proficiency: 85,
          confidence: 0.9,
          evidence: [],
          lastUpdated: new Date(),
        });
      }
    }

    // Run deterministic optimizer on simulated state
    const gaps = computePriorityScores({
      skillStates,
      targetRequirements: targetRole.requiredSkills,
      allSkills,
      targetRoleId: targetRole.id,
    });

    const pathItems = optimizePath({
      gaps,
      allSkills,
      weeklyHours,
      learningPreferences: learner.preferredLearningModes || ['course'],
    });

    const completedSkills = new Set(
      skillStates.filter(s => {
        const req = targetRole.requiredSkills.find((r: any) => r.skillId === s.skillId);
        return req && s.proficiency >= req.targetProficiency;
      }).map(s => s.skillId)
    );

    const roadmap = generateRoadmap({
      pathItems,
      resources,
      allSkills,
      learningPreferences: learner.preferredLearningModes || ['course'],
      completedSkills,
      weeklyHours,
    });

    // Compare with current base estimate
    const baseWeeks = Math.ceil(480 / (learner.weeklyHours || 8)); // approximate baseline
    const timeSavedWeeks = Math.max(0, baseWeeks - roadmap.totalEstimatedWeeks);

    res.json({
      simulatedRole: targetRole.name,
      simulatedWeeklyHours: weeklyHours,
      simulatedTotalWeeks: roadmap.totalEstimatedWeeks,
      baseWeeks,
      timeSavedWeeks,
      totalMilestones: Math.max(...roadmap.items.map(i => i.milestone), 1),
      simulatedItemsCount: roadmap.items.length,
      simulatedRoadmap: roadmap.items,
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ error: 'Failed to run what-if simulation' });
  }
});

export default router;

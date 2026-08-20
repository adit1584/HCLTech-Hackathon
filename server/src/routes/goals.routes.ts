import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { interpretGoalSchema, structuredGoalSchema } from '../middleware/validation.js';
import { loadRolesData } from '../utils/load-data.js';

const router = Router();

// POST /api/goals/interpret — Interpret natural language goal
router.post('/interpret', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = interpretGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { text } = parsed.data;

    // Try AI interpretation first (will be implemented in Phase 3)
    let interpreted;
    try {
      const { interpretGoalWithAI } = await import('../ai/goal-interpreter.js');
      interpreted = await interpretGoalWithAI(text);
    } catch {
      // Fallback: deterministic keyword-based interpretation
      interpreted = interpretGoalDeterministic(text);
    }

    // Validate the interpretation
    const validationResult = structuredGoalSchema.safeParse(interpreted);
    if (!validationResult.success) {
      // Use deterministic fallback
      interpreted = interpretGoalDeterministic(text);
    }

    res.json({ interpreted });
  } catch (error) {
    console.error('Goal interpret error:', error);
    res.status(500).json({ error: 'Failed to interpret goal' });
  }
});

// POST /api/goals/set — Set the goal on the learner profile
router.post('/set', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = structuredGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const goal = {
      ...parsed.data,
      createdAt: new Date(),
    };

    // Also set initial skill states from self-report if provided
    const { selfReportedSkills } = req.body;

    const update: any = {
      $push: { goals: goal },
      $set: {
        weeklyHours: goal.weeklyHours,
        experienceLevel: goal.currentLevel,
        preferredLearningModes: goal.learningPreference,
      },
    };

    if (selfReportedSkills && Array.isArray(selfReportedSkills)) {
      const skillStates = selfReportedSkills.map((s: any) => ({
        skillId: s.skillId,
        proficiency: Math.min(100, Math.max(0, s.proficiency)),
        confidence: 0.3, // Self-report = low confidence
        evidence: [{
          type: 'SELF_REPORT',
          score: s.proficiency,
          timestamp: new Date(),
        }],
        lastUpdated: new Date(),
      }));

      update.$set.skillStates = skillStates;
    }

    const learner = await LearnerModel.findByIdAndUpdate(
      req.userId,
      update,
      { new: true, select: '-passwordHash' },
    );

    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    res.json({
      message: 'Goal set successfully',
      goal,
      learner: {
        id: learner._id,
        name: learner.name,
        goals: learner.goals,
        skillStates: learner.skillStates,
      },
    });
  } catch (error) {
    console.error('Set goal error:', error);
    res.status(500).json({ error: 'Failed to set goal' });
  }
});

// GET /api/goals/roles — List available target roles
router.get('/roles', async (_req: AuthRequest, res: Response) => {
  try {
    const roles = loadRolesData();
    res.json({
      roles: roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        estimatedTotalHours: r.estimatedTotalHours,
        skillCount: r.requiredSkills.length,
      })),
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

/**
 * Deterministic fallback for goal interpretation.
 * Used when the LLM is unavailable.
 */
function interpretGoalDeterministic(text: string) {
  const lower = text.toLowerCase();

  // Detect target role
  let targetRole = 'data-scientist';
  if (lower.includes('full stack') || lower.includes('fullstack') || lower.includes('web dev')) {
    targetRole = 'full-stack-developer';
  } else if (lower.includes('ml engineer') || lower.includes('machine learning engineer')) {
    targetRole = 'ml-engineer';
  } else if (lower.includes('data analyst') || lower.includes('analytics')) {
    targetRole = 'data-analyst';
  } else if (lower.includes('ai engineer') || lower.includes('artificial intelligence')) {
    targetRole = 'ai-engineer';
  }

  // Detect timeframe
  let timeframeWeeks = 24;
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (monthMatch) timeframeWeeks = parseInt(monthMatch[1]) * 4;
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) timeframeWeeks = parseInt(weekMatch[1]);

  // Detect weekly hours
  let weeklyHours = 8;
  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) weeklyHours = parseInt(hourMatch[1]);

  // Detect experience level
  let currentLevel: string = 'beginner';
  if (lower.includes('advanced') || lower.includes('senior')) currentLevel = 'advanced';
  else if (lower.includes('intermediate') || lower.includes('some experience')) currentLevel = 'intermediate';
  else if (lower.includes('basic') || lower.includes('beginner')) currentLevel = 'beginner_intermediate';

  // Detect learning preferences
  const learningPreference: string[] = [];
  if (lower.includes('project')) learningPreference.push('project_based');
  if (lower.includes('video')) learningPreference.push('video');
  if (lower.includes('reading') || lower.includes('book')) learningPreference.push('reading');
  if (lower.includes('interactive') || lower.includes('hands-on')) learningPreference.push('interactive');
  if (learningPreference.length === 0) learningPreference.push('course');

  return {
    targetRole,
    objective: 'career_transition',
    timeframeWeeks,
    weeklyHours,
    currentLevel,
    learningPreference,
    constraints: [],
    targetSkills: [],
  };
}

export default router;

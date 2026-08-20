import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { LearningEventModel } from '../models/LearningEvent.js';
import { progressEventSchema } from '../middleware/validation.js';
import { updateFromAssessment, updateFromProject } from '../engine/mastery-updater.js';
import type { SkillState, Evidence } from '../models/types.js';

const router = Router();

// POST /api/progress/event — Record a learning event and update mastery
router.post('/event', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = progressEventSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { type, skillIds, resourceId, score, metadata } = parsed.data;

    const learner = await LearnerModel.findById(req.userId);
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    // Record the event
    const event = await LearningEventModel.create({
      learnerId: req.userId,
      type,
      skillIds,
      resourceId,
      score,
      metadata,
      timestamp: new Date(),
    });

    // Convert current skill states
    const currentStates: SkillState[] = (learner.skillStates as any[]).map(s => ({
      skillId: s.skillId,
      proficiency: s.proficiency,
      confidence: s.confidence,
      evidence: s.evidence || [],
      lastUpdated: s.lastUpdated || new Date(),
    }));

    // Update mastery based on event type
    const changes: Array<{ skillId: string; before: number; after: number }> = [];

    if (type === 'ASSESSMENT_COMPLETED' && skillIds.length === 1) {
      const result = updateFromAssessment(currentStates, skillIds[0], score, resourceId || event._id.toString());
      
      // Update the state in the array
      const idx = currentStates.findIndex(s => s.skillId === skillIds[0]);
      if (idx >= 0) {
        currentStates[idx] = result.updatedState;
      } else {
        currentStates.push(result.updatedState);
      }

      changes.push({
        skillId: skillIds[0],
        before: result.before,
        after: result.after,
      });
    } else if (type === 'PROJECT_COMPLETED') {
      const results = updateFromProject(currentStates, skillIds, score, resourceId || event._id.toString());
      for (const result of results) {
        const idx = currentStates.findIndex(s => s.skillId === result.skillId);
        if (idx >= 0) {
          currentStates[idx] = result.updatedState;
        } else {
          currentStates.push(result.updatedState);
        }
        changes.push({
          skillId: result.skillId,
          before: result.before,
          after: result.after,
        });
      }
    } else {
      // RESOURCE_COMPLETED or PRACTICE_COMPLETED
      for (const skillId of skillIds) {
        const existing = currentStates.find(s => s.skillId === skillId);
        const evidenceType = type === 'PRACTICE_COMPLETED' ? 'PRACTICE' : 'COURSE_COMPLETION';
        
        const evidence: Evidence = {
          type: evidenceType,
          score,
          source: resourceId,
          timestamp: new Date(),
        };

        const { updateProficiency } = await import('../engine/mastery-updater.js');
        const updated = updateProficiency(existing, evidence);
        updated.skillId = skillId;

        const idx = currentStates.findIndex(s => s.skillId === skillId);
        if (idx >= 0) {
          changes.push({ skillId, before: currentStates[idx].proficiency, after: updated.proficiency });
          currentStates[idx] = updated;
        } else {
          changes.push({ skillId, before: 0, after: updated.proficiency });
          currentStates.push(updated);
        }
      }
    }

    // Save updated skill states back to learner
    await LearnerModel.findByIdAndUpdate(req.userId, {
      skillStates: currentStates.map(s => ({
        skillId: s.skillId,
        proficiency: s.proficiency,
        confidence: s.confidence,
        evidence: s.evidence,
        lastUpdated: s.lastUpdated,
      })),
    });

    // Add to completed resources if applicable
    if (resourceId) {
      await LearnerModel.findByIdAndUpdate(req.userId, {
        $addToSet: { completedResources: resourceId },
      });
    }

    res.json({
      event: {
        id: event._id,
        type,
        skillIds,
        score,
      },
      skillUpdates: changes,
      message: 'Progress recorded. Consider recompiling your path to see updated recommendations.',
    });
  } catch (error) {
    console.error('Progress event error:', error);
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

// GET /api/progress/history — Get learning event history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const events = await LearningEventModel.find({ learnerId: req.userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

    res.json({ events });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to get progress history' });
  }
});

export default router;

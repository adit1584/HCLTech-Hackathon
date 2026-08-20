import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { updateProfileSchema } from '../middleware/validation.js';

const router = Router();

// GET /api/learner/profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId).select('-passwordHash');
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    res.json({
      id: learner._id,
      name: learner.name,
      email: learner.email,
      experienceLevel: learner.experienceLevel,
      goals: learner.goals,
      interests: learner.interests,
      weeklyHours: learner.weeklyHours,
      preferredLearningModes: learner.preferredLearningModes,
      completedResources: learner.completedResources,
      skillStates: learner.skillStates,
      assessmentHistory: learner.assessmentHistory,
      projectHistory: learner.projectHistory,
      createdAt: learner.createdAt,
      updatedAt: learner.updatedAt,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PATCH /api/learner/profile
router.patch('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const learner = await LearnerModel.findByIdAndUpdate(
      req.userId,
      { $set: parsed.data },
      { new: true, select: '-passwordHash' },
    );

    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    res.json({
      id: learner._id,
      name: learner.name,
      email: learner.email,
      experienceLevel: learner.experienceLevel,
      interests: learner.interests,
      weeklyHours: learner.weeklyHours,
      preferredLearningModes: learner.preferredLearningModes,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/learner/skill-states
router.get('/skill-states', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId).select('skillStates');
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    res.json({ skillStates: learner.skillStates });
  } catch (error) {
    console.error('Get skill states error:', error);
    res.status(500).json({ error: 'Failed to get skill states' });
  }
});

export default router;

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { LearningEventModel } from '../models/LearningEvent.js';
import { feedbackSchema } from '../middleware/validation.js';
import { interpretFeedbackWithAI } from '../ai/feedback-interpreter.js';

const router = Router();

// POST /api/feedback — Submit natural-language feedback
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { text } = parsed.data;

    // Interpret intent via LLM or rule fallback
    const structured = await interpretFeedbackWithAI(text);

    // Save learning event
    await LearningEventModel.create({
      learnerId: req.userId,
      type: 'FEEDBACK_RECEIVED',
      skillIds: structured.skill !== 'general' ? [structured.skill] : [],
      metadata: structured,
      timestamp: new Date(),
    });

    // Record feedback event ID on learner
    await LearnerModel.findByIdAndUpdate(req.userId, {
      $push: { feedbackEvents: `feedback-${Date.now()}` },
    });

    // Determine deterministic recommendation for engine
    let systemAction = 'acknowledged';
    if (structured.intent === 'increase_prior_knowledge' || structured.intent === 'skip_topic') {
      systemAction = 'recommend_skip_or_accelerate';
    } else if (structured.intent === 'increase_difficulty' || structured.intent === 'add_challenge') {
      systemAction = 'recommend_advanced_assessment';
    }

    res.json({
      received: true,
      structured,
      systemAction,
      message: 'Feedback received and processed. Your learning parameters have been updated.',
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ error: 'Failed to process feedback' });
  }
});

export default router;

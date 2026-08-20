import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { LearnerModel } from '../models/Learner.js';
import { registerSchema, loginSchema } from '../middleware/validation.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { name, email, password } = parsed.data;

    // Check if user exists
    const existing = await LearnerModel.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create learner
    const learner = await LearnerModel.create({
      name,
      email,
      passwordHash,
      experienceLevel: 'beginner',
      goals: [],
      interests: [],
      weeklyHours: 8,
      preferredLearningModes: [],
      completedResources: [],
      skillStates: [],
      assessmentHistory: [],
      projectHistory: [],
      feedbackEvents: [],
    });

    // Generate token
    const token = jwt.sign(
      { userId: learner._id.toString(), email: learner.email },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      token,
      user: {
        id: learner._id,
        name: learner.name,
        email: learner.email,
        experienceLevel: learner.experienceLevel,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { email, password } = parsed.data;

    const learner = await LearnerModel.findOne({ email });
    if (!learner) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, learner.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: learner._id.toString(), email: learner.email },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: learner._id,
        name: learner.name,
        email: learner.email,
        experienceLevel: learner.experienceLevel,
        hasGoals: learner.goals.length > 0,
        hasCompletedDiagnostic: learner.assessmentHistory.length > 0,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (_req: AuthRequest, res: Response) => {
  // JWT is stateless — client should discard the token
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId).select('-passwordHash');
    if (!learner) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: learner._id,
      name: learner.name,
      email: learner.email,
      experienceLevel: learner.experienceLevel,
      hasGoals: learner.goals.length > 0,
      hasCompletedDiagnostic: learner.assessmentHistory.length > 0,
      skillStatesCount: learner.skillStates.length,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;

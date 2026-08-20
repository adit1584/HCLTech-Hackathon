import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ResourceModel } from '../models/Resource.js';

const router = Router();

// GET /api/resources — List all resources
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, skill, difficulty } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (skill) filter.skills = skill;
    if (difficulty) filter.difficulty = parseInt(difficulty as string);

    const resources = await ResourceModel.find(filter).lean();
    res.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to get resources' });
  }
});

// GET /api/resources/:id — Get resource detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resource = await ResourceModel.findOne({ resourceId: req.params.id }).lean();
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: 'Failed to get resource' });
  }
});

export default router;

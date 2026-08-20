import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { SkillModel } from '../models/Skill.js';

const router = Router();

// GET /api/skills — List all skills
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const skills = await SkillModel.find({}).lean();
    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// GET /api/skills/graph — Get skill graph (nodes + edges for visualization)
router.get('/graph', async (_req: AuthRequest, res: Response) => {
  try {
    const skills = await SkillModel.find({}).lean();

    const nodes = skills.map(s => ({
      id: s.skillId,
      name: s.name,
      category: s.category,
      difficulty: s.difficulty,
      estimatedHours: s.estimatedHours,
      prerequisites: s.prerequisites,
      relatedSkills: s.relatedSkills,
    }));

    // Build edges from prerequisites
    const edges: Array<{ from: string; to: string; type: string }> = [];
    for (const skill of skills) {
      for (const prereqId of skill.prerequisites) {
        edges.push({
          from: prereqId,
          to: skill.skillId,
          type: 'PREREQUISITE',
        });
      }
      for (const relatedId of skill.relatedSkills) {
        edges.push({
          from: skill.skillId,
          to: relatedId,
          type: 'RELATED_TO',
        });
      }
    }

    res.json({ nodes, edges });
  } catch (error) {
    console.error('Get skill graph error:', error);
    res.status(500).json({ error: 'Failed to get skill graph' });
  }
});

// GET /api/skills/:id — Get skill detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const skill = await SkillModel.findOne({ skillId: req.params.id }).lean();
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Get prerequisite details
    const prereqSkills = await SkillModel.find({
      skillId: { $in: skill.prerequisites },
    }).lean();

    // Get skills that depend on this one
    const dependentSkills = await SkillModel.find({
      prerequisites: skill.skillId,
    }).lean();

    res.json({
      skill,
      prerequisites: prereqSkills.map(s => ({ id: s.skillId, name: s.name })),
      dependents: dependentSkills.map(s => ({ id: s.skillId, name: s.name })),
    });
  } catch (error) {
    console.error('Get skill detail error:', error);
    res.status(500).json({ error: 'Failed to get skill detail' });
  }
});

export default router;

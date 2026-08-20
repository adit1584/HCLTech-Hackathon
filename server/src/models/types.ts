// ============================================================
// Pathwise — Shared TypeScript Types
// All domain types used across the learning engine, API, and AI
// ============================================================

// ── Evidence Types ──────────────────────────────────────────

export type EvidenceType =
  | 'SELF_REPORT'
  | 'DIAGNOSTIC'
  | 'COURSE_COMPLETION'
  | 'ASSESSMENT'
  | 'PROJECT'
  | 'PRACTICE'
  | 'RECENCY';

/** Confidence multipliers: stronger evidence → higher confidence */
export const EVIDENCE_WEIGHTS: Record<EvidenceType, number> = {
  PROJECT: 1.0,
  ASSESSMENT: 0.9,
  DIAGNOSTIC: 0.8,
  PRACTICE: 0.65,
  COURSE_COMPLETION: 0.55,
  RECENCY: 0.4,
  SELF_REPORT: 0.3,
};

export interface Evidence {
  type: EvidenceType;
  score?: number;         // 0–100 if applicable
  source?: string;        // e.g., resource ID, assessment ID
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ── Skill State ─────────────────────────────────────────────

export interface SkillState {
  skillId: string;
  proficiency: number;    // 0–100
  confidence: number;     // 0–1
  evidence: Evidence[];
  lastUpdated: Date;
}

// ── Skill (Knowledge Graph Node) ────────────────────────────

export interface RoleImportance {
  roleId: string;
  importance: number;     // 0–1
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  prerequisites: string[];
  relatedSkills: string[];
  roleImportance: RoleImportance[];
  difficulty: number;     // 1–5
  estimatedHours: number;
}

export type SkillEdgeType = 'PREREQUISITE' | 'ENABLES' | 'RELATED_TO' | 'SPECIALIZES';

export interface SkillEdge {
  from: string;
  to: string;
  type: SkillEdgeType;
}

// ── Learner ─────────────────────────────────────────────────

export type ExperienceLevel = 'beginner' | 'beginner_intermediate' | 'intermediate' | 'advanced' | 'expert';

export type LearningMode = 'video' | 'reading' | 'project_based' | 'interactive' | 'course' | 'mentored';

export interface LearnerGoal {
  targetRole: string;
  objective: string;
  timeframeWeeks: number;
  weeklyHours: number;
  currentLevel: ExperienceLevel;
  learningPreference: LearningMode[];
  constraints: string[];
  targetSkills: string[];
  createdAt: Date;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  experienceLevel: ExperienceLevel;
  goals: LearnerGoal[];
  interests: string[];
  weeklyHours: number;
  preferredLearningModes: LearningMode[];
  completedResources: string[];
  skillStates: SkillState[];
  assessmentHistory: string[];
  projectHistory: string[];
  feedbackEvents: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Resource ────────────────────────────────────────────────

export type ResourceType = 'COURSE' | 'PROJECT' | 'ASSESSMENT' | 'PRACTICE' | 'READING' | 'VIDEO';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  skills: string[];
  prerequisites: string[];
  difficulty: number;     // 1–5
  estimatedHours: number;
  qualityScore: number;   // 0–1
  description: string;
  source: string;
  url: string;
}

// ── Learning Events ─────────────────────────────────────────

export type LearningEventType =
  | 'DIAGNOSTIC_COMPLETED'
  | 'ASSESSMENT_COMPLETED'
  | 'PROJECT_COMPLETED'
  | 'RESOURCE_COMPLETED'
  | 'PRACTICE_COMPLETED'
  | 'FEEDBACK_RECEIVED'
  | 'SKILL_SELF_REPORTED'
  | 'GOAL_CHANGED'
  | 'TIME_CONSTRAINT_CHANGED';

export interface LearningEvent {
  id: string;
  learnerId: string;
  type: LearningEventType;
  skillIds: string[];
  resourceId?: string;
  score?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ── Roadmap ─────────────────────────────────────────────────

export type RoadmapItemType = 'SKILL' | 'COURSE' | 'PROJECT' | 'ASSESSMENT' | 'PRACTICE';
export type RoadmapItemStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';

export interface RoadmapItem {
  id: string;
  type: RoadmapItemType;
  title: string;
  skillIds: string[];
  prerequisiteIds: string[];
  estimatedHours: number;
  priorityScore: number;
  status: RoadmapItemStatus;
  reason: string;
  unlocks: string[];
  resourceIds: string[];
  milestone: number;
}

export interface Roadmap {
  learnerId: string;
  items: RoadmapItem[];
  totalEstimatedWeeks: number;
  compiledAt: Date;
  version: number;
}

// ── Recommendation Trace ────────────────────────────────────

export interface RecommendationTrace {
  recommendationId: string;
  skillId: string;
  skillName: string;
  triggeredBySkills: string[];
  gap: number;
  roleImportance: number;
  centrality: number;
  unlockValue: number;
  goalRelevance: number;
  estimatedCost: number;
  priorityScore: number;
  prerequisiteReason: string[];
  excludedAlternatives: Array<{
    skillId: string;
    skillName: string;
    reason: string;
  }>;
}

// ── Skill Gap ───────────────────────────────────────────────

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentProficiency: number;
  targetProficiency: number;
  gap: number;
  roleImportance: number;
  centrality: number;
  unlockValue: number;
  goalRelevance: number;
  learningCost: number;
  priorityScore: number;
}

// ── Recompilation ───────────────────────────────────────────

export interface RecompilationResult {
  dependenciesChecked: number;
  skillsRecomputed: number;
  resourcesRemoved: number;
  resourcesAdded: number;
  milestonesUpdated: number;
  reason: string;
  affectedSkills: string[];
  changes: Array<{
    type: 'skill_updated' | 'resource_removed' | 'resource_added' | 'milestone_changed' | 'order_changed';
    description: string;
  }>;
}

// ── Goal Interpretation (LLM output) ────────────────────────

export interface InterpretedGoal {
  targetRole: string;
  objective: string;
  timeframeWeeks: number;
  weeklyHours: number;
  currentLevel: ExperienceLevel;
  learningPreference: LearningMode[];
  constraints: string[];
  targetSkills: string[];
}

// ── Diagnostic ──────────────────────────────────────────────

export interface DiagnosticQuestion {
  id: string;
  skillId: string;
  skillName: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: number;     // 1–5
  explanation: string;
}

export interface DiagnosticAnswer {
  questionId: string;
  skillId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeTakenMs?: number;
}

export interface DiagnosticResult {
  learnerId: string;
  answers: DiagnosticAnswer[];
  skillUpdates: Array<{
    skillId: string;
    skillName: string;
    before: number;
    after: number;
    confidenceBefore: number;
    confidenceAfter: number;
  }>;
  completedAt: Date;
}

// ── Feedback (LLM structured output) ────────────────────────

export type FeedbackIntent =
  | 'increase_difficulty'
  | 'decrease_difficulty'
  | 'increase_prior_knowledge'
  | 'skip_topic'
  | 'change_resource_type'
  | 'reduce_repetition'
  | 'add_challenge'
  | 'general';

export interface StructuredFeedback {
  type: 'LEARNER_FEEDBACK';
  skill: string;
  intent: FeedbackIntent;
  confidence: number;
  rawText: string;
}

// ── Role Definition ─────────────────────────────────────────

export interface TargetRole {
  id: string;
  name: string;
  description: string;
  requiredSkills: Array<{
    skillId: string;
    targetProficiency: number;  // 0–100
    importance: number;         // 0–1
  }>;
  estimatedTotalHours: number;
}

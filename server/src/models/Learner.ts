import mongoose, { Schema, Document } from 'mongoose';

// ── Evidence Sub-Schema ─────────────────────────────────────

const EvidenceSchema = new Schema({
  type: {
    type: String,
    enum: ['SELF_REPORT', 'DIAGNOSTIC', 'COURSE_COMPLETION', 'ASSESSMENT', 'PROJECT', 'PRACTICE', 'RECENCY'],
    required: true,
  },
  score: { type: Number, min: 0, max: 100 },
  source: String,
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed },
}, { _id: false });

// ── SkillState Sub-Schema ───────────────────────────────────

const SkillStateSchema = new Schema({
  skillId: { type: String, required: true },
  proficiency: { type: Number, min: 0, max: 100, default: 0 },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  evidence: [EvidenceSchema],
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

// ── LearnerGoal Sub-Schema ──────────────────────────────────

const LearnerGoalSchema = new Schema({
  targetRole: { type: String, required: true },
  objective: String,
  timeframeWeeks: { type: Number, default: 24 },
  weeklyHours: { type: Number, default: 8 },
  currentLevel: {
    type: String,
    enum: ['beginner', 'beginner_intermediate', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
  },
  learningPreference: [{
    type: String,
    enum: ['video', 'reading', 'project_based', 'interactive', 'course', 'mentored'],
  }],
  constraints: [String],
  targetSkills: [String],
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

export interface ILearnerGoal {
  targetRole: string;
  objective?: string;
  timeframeWeeks: number;
  weeklyHours: number;
  currentLevel: 'beginner' | 'beginner_intermediate' | 'intermediate' | 'advanced' | 'expert';
  learningPreference: string[];
  constraints: string[];
  targetSkills: string[];
  createdAt: Date;
}

export interface ILearnerSkillState {
  skillId: string;
  proficiency: number;
  confidence: number;
  evidence: Array<{
    type: string;
    score?: number;
    source?: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }>;
  lastUpdated: Date;
}

export interface ILearner extends Document {
  name: string;
  email: string;
  passwordHash: string;
  experienceLevel: string;
  goals: ILearnerGoal[];
  interests: string[];
  weeklyHours: number;
  preferredLearningModes: string[];
  completedResources: string[];
  skillStates: ILearnerSkillState[];
  assessmentHistory: string[];
  projectHistory: string[];
  feedbackEvents: string[];
  currentRoadmapVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const LearnerSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'beginner_intermediate', 'intermediate', 'advanced', 'expert'],
    default: 'beginner',
  },
  goals: [LearnerGoalSchema],
  interests: [String],
  weeklyHours: { type: Number, default: 8 },
  preferredLearningModes: [{
    type: String,
    enum: ['video', 'reading', 'project_based', 'interactive', 'course', 'mentored'],
  }],
  completedResources: [String],
  skillStates: [SkillStateSchema],
  assessmentHistory: [String],
  projectHistory: [String],
  feedbackEvents: [String],
  currentRoadmapVersion: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export const LearnerModel = mongoose.model<ILearner>('Learner', LearnerSchema);

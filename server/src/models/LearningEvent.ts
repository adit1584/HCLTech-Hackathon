import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningEvent extends Document {
  learnerId: string;
  type: string;
  skillIds: string[];
  resourceId?: string;
  score?: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const LearningEventSchema = new Schema({
  learnerId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: [
      'DIAGNOSTIC_COMPLETED',
      'ASSESSMENT_COMPLETED',
      'PROJECT_COMPLETED',
      'RESOURCE_COMPLETED',
      'PRACTICE_COMPLETED',
      'FEEDBACK_RECEIVED',
      'SKILL_SELF_REPORTED',
      'GOAL_CHANGED',
      'TIME_CONSTRAINT_CHANGED',
    ],
    required: true,
  },
  skillIds: [String],
  resourceId: String,
  score: { type: Number, min: 0, max: 100 },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
});

LearningEventSchema.index({ learnerId: 1, timestamp: -1 });
LearningEventSchema.index({ type: 1 });

export const LearningEventModel = mongoose.model<ILearningEvent>('LearningEvent', LearningEventSchema);

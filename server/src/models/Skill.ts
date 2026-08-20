import mongoose, { Schema, Document } from 'mongoose';

export interface ISkill extends Document {
  skillId: string;
  name: string;
  category: string;
  description: string;
  prerequisites: string[];
  relatedSkills: string[];
  roleImportance: Array<{ roleId: string; importance: number }>;
  difficulty: number;
  estimatedHours: number;
}

const RoleImportanceSchema = new Schema({
  roleId: { type: String, required: true },
  importance: { type: Number, min: 0, max: 1, required: true },
}, { _id: false });

const SkillSchema = new Schema({
  skillId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  prerequisites: [String],
  relatedSkills: [String],
  roleImportance: [RoleImportanceSchema],
  difficulty: { type: Number, min: 1, max: 5, required: true },
  estimatedHours: { type: Number, required: true },
});

SkillSchema.index({ category: 1 });

export const SkillModel = mongoose.model<ISkill>('Skill', SkillSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  resourceId: string;
  title: string;
  type: string;
  skills: string[];
  prerequisites: string[];
  difficulty: number;
  estimatedHours: number;
  qualityScore: number;
  description: string;
  source: string;
  url: string;
}

const ResourceSchema = new Schema({
  resourceId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['COURSE', 'PROJECT', 'ASSESSMENT', 'PRACTICE', 'READING', 'VIDEO'],
    required: true,
  },
  skills: [String],
  prerequisites: [String],
  difficulty: { type: Number, min: 1, max: 5, required: true },
  estimatedHours: { type: Number, required: true },
  qualityScore: { type: Number, min: 0, max: 1, default: 0.8 },
  description: { type: String, required: true },
  source: { type: String, default: 'pathwise' },
  url: { type: String, default: '' },
});

ResourceSchema.index({ skills: 1 });
ResourceSchema.index({ type: 1 });

export const ResourceModel = mongoose.model<IResource>('Resource', ResourceSchema);

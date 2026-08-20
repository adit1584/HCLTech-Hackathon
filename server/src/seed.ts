// ============================================================
// Database Seed Script
// Seeds MongoDB with skills, resources, roles, and demo learner
// Usage: npm run seed
// ============================================================

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Could not set custom DNS servers', e);
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

import { SkillModel } from './models/Skill.js';
import { ResourceModel } from './models/Resource.js';
import { LearnerModel } from './models/Learner.js';

function getDataDir(): string {
  const p1 = resolve(process.cwd(), '../data');
  if (existsSync(p1)) return p1;
  return resolve(process.cwd(), 'data');
}

function loadJSON(filename: string) {
  return JSON.parse(readFileSync(join(getDataDir(), filename), 'utf-8'));
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not set. Create a .env file.');
    process.exit(1);
  }

  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log('✅ Connected');

  // ── Seed Skills ─────────────────────────────────────────
  console.log('🌱 Seeding skills...');
  const skills = loadJSON('skills.json');
  await SkillModel.deleteMany({});
  await SkillModel.insertMany(skills);
  console.log(`   ✅ ${skills.length} skills seeded`);

  // ── Seed Resources ──────────────────────────────────────
  console.log('🌱 Seeding resources...');
  const resources = loadJSON('resources.json');
  await ResourceModel.deleteMany({});
  await ResourceModel.insertMany(resources);
  console.log(`   ✅ ${resources.length} resources seeded`);

  // ── Seed Demo Learner ───────────────────────────────────
  console.log('🌱 Seeding demo learner...');
  const demoData = loadJSON('demo-learner.json');

  // Remove existing demo learner
  await LearnerModel.deleteOne({ email: demoData.email });

  const passwordHash = await bcrypt.hash(demoData.password, 12);

  await LearnerModel.create({
    name: demoData.name,
    email: demoData.email,
    passwordHash,
    experienceLevel: demoData.experienceLevel,
    goals: demoData.goals.map((g: any) => ({
      ...g,
      createdAt: new Date(),
    })),
    interests: demoData.interests,
    weeklyHours: demoData.weeklyHours,
    preferredLearningModes: demoData.preferredLearningModes,
    completedResources: [],
    skillStates: demoData.skillStates.map((s: any) => ({
      ...s,
      evidence: s.evidence.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp),
      })),
      lastUpdated: new Date(),
    })),
    assessmentHistory: [],
    projectHistory: [],
    feedbackEvents: [],
  });

  console.log(`   ✅ Demo learner "${demoData.name}" created`);
  console.log(`      Email: ${demoData.email}`);
  console.log(`      Password: ${demoData.password}`);

  // ── Done ────────────────────────────────────────────────
  console.log('\n🎉 Seeding complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

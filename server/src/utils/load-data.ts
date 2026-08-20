import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { TargetRole, Skill, Resource } from '../models/types.js';

function getDataDir(): string {
  // Works both in dev (running from Prototype/server) and built dist
  return resolve(process.cwd(), '../data');
}

export function loadRolesData(): TargetRole[] {
  try {
    const filePath = join(getDataDir(), 'roles.json');
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    try {
      // Fallback relative to current working directory
      const localPath = resolve(process.cwd(), 'data/roles.json');
      return JSON.parse(readFileSync(localPath, 'utf-8'));
    } catch {
      console.warn('Failed to load roles.json data:', err);
      return [];
    }
  }
}

export function loadSkillsData(): Skill[] {
  try {
    const filePath = join(getDataDir(), 'skills.json');
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function loadResourcesData(): Resource[] {
  try {
    const filePath = join(getDataDir(), 'resources.json');
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

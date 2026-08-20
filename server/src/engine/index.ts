export { calculateGap, normalizeGap, computeSkillGaps } from './gap-engine.js';
export { calculateCentrality, getDirectDependents, getTransitiveDependents } from './centrality.js';
export { calculateUnlockValue, calculateAllUnlockValues } from './unlock-value.js';
export { computePriorityScores } from './priority-scorer.js';
export { optimizePath, estimatePathDuration } from './path-optimizer.js';
export { generateRoadmap } from './roadmap-generator.js';
export { updateProficiency, updateFromDiagnostic, updateFromAssessment, updateFromProject } from './mastery-updater.js';
export { recompile } from './recompiler.js';

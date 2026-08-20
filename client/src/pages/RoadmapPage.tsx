import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { RoadmapItem, RecompilationResult } from '../types';
import {
  Map,
  CheckCircle2,
  Lock,
  Play,
  Eye,
  Clock,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';
import { RecompilationBanner } from '../components/RecompilationBanner';

export const RoadmapPage: React.FC = () => {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedSkillForTrace, setSelectedSkillForTrace] = useState<string | null>(null);
  const [recompilationResult, setRecompilationResult] = useState<RecompilationResult | null>(null);
  const [completingItem, setCompletingItem] = useState<string | null>(null);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.getCurrentPath();
      setRoadmap(res.roadmap);
      setTotalWeeks(res.totalEstimatedWeeks);
      setVersion(res.version);
    } catch {
      const res = await api.compilePath();
      setRoadmap(res.roadmap);
      setTotalWeeks(res.totalEstimatedWeeks);
      setVersion(res.version);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleCompleteItem = async (item: RoadmapItem) => {
    setCompletingItem(item.id);
    try {
      // 1. Record progress event
      const skillId = item.skillIds[0] || 'sql';
      const eventType =
        item.type === 'PROJECT'
          ? 'PROJECT_COMPLETED'
          : item.type === 'ASSESSMENT'
          ? 'ASSESSMENT_COMPLETED'
          : 'RESOURCE_COMPLETED';

      await api.recordProgressEvent({
        type: eventType,
        skillIds: [skillId],
        resourceId: item.resourceIds?.[0] || item.id,
        score: 88, // high score to demonstrate recompilation
      });

      // 2. Trigger recompilation on the affected DAG
      const recompileRes = await api.recompilePath(
        [skillId],
        `Completed ${item.title} with 88% mastery`
      );

      setRoadmap(recompileRes.roadmap);
      setTotalWeeks(recompileRes.totalEstimatedWeeks);
      setVersion(recompileRes.version);
      setRecompilationResult(recompileRes.recompilation);
    } catch (err) {
      console.error('Failed to complete item and recompile:', err);
    } finally {
      setCompletingItem(null);
    }
  };

  // Group roadmap by milestone
  const milestones = roadmap.reduce((acc, item) => {
    const m = item.milestone || 1;
    if (!acc[m]) acc[m] = [];
    acc[m].push(item);
    return acc;
  }, {} as { [milestone: number]: RoadmapItem[] });

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
              Prerequisite-Aware Sequence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              v{version}.0
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Personalized Learning Roadmap
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Total Estimated Horizon: <strong className="text-indigo-300 font-mono">{totalWeeks} weeks</strong> • Grouped into capacity-optimized milestones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-600" /> Locked
            </span>
          </div>
        </div>
      </div>

      {/* Recompilation Result Banner */}
      {recompilationResult && (
        <RecompilationBanner
          result={recompilationResult}
          onDismiss={() => setRecompilationResult(null)}
        />
      )}

      {/* Milestones Timeline */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Compiling dependency graph and resource catalog...</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(milestones).map(([mNum, items]) => (
            <div key={mNum} className="space-y-4">
              {/* Milestone Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold font-mono">
                  M{mNum}
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Milestone {mNum} • Phase Foundation
                </h3>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>

              {/* Items in Milestone */}
              <div className="grid grid-cols-1 gap-3 pl-2 sm:pl-4 border-l-2 border-slate-800 ml-4">
                {items.map(item => {
                  const isAvailable = item.status === 'available';
                  const isCompleted = item.status === 'completed';
                  const isLocked = item.status === 'locked';

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCompleted
                          ? 'bg-slate-950/40 border-emerald-900/40 opacity-75'
                          : isAvailable
                          ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg glow-indigo'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                                item.type === 'PROJECT'
                                  ? 'bg-purple-950 border border-purple-500/40 text-purple-300'
                                  : item.type === 'ASSESSMENT'
                                  ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                                  : 'bg-indigo-950 border border-indigo-500/40 text-indigo-300'
                              }`}
                            >
                              {item.type}
                            </span>
                            <h4 className="text-base font-bold text-white">{item.title}</h4>
                          </div>

                          <p className="text-xs text-slate-300">{item.reason}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                              ~{item.estimatedHours} hrs
                            </span>

                            {item.priorityScore > 0 && (
                              <span className="flex items-center gap-1 font-mono text-indigo-300">
                                <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                                Priority: {item.priorityScore.toFixed(2)}
                              </span>
                            )}

                            {item.unlocks && item.unlocks.length > 0 && (
                              <span className="text-purple-300 text-[11px]">
                                Unlocks: {item.unlocks.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.skillIds && item.skillIds[0] && (
                            <button
                              onClick={() => setSelectedSkillForTrace(item.skillIds[0])}
                              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-700/60 transition-colors text-xs font-medium flex items-center gap-1 cursor-pointer"
                              title="Inspect Recommendation Trace"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Trace</span>
                            </button>
                          )}

                          {isCompleted ? (
                            <span className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                            </span>
                          ) : isAvailable ? (
                            <button
                              onClick={() => handleCompleteItem(item)}
                              disabled={completingItem === item.id}
                              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {completingItem === item.id ? (
                                <span>Recompiling...</span>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Mark Done & Recompile</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-xs font-semibold flex items-center gap-1">
                              <Lock className="h-3.5 w-3.5" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation Trace Modal */}
      {selectedSkillForTrace && (
        <RecommendationTraceModal
          skillId={selectedSkillForTrace}
          isOpen={Boolean(selectedSkillForTrace)}
          onClose={() => setSelectedSkillForTrace(null)}
        />
      )}
    </div>
  );
};

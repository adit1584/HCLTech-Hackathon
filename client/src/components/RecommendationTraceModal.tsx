import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { RecommendationTrace } from '../types';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Unlock,
  Info,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface RecommendationTraceModalProps {
  skillId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const RecommendationTraceModal: React.FC<RecommendationTraceModalProps> = ({
  skillId,
  isOpen,
  onClose,
}) => {
  const [traceData, setTraceData] = useState<{
    trace: RecommendationTrace;
    unlocks: Array<{ id: string; name: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !skillId) return;
    setLoading(true);
    api
      .getRecommendationTrace(skillId)
      .then(res => setTraceData(res))
      .catch(err => console.error('Failed to load trace:', err))
      .finally(() => setLoading(false));
  }, [isOpen, skillId]);

  if (!isOpen) return null;

  const { trace, unlocks } = traceData || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0b0f17]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Recommendation Trace</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                  AUDITABLE
                </span>
              </div>
              <p className="text-xs text-slate-400">Deterministic decision factors & explanation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading || !trace ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <div className="inline-block h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Evaluating recommendation scoring factors...</p>
            </div>
          ) : (
            <>
              {/* Skill Highlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-400 uppercase tracking-wider font-mono">
                    Target Skill
                  </span>
                  <h4 className="text-xl font-bold text-white mt-0.5">{trace.skillName}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Priority Score</span>
                  <div className="text-2xl font-mono font-bold text-indigo-300">
                    {trace.priorityScore.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Mathematical Formula Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
                    Priority Formula Factors
                  </h5>
                  <span className="text-[11px] font-mono text-slate-500">
                    Formula: (Gap × Role × Centrality × Unlock × Relevance) ÷ Cost
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Skill Gap</span>
                      <span className="font-mono text-white font-semibold">{trace.gap.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, trace.gap)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Role Importance</span>
                      <span className="font-mono text-white font-semibold">
                        {(trace.roleImportance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${trace.roleImportance * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Skill Centrality</span>
                      <span className="font-mono text-white font-semibold">
                        {trace.centrality.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${trace.centrality * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Unlock Value</span>
                      <span className="font-mono text-white font-semibold">
                        {trace.unlockValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${trace.unlockValue * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Goal Relevance</span>
                      <span className="font-mono text-white font-semibold">
                        {(trace.goalRelevance * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${trace.goalRelevance * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Learning Cost</span>
                      <span className="font-mono text-white font-semibold">
                        {trace.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${trace.estimatedCost * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Unlocks Section */}
              {unlocks && unlocks.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <h5 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Unlock className="h-4 w-4 text-purple-400" />
                    What Master of This Unlocks
                  </h5>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {unlocks.map(item => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-900/50 border border-purple-500/40 text-purple-200"
                      >
                        <ArrowRight className="h-3 w-3 text-purple-400" />
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisite Reasoning */}
              {trace.prerequisiteReason && trace.prerequisiteReason.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Prerequisite Status
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {trace.prerequisiteReason.map((reason, i) => (
                      <li key={i} className="flex items-center gap-2">
                        {reason.includes('Mastered') ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        )}
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* "Why Not Alternatives?" Section */}
              {trace.excludedAlternatives && trace.excludedAlternatives.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                    Why Not Other Topics First?
                  </h5>
                  <div className="space-y-2">
                    {trace.excludedAlternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 flex items-start justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-200">{alt.skillName}</span>
                          <p className="text-slate-400 mt-0.5">{alt.reason}</p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          DEFERRED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0b0f17] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
};

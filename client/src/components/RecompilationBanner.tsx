import React from 'react';
import type { RecompilationResult } from '../types';
import { Cpu, CheckCircle2, ArrowUpRight, X } from 'lucide-react';

interface RecompilationBannerProps {
  result: RecompilationResult | null;
  onDismiss?: () => void;
}

export const RecompilationBanner: React.FC<RecompilationBannerProps> = ({ result, onDismiss }) => {
  if (!result) return null;

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/60 border border-indigo-500/40 glow-indigo text-slate-200 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 mt-0.5">
            <Cpu className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
                Learning Path Recompiled
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-3 w-3" /> INCREMENTAL
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">{result.reason}</p>

            {/* Compiler Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-300 font-mono">
              <span className="flex items-center gap-1">
                <span className="text-indigo-400 font-bold">{result.dependenciesChecked}</span>{' '}
                dependencies checked
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-indigo-400 font-bold">{result.skillsRecomputed}</span> skills
                recomputed
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="text-indigo-400 font-bold">{result.milestonesUpdated}</span> milestones
                updated
              </span>
            </div>

            {/* Changes list */}
            {result.changes && result.changes.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-indigo-500/20 space-y-1">
                {result.changes.slice(0, 3).map((change, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{change.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

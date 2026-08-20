import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { LearningResource, RecompilationResult } from '../types';
import {
  Award,
  BookOpen,
  Code2,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  Filter,
  Layers,
} from 'lucide-react';
import { RecompilationBanner } from '../components/RecompilationBanner';

export const PracticePage: React.FC = () => {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSESSMENT' | 'PROJECT' | 'PRACTICE' | 'COURSE'>('ALL');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [recompilationResult, setRecompilationResult] = useState<RecompilationResult | null>(null);
  const [completedSuccessMsg, setCompletedSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getResources()
      .then(res => setResources(res.resources || []))
      .catch(err => console.error('Failed to load resources:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCompleteResource = async (resItem: LearningResource, score: number = 90) => {
    setSubmittingId(resItem.resourceId);
    setCompletedSuccessMsg(null);
    try {
      const primarySkill = resItem.skills[0] || 'sql';
      const eventType =
        resItem.type === 'PROJECT'
          ? 'PROJECT_COMPLETED'
          : resItem.type === 'ASSESSMENT'
          ? 'ASSESSMENT_COMPLETED'
          : resItem.type === 'PRACTICE'
          ? 'PRACTICE_COMPLETED'
          : 'RESOURCE_COMPLETED';

      // 1. Post event to backend
      const progressRes = await api.recordProgressEvent({
        type: eventType,
        skillIds: resItem.skills,
        resourceId: resItem.resourceId,
        score,
        metadata: { title: resItem.title, source: 'practice_page' },
      });

      // 2. Trigger recompilation on the affected DAG
      const recompileRes = await api.recompilePath(
        resItem.skills,
        `Passed ${resItem.title} with ${score}% score`
      );

      setRecompilationResult(recompileRes.recompilation);
      setCompletedSuccessMsg(
        `Successfully completed ${resItem.title}! ${primarySkill.toUpperCase()} mastery updated.`
      );
    } catch (err) {
      console.error('Failed to record progress and recompile:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  const filteredResources =
    activeTab === 'ALL'
      ? resources
      : resources.filter(r => r.type === activeTab);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            Hands-on Learning Arena
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Practice, Assessments & Projects
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete hands-on milestones to produce verified evidence and trigger adaptive path recompilation.
          </p>
        </div>
      </div>

      {/* Recompilation Result Banner */}
      {recompilationResult && (
        <RecompilationBanner
          result={recompilationResult}
          onDismiss={() => setRecompilationResult(null)}
        />
      )}

      {/* Success Notification */}
      {completedSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{completedSuccessMsg}</span>
        </div>
      )}

      {/* Tab Filter */}
      <div className="flex flex-wrap gap-2">
        {(['ALL', 'ASSESSMENT', 'PROJECT', 'PRACTICE', 'COURSE'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'ALL' ? 'All Resources' : `${tab}s`}
          </button>
        ))}
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Loading curated resource catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resItem => {
            const isSubmitting = submittingId === resItem.resourceId;

            return (
              <div
                key={resItem.resourceId}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        resItem.type === 'PROJECT'
                          ? 'bg-purple-950 border border-purple-500/40 text-purple-300'
                          : resItem.type === 'ASSESSMENT'
                          ? 'bg-amber-950 border border-amber-500/40 text-amber-300'
                          : resItem.type === 'PRACTICE'
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                          : 'bg-indigo-950 border border-indigo-500/40 text-indigo-300'
                      }`}
                    >
                      {resItem.type}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      ~{resItem.estimatedHours} hrs
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white leading-snug">{resItem.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {resItem.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  {/* Skills tagged */}
                  <div className="flex flex-wrap gap-1.5">
                    {resItem.skills.map(s => (
                      <span
                        key={s}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Submission Action */}
                  <button
                    onClick={() => handleCompleteResource(resItem, 90)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Updating Mastery & Recompiling...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Complete Milestone (90% Score)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

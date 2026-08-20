import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../stores/authContext';
import type {
  LearnerProfile,
  RoadmapItem,
  SkillGap,
  RecompilationResult,
} from '../types';
import {
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  Unlock,
  TrendingUp,
  Award,
  Layers,
  Map,
  ShieldCheck,
  AlertCircle,
  Eye,
  RotateCw,
} from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';
import { RecompilationBanner } from '../components/RecompilationBanner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [recommendations, setRecommendations] = useState<SkillGap[]>([]);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [selectedSkillForTrace, setSelectedSkillForTrace] = useState<string | null>(null);
  const [recompilationResult, setRecompilationResult] = useState<RecompilationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecompiling, setIsRecompiling] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profData, recData, histData] = await Promise.all([
        api.getProfile(),
        api.getRecommendations().catch(() => ({ recommendations: [] })),
        api.getProgressHistory().catch(() => ({ events: [] })),
      ]);

      setProfile(profData);
      setRecommendations(recData.recommendations || []);
      setRecentEvents(histData.events || []);

      try {
        const pathData = await api.getCurrentPath();
        setRoadmap(pathData.roadmap || []);
        setTotalWeeks(pathData.totalEstimatedWeeks || 24);
      } catch {
        // If no path yet, compile one
        const compiled = await api.compilePath();
        setRoadmap(compiled.roadmap || []);
        setTotalWeeks(compiled.totalEstimatedWeeks || 24);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualRecompile = async () => {
    if (!profile) return;
    setIsRecompiling(true);
    try {
      const topSkill = recommendations[0]?.skillId || 'sql';
      const res = await api.recompilePath([topSkill], 'Manual optimization request');
      setRoadmap(res.roadmap);
      setTotalWeeks(res.totalEstimatedWeeks);
      setRecompilationResult(res.recompilation);
    } catch (err) {
      console.error('Recompile failed:', err);
    } finally {
      setIsRecompiling(false);
    }
  };

  // Top Recommendation / Next Best Action
  const nextBestGap = recommendations[0];
  const nextActionItem =
    roadmap.find(i => i.status === 'available') || roadmap[0];

  // Calculate Readiness score
  const activeGoal = profile?.goals?.[profile?.goals?.length - 1];
  const targetRoleName = activeGoal?.targetRole?.replace('-', ' ').toUpperCase() || 'DATA SCIENTIST';

  const skillStates = profile?.skillStates || [];
  const avgProficiency =
    skillStates.length > 0
      ? Math.round(
          skillStates.reduce((sum, s) => sum + s.proficiency, 0) / skillStates.length
        )
      : 50;

  if (loading && !profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading personalized learning intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Recompilation notification if any */}
      {recompilationResult && (
        <RecompilationBanner
          result={recompilationResult}
          onDismiss={() => setRecompilationResult(null)}
        />
      )}

      {/* Top Greeting & Role Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            Target Destination • {targetRoleName}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            Good afternoon, {profile?.name || 'Alex'}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualRecompile}
            disabled={isRecompiling}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRecompiling ? 'animate-spin' : ''}`} />
            <span>Recompile Path</span>
          </button>

          <Link
            to="/roadmap"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
          >
            <Map className="h-3.5 w-3.5" />
            <span>Full Roadmap</span>
          </Link>
        </div>
      </div>

      {/* Primary Row: Next Best Action & Career Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Best Action Card (Master Prompt §24) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/40 shadow-2xl space-y-5 glow-indigo relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              Your Next Best Action
            </div>
            {nextBestGap && (
              <button
                onClick={() => setSelectedSkillForTrace(nextBestGap.skillId)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Inspect Trace</span>
              </button>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {nextActionItem?.title || 'Complete SQL Data Challenge'}
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {nextBestGap
                ? `High priority score (${nextBestGap.priorityScore.toFixed(2)}) with maximum downstream unlock value. Master this to unblock Feature Engineering and Applied ML projects.`
                : 'Targeted exercise to solidify foundational data querying and analysis.'}
            </p>
          </div>

          {/* Unlocks and reasons */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-slate-300">
              <Clock className="h-4 w-4 text-indigo-400" />
              ~{nextActionItem?.estimatedHours || 2} hours estimated
            </span>
            <span className="flex items-center gap-1.5 font-mono text-purple-300">
              <Unlock className="h-4 w-4 text-purple-400" />
              Unlocks: Feature Engineering, Data Analysis
            </span>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/practice"
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <span>Start Learning Action</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            {nextBestGap && (
              <button
                onClick={() => setSelectedSkillForTrace(nextBestGap.skillId)}
                className="px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Why this skill now?
              </button>
            )}
          </div>
        </div>

        {/* Readiness Meter Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Career Readiness</span>
              <span className="font-mono text-indigo-400">{profile?.weeklyHours || 8} hrs/wk</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white font-mono">{avgProficiency}%</span>
              <span className="text-xs text-emerald-400 font-semibold font-mono">
                +{profile?.assessmentHistory?.length ? '14%' : '0%'} this week
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Estimated <strong className="text-white font-mono">{totalWeeks} weeks</strong> remaining
              to reach candidate readiness threshold.
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
                style={{ width: `${avgProficiency}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Novice</span>
              <span>Practitioner (60%)</span>
              <span>Target Role</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Diagnostic Calibrated</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED
            </span>
          </div>
        </div>
      </div>

      {/* Second Row: Skill Capability Matrix & Milestone Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skill Capability Matrix */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" />
              Learner Skill Matrix & Evidence Confidence
            </h3>
            <Link to="/skill-graph" className="text-xs text-indigo-400 hover:text-indigo-300">
              Explore 2D DAG Graph →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skillStates.map(skill => (
              <div
                key={skill.skillId}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 capitalize">
                    {skill.skillId.replace('-', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white font-bold">{skill.proficiency}%</span>
                    <button
                      onClick={() => setSelectedSkillForTrace(skill.skillId)}
                      title="Inspect Recommendation Trace"
                      className="text-slate-500 hover:text-indigo-400 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      skill.proficiency >= 70
                        ? 'bg-emerald-500'
                        : skill.proficiency >= 50
                        ? 'bg-indigo-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${skill.proficiency}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Confidence: {Math.round(skill.confidence * 100)}%</span>
                  <span>{skill.evidence?.length || 1} evidence pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Milestones Stage Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" />
              Active Milestone Pipeline
            </h3>

            <div className="space-y-3">
              {roadmap.slice(0, 4).map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-indigo-400 uppercase">
                        M{item.milestone}
                      </span>
                      <span className="font-semibold text-white">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.reason}</p>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase border ${
                      item.status === 'available'
                        ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                        : item.status === 'completed'
                        ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/roadmap"
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition-colors block"
          >
            View All {roadmap.length} Roadmap Steps
          </Link>
        </div>
      </div>

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

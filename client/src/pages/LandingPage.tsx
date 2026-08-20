import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authContext';
import {
  Compass,
  ArrowRight,
  Sparkles,
  GitFork,
  Cpu,
  Eye,
  Zap,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoClick = async () => {
    await demoLogin();
    navigate('/dashboard');
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Section */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 text-xs font-medium mb-8 glow-indigo">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>HCLTech AI Challenge Prototype</span>
          <span className="text-slate-600">•</span>
          <span className="text-indigo-400 font-semibold">Adaptive Learning Compiler</span>
        </div>

        {/* Master Copy Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Build the right learning path for the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">
            person you are becoming.
          </span>
        </h1>

        {/* Master Supporting Copy */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Pathwise maps your goal, skills, evidence, and constraints into an optimal prerequisite-aware
          journey — then <strong>continuously recompiles it</strong> as your capability evolves.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/onboarding"
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <span>Build My Path</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={handleDemoClick}
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>Launch Live Demo (Alex)</span>
          </button>
        </div>

        {/* Micro proposition badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Deterministic Engine
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-indigo-400" /> Auditable Traces
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-purple-400" /> Incremental Recompilation
          </span>
        </div>
      </div>

      {/* Feature Grid — Signatures */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Why Pathwise is Not Just Another Course Recommender
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Built on strict separation of semantic natural language understanding and deterministic graph optimization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all">
            <div className="p-3 w-fit rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Learning-Value & Unlock Scoring</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              We don't merely measure gap size. We calculate how many downstream capabilities a skill unlocks if mastered now.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all">
            <div className="p-3 w-fit rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 mb-4">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Auditable Recommendation Trace</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Every single recommendation displays its exact formula factors: Gap, Role Importance, Centrality, Unlock Value, and Why Not alternatives.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 transition-all">
            <div className="p-3 w-fit rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 mb-4">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Incremental Recompilation</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              When you pass a diagnostic or assessment, Pathwise updates affected graph nodes without blindly regenerating your entire history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

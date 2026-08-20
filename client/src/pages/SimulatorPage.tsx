import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TargetRole, RoadmapItem } from '../types';
import {
  Sliders,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  TrendingUp,
  CheckCircle2,
  Layers,
  Loader2,
  Info,
} from 'lucide-react';

export const SimulatorPage: React.FC = () => {
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [targetRole, setTargetRole] = useState('data-scientist');
  const [weeklyHours, setWeeklyHours] = useState(15);
  const [simulatedSkills, setSimulatedSkills] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getRoles()
      .then(res => setRoles(res.roles))
      .catch(err => console.error('Failed to load roles:', err));

    // Run initial simulation
    handleRunSimulation();
  }, []);

  const handleRunSimulation = async (
    roleId?: string,
    hours?: number,
    skills?: string[]
  ) => {
    setLoading(true);
    try {
      const res = await api.simulateWhatIf({
        targetRole: roleId || targetRole,
        weeklyHours: hours !== undefined ? hours : weeklyHours,
        skipSkills: skills || simulatedSkills,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillSkip = (skill: string) => {
    const next = simulatedSkills.includes(skill)
      ? simulatedSkills.filter(s => s !== skill)
      : [...simulatedSkills, skill];
    setSimulatedSkills(next);
    handleRunSimulation(targetRole, weeklyHours, next);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/40 text-purple-300 text-xs font-mono mb-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Non-Destructive Scenario Modeler</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          What-If Path Simulator
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Simulate how changes in your study commitment, role goals, or prior skill mastery compress your roadmap — without altering your active profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            Hypothetical Variables
          </h3>

          {/* Role selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Target Role</label>
            <select
              value={targetRole}
              onChange={e => {
                setTargetRole(e.target.value);
                handleRunSimulation(e.target.value, weeklyHours, simulatedSkills);
              }}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.skillCount} skills)
                </option>
              ))}
            </select>
          </div>

          {/* Weekly Hours Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Study Commitment</span>
              <span className="font-mono text-indigo-400 font-bold">{weeklyHours} hrs/week</span>
            </div>
            <input
              type="range"
              min={4}
              max={40}
              step={1}
              value={weeklyHours}
              onChange={e => {
                const val = parseInt(e.target.value);
                setWeeklyHours(val);
                handleRunSimulation(targetRole, val, simulatedSkills);
              }}
              className="w-full accent-indigo-500 bg-slate-800"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>4 hrs</span>
              <span>15 hrs</span>
              <span>40 hrs</span>
            </div>
          </div>

          {/* Skill Master Simulation */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              Simulate Instant Mastery (Test Unblocks)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {['statistics', 'sql', 'python', 'machine-learning'].map(skill => {
                const active = simulatedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkillSkip(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      active
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-2 space-y-6">
          {loading && !simulationResult ? (
            <div className="py-20 text-center text-slate-400 text-sm">
              <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-2" />
              <p>Re-running deterministic optimizer on simulated conditions...</p>
            </div>
          ) : simulationResult ? (
            <>
              {/* Comparison Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Current Standard Path</span>
                  <div className="text-2xl font-extrabold text-slate-300 font-mono">
                    {simulationResult.baseWeeks} weeks
                  </div>
                  <span className="text-[11px] text-slate-500">at standard 8 hrs/wk</span>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 space-y-1 glow-indigo">
                  <span className="text-xs text-indigo-300">Simulated Path</span>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {simulationResult.simulatedTotalWeeks} weeks
                  </div>
                  <span className="text-[11px] text-indigo-400 font-mono">
                    at {simulationResult.simulatedWeeklyHours} hrs/wk
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-1 glow-emerald">
                  <span className="text-xs text-emerald-300">Timeline Acceleration</span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {Math.max(0, simulationResult.baseWeeks - simulationResult.simulatedTotalWeeks)} wks faster
                  </div>
                  <span className="text-[11px] text-emerald-400">
                    Compressed to {simulationResult.totalMilestones} milestones
                  </span>
                </div>
              </div>

              {/* Simulated Roadmap Preview */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-400" />
                    Simulated Milestone Order for {simulationResult.simulatedRole}
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    {simulationResult.simulatedItemsCount} milestones computed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {simulationResult.simulatedRoadmap?.slice(0, 6).map((item: RoadmapItem, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-purple-400 uppercase font-bold">
                          M{item.milestone}
                        </span>
                        <div>
                          <span className="font-bold text-white">{item.title}</span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.reason}</p>
                        </div>
                      </div>
                      <span className="font-mono text-slate-400">~{item.estimatedHours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

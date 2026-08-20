import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { TargetRole } from '../types';
import {
  Compass,
  Sparkles,
  ArrowRight,
  Clock,
  Briefcase,
  Target,
  Sliders,
  CheckCircle2,
  Loader2,
  Code2,
} from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Natural Language Goal
  const [nlText, setNlText] = useState(
    'I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning.'
  );
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [extractedGoal, setExtractedGoal] = useState<any>(null);

  // Step 2: Fine-Tuning & Self-Report
  const [targetRole, setTargetRole] = useState('data-scientist');
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [timeframeWeeks, setTimeframeWeeks] = useState(24);
  const [currentLevel, setCurrentLevel] = useState('beginner_intermediate');
  const [preferredMode, setPreferredMode] = useState<string[]>(['project_based']);

  // Self reported skill proficiencies
  const [selfSkills, setSelfSkills] = useState<{ [key: string]: number }>({
    python: 70,
    excel: 75,
    sql: 50,
    statistics: 40,
    'machine-learning': 20,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .getRoles()
      .then(res => setRoles(res.roles))
      .catch(err => console.error('Failed to load roles:', err));
  }, []);

  const handleInterpret = async () => {
    if (!nlText.trim()) return;
    setIsInterpreting(true);
    try {
      const res = await api.interpretGoal(nlText);
      const parsed = res.interpreted;
      setExtractedGoal(parsed);

      if (parsed.targetRole) setTargetRole(parsed.targetRole);
      if (parsed.weeklyHours) setWeeklyHours(parsed.weeklyHours);
      if (parsed.timeframeWeeks) setTimeframeWeeks(parsed.timeframeWeeks);
      if (parsed.currentLevel) setCurrentLevel(parsed.currentLevel);
      if (parsed.learningPreference) setPreferredMode(parsed.learningPreference);

      setStep(2);
    } catch (err) {
      console.error('Goal interpretation failed:', err);
      // Proceed with defaults
      setStep(2);
    } finally {
      setIsInterpreting(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const selfReportList = Object.entries(selfSkills).map(([skillId, proficiency]) => ({
        skillId,
        proficiency,
      }));

      await api.setGoal(
        {
          targetRole,
          objective: 'career_transition',
          timeframeWeeks,
          weeklyHours,
          currentLevel,
          learningPreference: preferredMode,
          constraints: [],
          targetSkills: [],
        },
        selfReportList
      );

      // Compile path
      await api.compilePath();

      // Navigate to Diagnostic or Dashboard
      navigate('/diagnostic');
    } catch (err) {
      console.error('Failed to save goal and compile path:', err);
      navigate('/dashboard');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Progress header */}
      <div className="mb-10 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 text-xs font-mono">
          <span>STEP {step} OF 2</span>
          <span>•</span>
          <span>{step === 1 ? 'NATURAL LANGUAGE GOAL' : 'STRUCTURED PROFILE'}</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Define Your Destination
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Pathwise extracts your objective, background, and constraints into an auditable learner model.
        </p>
      </div>

      {step === 1 ? (
        /* Step 1: Natural Language Prompt */
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Describe your goal and background in your own words
            </label>
            <p className="text-xs text-slate-400">
              Tell us what you want to achieve, your timeline, available weekly hours, and what you already know.
            </p>
          </div>

          <textarea
            rows={5}
            value={nlText}
            onChange={e => setNlText(e.target.value)}
            placeholder="e.g. I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning."
            className="w-full p-4 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
          />

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Quick examples:</span>
            <button
              type="button"
              onClick={() =>
                setNlText(
                  'I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning.'
                )
              }
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              Data Scientist (Golden Demo)
            </button>
            <button
              type="button"
              onClick={() =>
                setNlText(
                  'I am an intermediate Python developer wanting to transition to ML Engineer in 4 months with 12 hours a week.'
                )
              }
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              ML Engineer
            </button>
            <button
              type="button"
              onClick={() =>
                setNlText(
                  'I know HTML and CSS. I want to become a Full Stack Developer in 5 months studying 10 hours a week.'
                )
              }
              className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              Full Stack Dev
            </button>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleInterpret}
              disabled={isInterpreting || !nlText.trim()}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {isInterpreting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting Semantic Intent with Groq...</span>
                </>
              ) : (
                <>
                  <span>Extract & Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Structured Review & Self-Report */
        <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-8">
          {/* Extracted confirmation badge */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white">Semantic extraction complete.</span> Please review and fine-tune your parameters below before compiling your learning path.
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-400" />
              Target Role
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map(role => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setTargetRole(role.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    targetRole === role.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm">{role.name}</div>
                  <div className="text-xs text-slate-400 mt-1 line-clamp-2">{role.description}</div>
                  <div className="text-[11px] font-mono text-indigo-400 mt-2">
                    {role.skillCount} required skills
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time & Study Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  Weekly Availability
                </span>
                <span className="font-mono text-indigo-400 font-bold">{weeklyHours} hrs/week</span>
              </label>
              <input
                type="range"
                min={2}
                max={40}
                step={1}
                value={weeklyHours}
                onChange={e => setWeeklyHours(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>2 hrs (casual)</span>
                <span>20 hrs (part-time)</span>
                <span>40 hrs (full-time)</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-indigo-400" />
                  Target Horizon
                </span>
                <span className="font-mono text-indigo-400 font-bold">
                  {timeframeWeeks} weeks ({Math.round(timeframeWeeks / 4)} mo)
                </span>
              </label>
              <input
                type="range"
                min={4}
                max={52}
                step={2}
                value={timeframeWeeks}
                onChange={e => setTimeframeWeeks(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 month</span>
                <span>6 months</span>
                <span>12 months</span>
              </div>
            </div>
          </div>

          {/* Self-reported starting proficiency */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">
                Self-Reported Starting Proficiency (0–100)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Note: Self-reports have a baseline confidence of 30%. You can calibrate them in the next step with our diagnostic.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(selfSkills).map(([skill, val]) => (
                <div key={skill} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 capitalize">
                      {skill.replace('-', ' ')}
                    </span>
                    <span className="font-mono text-indigo-400 font-bold">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={e =>
                      setSelfSkills(prev => ({
                        ...prev,
                        [skill]: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-between items-center border-t border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              ← Back to prompt
            </button>

            <button
              onClick={handleFinish}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compiling Prerequisite Graph...</span>
                </>
              ) : (
                <>
                  <span>Save Profile & Start Diagnostic</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

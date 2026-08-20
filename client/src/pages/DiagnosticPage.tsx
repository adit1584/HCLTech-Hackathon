import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import type { DiagnosticQuestion } from '../types';
import {
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Loader2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export const DiagnosticPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [targetRole, setTargetRole] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .startDiagnostic()
      .then(res => {
        setQuestions(res.questions);
        setTargetRole(res.targetRole);
      })
      .catch(err => {
        console.error('Failed to load diagnostic:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentQ = questions[currentIndex];
  const selectedOption = currentQ ? selectedAnswers[currentQ.id] : undefined;

  const handleSelectOption = (idx: number) => {
    if (showExplanation || results) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: idx,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Submit all answers
      handleSubmitAll();
    }
  };

  const handleSubmitAll = async () => {
    setSubmitting(true);
    try {
      const answersPayload = questions.map(q => ({
        questionId: q.id,
        selectedAnswer: selectedAnswers[q.id] ?? -1,
      }));

      const res = await api.submitDiagnostic(answersPayload);
      setResults(res.results);

      // Trigger automatic recompile
      const changedSkills = res.results.map((r: any) => r.skillId);
      if (changedSkills.length > 0) {
        await api.recompilePath(changedSkills, 'Diagnostic completed');
      }
    } catch (err) {
      console.error('Diagnostic submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">
            Generating adaptive diagnostic calibrated to your uncertain skills...
          </p>
        </div>
      </div>
    );
  }

  if (results) {
    // Show calibration results
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Diagnostic Complete
          </h2>
          <p className="text-sm text-slate-400">
            Your learner capability model has been updated with high-confidence evidence.
          </p>
        </div>

        {/* Before vs After Cards */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            Calibrated Skill Proficiencies
          </h3>

          <div className="space-y-3">
            {results.map(r => (
              <div
                key={r.skillId}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-sm text-white">{r.skillName}</span>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Evidence: Diagnostic Assessment</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono">
                      Confidence: {(r.confidenceAfter * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 line-through mr-2 font-mono">
                      {r.before}%
                    </span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      {r.after}%
                    </span>
                  </div>
                  <div className="text-xs px-2 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                    +{r.after - r.before}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer text-base"
          >
            <span>Proceed to Dashboard & Recompiled Roadmap</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">No diagnostic questions available for this profile.</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
            Diagnostic Assessment • {targetRole}
          </span>
          <h3 className="text-xl font-bold text-white mt-0.5">Calibrating Initial Mastery</h3>
        </div>
        <div className="text-right font-mono text-xs text-slate-400">
          Question <span className="text-white font-bold">{currentIndex + 1}</span> of{' '}
          <span className="text-slate-500">{questions.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono uppercase">
            {currentQ.skillName}
          </span>
          <span>Difficulty: {currentQ.difficulty}/5</span>
        </div>

        <h4 className="text-lg font-bold text-white leading-relaxed">{currentQ.question}</h4>

        {/* Options */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = currentQ.correctAnswer === idx;

            let btnStyle =
              'border-slate-800 bg-slate-950/70 text-slate-200 hover:border-slate-700';

            if (showExplanation) {
              if (isCorrect) {
                btnStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-200';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'border-rose-500 bg-rose-950/60 text-rose-200';
              }
            } else if (isSelected) {
              btnStyle = 'border-indigo-500 bg-indigo-950/80 text-white';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                disabled={showExplanation}
                className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${btnStyle} cursor-pointer`}
              >
                <span>{option}</span>
                {showExplanation && (
                  <div>
                    {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                    {isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-400" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Explanation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Next / Submit Button */}
        {showExplanation && (
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting & Recompiling...</span>
                </>
              ) : currentIndex < questions.length - 1 ? (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Finish Diagnostic</span>
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

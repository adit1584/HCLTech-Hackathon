import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/authContext';
import {
  Compass,
  Map,
  Network,
  Sparkles,
  Award,
  Layers,
  LogOut,
  Sliders,
  User,
  Zap,
} from 'lucide-react';
import { AssistantModal } from './AssistantModal';

export const Navbar: React.FC = () => {
  const { user, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Pathwise
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                    AI
                  </span>
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slate-800/80 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Compass className="h-4 w-4" />
                  Dashboard
                </Link>

                <Link
                  to="/roadmap"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive('/roadmap')
                      ? 'bg-slate-800/80 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Map className="h-4 w-4" />
                  Roadmap
                </Link>

                <Link
                  to="/skill-graph"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive('/skill-graph')
                      ? 'bg-slate-800/80 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Network className="h-4 w-4" />
                  Skill Graph
                </Link>

                <Link
                  to="/practice"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive('/practice')
                      ? 'bg-slate-800/80 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  Practice
                </Link>

                <Link
                  to="/simulator"
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isActive('/simulator')
                      ? 'bg-slate-800/80 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Sliders className="h-4 w-4" />
                  What-If
                </Link>
              </nav>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* AI Assistant Button */}
                <button
                  onClick={() => setIsAssistantOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-900/60 transition-all glow-indigo cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                  <span className="hidden sm:inline">Ask AI</span>
                </button>

                {/* Diagnostic quick action */}
                <button
                  onClick={() => navigate('/diagnostic')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 transition-all cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Diagnostic</span>
                </button>

                {/* User avatar & logout */}
                <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
                  <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={logout}
                    title="Logout"
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={async () => {
                    await demoLogin();
                    navigate('/dashboard');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 hover:bg-indigo-900 transition-all glow-indigo cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  Demo as Alex
                </button>
                <Link
                  to="/auth"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AI Assistant Modal */}
      {isAssistantOpen && (
        <AssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      )}
    </>
  );
};

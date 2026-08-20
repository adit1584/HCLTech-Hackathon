import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../services/api';
import type { SkillNode, SkillState } from '../types';
import { Network, Info, Eye, Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { RecommendationTraceModal } from '../components/RecommendationTraceModal';

export const SkillGraphPage: React.FC = () => {
  const [skills, setSkills] = useState<SkillNode[]>([]);
  const [skillStates, setSkillStates] = useState<{ [id: string]: SkillState }>({});
  const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);
  const [traceSkillId, setTraceSkillId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGraph = async () => {
      try {
        setLoading(true);
        const [graphData, profileData] = await Promise.all([
          api.getSkillGraph(),
          api.getProfile().catch(() => null),
        ]);

        setSkills(graphData.nodes || []);

        const stateMap: { [id: string]: SkillState } = {};
        (profileData?.skillStates || []).forEach(s => {
          stateMap[s.skillId] = s;
        });
        setSkillStates(stateMap);
      } catch (err) {
        console.error('Failed to load skill graph:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, []);

  // Compute hierarchical layout coordinates for React Flow nodes
  const { nodes, edges } = useMemo(() => {
    if (skills.length === 0) return { nodes: [], edges: [] };

    // Group skills by estimated graph depth / category
    const categories: { [cat: string]: SkillNode[] } = {};
    skills.forEach(s => {
      const cat = s.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s);
    });

    const categoryOrder = [
      'Programming',
      'Data',
      'Mathematics',
      'Data Science Libraries',
      'Data Science',
      'Data Engineering',
      'Machine Learning',
      'AI',
      'Web Development',
      'Backend',
      'Engineering',
      'DevOps',
      'Tools',
      'Applied',
    ];

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Layout positions
    const catKeys = Object.keys(categories).sort(
      (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    );

    catKeys.forEach((cat, colIdx) => {
      const items = categories[cat];
      items.forEach((skill, rowIdx) => {
        const state = skillStates[skill.id];
        const prof = state?.proficiency ?? 0;

        let borderClass = 'border-slate-700 bg-slate-900';
        let badgeColor = 'text-slate-400 bg-slate-800';

        if (prof >= 70) {
          borderClass = 'border-emerald-500/80 bg-emerald-950/40 shadow-emerald-950/40';
          badgeColor = 'text-emerald-300 bg-emerald-950 border border-emerald-500/40';
        } else if (prof >= 50) {
          borderClass = 'border-indigo-500/80 bg-indigo-950/40 shadow-indigo-950/40';
          badgeColor = 'text-indigo-300 bg-indigo-950 border border-indigo-500/40';
        } else if (prof > 0) {
          borderClass = 'border-amber-500/80 bg-amber-950/40';
          badgeColor = 'text-amber-300 bg-amber-950 border border-amber-500/40';
        }

        flowNodes.push({
          id: skill.id,
          position: { x: colIdx * 280 + 50, y: rowIdx * 130 + 80 },
          data: {
            label: (
              <div
                onClick={() => setSelectedSkill(skill)}
                className={`p-3 rounded-xl border ${borderClass} shadow-lg cursor-pointer transition-all hover:scale-105 text-left w-56 space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                    {skill.category}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                    {prof}%
                  </span>
                </div>
                <div className="font-bold text-xs text-white truncate">{skill.name}</div>
                <div className="text-[10px] text-slate-500 flex justify-between items-center">
                  <span>Diff: {skill.difficulty}/5</span>
                  <span>~{skill.estimatedHours}h</span>
                </div>
              </div>
            ),
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        // Add prerequisite edges
        (skill.prerequisites || []).forEach(prereqId => {
          flowEdges.push({
            id: `e-${prereqId}-${skill.id}`,
            source: prereqId,
            target: skill.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 1.5, opacity: 0.6 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#6366f1',
            },
          });
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [skills, skillStates]);

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden flex">
      {/* Main Flow Canvas */}
      <div className="flex-1 h-full relative">
        {/* Floating Header */}
        <div className="absolute top-4 left-4 z-10 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-1">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Knowledge Dependency Graph</h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> &gt;70% Mastered
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-indigo-400" /> 50-70% Developing
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-600" /> Not Started
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
            Rendering knowledge DAG...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            attributionPosition="bottom-left"
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls />
            <MiniMap
              nodeColor="#4f46e5"
              maskColor="rgba(11, 15, 23, 0.85)"
              className="bg-slate-950! border! border-slate-800! rounded-lg!"
            />
          </ReactFlow>
        )}
      </div>

      {/* Selected Skill Detail Sidebar Drawer */}
      {selectedSkill && (
        <div className="w-80 border-l border-slate-800 bg-[#0f172a] p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">
                {selectedSkill.category}
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{selectedSkill.name}</h3>
            </div>
            <button
              onClick={() => setSelectedSkill(null)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Mastery & Evidence */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Current Mastery</span>
              <span className="font-mono font-bold text-white text-base">
                {skillStates[selectedSkill.id]?.proficiency ?? 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${skillStates[selectedSkill.id]?.proficiency ?? 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>
                Confidence:{' '}
                {Math.round((skillStates[selectedSkill.id]?.confidence ?? 0.3) * 100)}%
              </span>
              <span>{skillStates[selectedSkill.id]?.evidence?.length || 0} evidence records</span>
            </div>
          </div>

          {/* Direct Prerequisites */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Prerequisites
            </h4>
            {selectedSkill.prerequisites && selectedSkill.prerequisites.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedSkill.prerequisites.map(p => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-md text-xs bg-slate-900 border border-slate-800 text-slate-300 font-mono"
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">None (Foundational Skill)</p>
            )}
          </div>

          {/* Action Trigger for Trace */}
          <button
            onClick={() => setTraceSkillId(selectedSkill.id)}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>Inspect Recommendation Trace</span>
          </button>
        </div>
      )}

      {/* Recommendation Trace Modal */}
      {traceSkillId && (
        <RecommendationTraceModal
          skillId={traceSkillId}
          isOpen={Boolean(traceSkillId)}
          onClose={() => setTraceSkillId(null)}
        />
      )}
    </div>
  );
};

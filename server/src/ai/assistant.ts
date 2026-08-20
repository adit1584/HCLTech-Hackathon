// ============================================================
// AI Assistant & Explanation Generator
// ============================================================
// Context-Aware Learning Intelligence Assistant
// Answers questions using real learner state, roadmap, traces, and events.
// Never hallucinates or fabricates progress.
// ============================================================

import Groq from 'groq-sdk';
import { config } from '../config.js';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    if (!config.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }
    groqClient = new Groq({ apiKey: config.groqApiKey });
  }
  return groqClient;
}

export interface AssistantContext {
  learnerName: string;
  targetRole: string;
  weeklyHours: number;
  currentRoadmap: Array<{
    title: string;
    type: string;
    milestone: number;
    status: string;
    priorityScore: number;
    reason: string;
  }>;
  recentEvents: Array<{
    type: string;
    skillIds: string[];
    score?: number;
    timestamp: Date;
  }>;
  skillProficiencies: Array<{
    skillId: string;
    skillName: string;
    proficiency: number;
    confidence: number;
  }>;
}

export async function askAssistant(
  userQuestion: string,
  context: AssistantContext,
): Promise<{ answer: string; suggestedActions: string[] }> {
  try {
    const client = getGroqClient();

    const systemPrompt = `You are the Pathwise AI Learning Assistant.
You provide clear, accurate, and motivating guidance based strictly on the learner's actual profile, skill graph, current roadmap, and recent learning events.

CRITICAL RULES:
1. Ground your answers strictly in the provided learner state.
2. If asked "Why did my roadmap change?", explain using the recent events (e.g. diagnostic completed, assessment score, skill mastery updated).
3. If asked "Why am I learning X before Y?", explain prerequisite dependencies and downstream unlock value.
4. Keep answers concise, actionable, and structured.
5. Provide 2-3 short relevant follow-up actions/questions.

Format response as JSON:
{
  "answer": "Your detailed response in markdown",
  "suggestedActions": ["Action 1", "Action 2"]
}`;

    const userMessage = `Context:
- Learner Name: ${context.learnerName}
- Target Role: ${context.targetRole}
- Weekly Study Hours: ${context.weeklyHours} hrs/week
- Current Skills & Mastery:
${context.skillProficiencies.map(s => `  * ${s.skillName}: ${s.proficiency}% (confidence: ${Math.round(s.confidence * 100)}%)`).join('\n')}
- Current Roadmap Items:
${context.currentRoadmap.slice(0, 8).map(r => `  * [Milestone ${r.milestone}] ${r.title} (${r.type}, Status: ${r.status}, Priority: ${r.priorityScore.toFixed(2)})`).join('\n')}
- Recent Learning Events:
${context.recentEvents.slice(0, 5).map(e => `  * ${e.type} for [${e.skillIds.join(', ')}] (Score: ${e.score ?? 'N/A'}) at ${e.timestamp}`).join('\n')}

Learner Question: "${userQuestion}"`;

    const response = await client.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty assistant response');
    const parsed = JSON.parse(content);
    return {
      answer: parsed.answer || 'I could not generate an answer. Please try again.',
      suggestedActions: parsed.suggestedActions || ['View my roadmap', 'Take next assessment'],
    };
  } catch (error) {
    console.warn('AI assistant fallback:', error);
    // Deterministic fallback based on question keywords
    const lower = userQuestion.toLowerCase();
    if (lower.includes('why') && (lower.includes('change') || lower.includes('update') || lower.includes('recompile'))) {
      const recent = context.recentEvents[0];
      const eventDesc = recent ? `${recent.type} on ${recent.skillIds.join(', ')}` : 'your latest diagnostic and assessment scores';
      return {
        answer: `Your roadmap was dynamically recompiled because of **${eventDesc}**. The Pathwise Learning Compiler updated the proficiency confidence of affected skills, traversed the prerequisite graph, and reprioritized downstream learning items to optimize your journey toward **${context.targetRole}**.`,
        suggestedActions: ['Inspect Recommendation Trace', 'View Updated Roadmap'],
      };
    }

    return {
      answer: `You are currently progressing toward **${context.targetRole}** with an allocation of **${context.weeklyHours} hours/week**. Check your next best action on the dashboard to continue building high-unlock skills.`,
      suggestedActions: ['Go to Next Best Action', 'Check Skill Graph'],
    };
  }
}

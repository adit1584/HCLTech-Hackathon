// ============================================================
// AI Goal Interpreter — Uses Groq LLM for NL → structured JSON
// ============================================================
// This module is the ONLY place where an LLM interprets the
// learner's goal. The LLM does NOT decide what to recommend.
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

const SYSTEM_PROMPT = `You are a goal interpreter for Pathwise, a personalized learning platform.

Given a learner's natural language description of their learning goal, extract a structured JSON object.

Available target roles:
- data-scientist
- ml-engineer
- full-stack-developer
- data-analyst
- ai-engineer

Available learning preferences:
- video
- reading
- project_based
- interactive
- course
- mentored

Experience levels:
- beginner
- beginner_intermediate
- intermediate
- advanced
- expert

Respond ONLY with a valid JSON object matching this schema:
{
  "targetRole": "string (one of the available roles)",
  "objective": "string (career_transition | skill_development | upskilling | hobby)",
  "timeframeWeeks": number,
  "weeklyHours": number,
  "currentLevel": "string (one of the experience levels)",
  "learningPreference": ["string[]"],
  "constraints": ["string[]"],
  "targetSkills": ["string[]"]
}

If the learner doesn't specify a field, use reasonable defaults:
- timeframeWeeks: 24
- weeklyHours: 8
- currentLevel: "beginner"
- learningPreference: ["course"]
- constraints: []
- targetSkills: []`;

export async function interpretGoalWithAI(text: string): Promise<Record<string, unknown>> {
  const client = getGroqClient();

  const response = await client.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from LLM');
  }

  return JSON.parse(content);
}

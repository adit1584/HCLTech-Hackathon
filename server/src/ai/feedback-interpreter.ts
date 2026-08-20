// ============================================================
// AI Feedback Interpreter — NL Feedback to Structured Action
// ============================================================
// Maps learner feedback (e.g. "I already know SQL, give me harder tasks")
// into structured intent. The deterministic engine then decides the action.
// ============================================================

import Groq from 'groq-sdk';
import { config } from '../config.js';
import type { StructuredFeedback, FeedbackIntent } from '../models/types.js';

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

const SYSTEM_PROMPT = `You are a feedback interpreter for Pathwise, an adaptive learning system.
Given a learner's free-text feedback, extract the target skill and their intent into a structured JSON.

Valid intents:
- increase_difficulty (wants harder tasks / more advanced material)
- decrease_difficulty (content is too hard / needs easier foundation)
- increase_prior_knowledge (learner already knows this topic / wants to skip basic courses)
- skip_topic (explicitly wants to skip or defer this topic)
- change_resource_type (wants more videos, more projects, less reading, etc.)
- reduce_repetition (feels too repetitive)
- add_challenge (wants more assessments or projects)
- general (general comment or feedback)

Respond ONLY with a JSON object in this format:
{
  "type": "LEARNER_FEEDBACK",
  "skill": "string (identified skill name or 'general')",
  "intent": "string (one of the valid intents above)",
  "confidence": number (0.0 to 1.0)
}`;

export async function interpretFeedbackWithAI(text: string): Promise<StructuredFeedback> {
  try {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from AI');
    const parsed = JSON.parse(content);
    return {
      type: 'LEARNER_FEEDBACK',
      skill: parsed.skill || 'general',
      intent: (parsed.intent as FeedbackIntent) || 'general',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      rawText: text,
    };
  } catch (error) {
    console.warn('AI feedback interpretation fallback:', error);
    // Deterministic fallback
    const lower = text.toLowerCase();
    let intent: FeedbackIntent = 'general';
    if (lower.includes('harder') || lower.includes('advanced')) intent = 'increase_difficulty';
    else if (lower.includes('easier') || lower.includes('too hard')) intent = 'decrease_difficulty';
    else if (lower.includes('already know') || lower.includes('familiar')) intent = 'increase_prior_knowledge';
    else if (lower.includes('skip') || lower.includes('not interested')) intent = 'skip_topic';

    return {
      type: 'LEARNER_FEEDBACK',
      skill: 'general',
      intent,
      confidence: 0.7,
      rawText: text,
    };
  }
}

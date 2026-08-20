# MASTER BUILD PROMPT — PATHWISE

You are the lead product engineer, AI engineer, UX designer, and QA engineer responsible for building **Pathwise — Personalized Learning Intelligence**, a production-quality hackathon prototype for the HCLTech AI Challenge.

Your task is to build the complete working web application, not a mockup.

The application must feel like a serious, polished product and must demonstrate a genuinely intelligent adaptive learning system rather than a chatbot that generates a static list of courses.

---

# 1. PRODUCT DEFINITION

Build Pathwise around this proposition:

> Pathwise understands a learner's goal and current capability, computes the highest-value skill gaps, constructs a prerequisite-aware learning path, explains every major recommendation, and continuously recompiles that path when new evidence about the learner arrives.

Do NOT build:

- a generic AI chatbot
- a static course recommender
- a form followed by an LLM-generated roadmap
- a dashboard full of meaningless cards
- an interface dominated by gradients or AI imagery
- an unexplained black-box ranking system

The product must demonstrate that recommendations are **computed from learner state, skill relationships, priorities, prerequisites, and evidence**.

---

# 2. CORE ARCHITECTURE

Implement these six logical stages:

```text
GOAL INTERPRETER
      ↓
LEARNER MODEL
      ↓
SKILL DIFF
      ↓
PATH OPTIMIZER
      ↓
ROADMAP GENERATOR
      ↓
RECOMPILER
```

Use the following internal conceptual mapping:

```text
Goal Interpreter = Lexer
Learner Model    = Symbol Table
Skill Diff       = Semantic Diff
Path Optimizer   = Optimizer
Roadmap          = Code Generation
Recommendation   = Debugger
Recompiler       = Incremental Compilation
```

Do not force the compiler terminology into every UI element. It is primarily a product architecture and storytelling device.

---

# 3. NON-NEGOTIABLE AI/ML RULE

This is critical.

The LLM is NOT the recommendation engine.

The LLM may perform:

- natural-language goal interpretation
- learner feedback interpretation
- quiz/question generation
- explanations
- contextual assistant responses

The deterministic learning engine must perform:

- skill-gap calculation
- proficiency updates
- priority scoring
- prerequisite traversal
- resource ranking
- path ordering
- roadmap state
- incremental recompilation

The architecture must make this separation obvious in code.

Never write code equivalent to:

```text
ask LLM → "What should the learner learn?"
```

and blindly display the response.

Instead:

```text
learner state
+
skill graph
+
target role
+
constraints
+
priority formula
→ deterministic recommendation
→ LLM explains the recommendation
```

This distinction must be preserved throughout the implementation.

---

# 4. TECH STACK

Prefer:

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Flow
- Recharts
- Lucide icons
- Framer Motion sparingly

### Backend
- Node.js
- Express
- TypeScript
- Zod
- secure authentication
- REST APIs

### Database
- MongoDB / MongoDB Atlas

### AI
- Groq API
- configurable Llama-class model
- configurable embeddings
- MongoDB Atlas Vector Search if available

Use environment variables for all secrets.

Create `.env.example`.

If the environment already has a preferred stack, adapt without destroying the architecture.

---

# 5. FIRST DEVELOPMENT STEP

Before implementing features:

1. Inspect the existing repository.
2. Identify what already exists.
3. Preserve useful existing code.
4. Do not rewrite working modules unnecessarily.
5. Create a concise implementation plan.
6. Establish the data models and learning engine first.
7. Then build the API.
8. Then build the UI.
9. Then connect AI.
10. Then test the complete user journey.

Do not spend the majority of implementation time polishing the landing page before the recommendation engine works.

---

# 6. REQUIRED USER JOURNEY

A new user must be able to:

```text
Landing
 ↓
Sign up / Login
 ↓
Describe Goal
 ↓
Build Learner Profile
 ↓
Diagnostic Assessment
 ↓
Skill Analysis
 ↓
Personalized Roadmap
 ↓
Recommendation Trace
 ↓
Learning Resource
 ↓
Assessment / Project
 ↓
Mastery Update
 ↓
Path Recompilation
 ↓
Updated Roadmap
 ↓
Progress Dashboard
 ↓
AI Assistant
```

All of this must work using seeded demo data.

---

# 7. DATA MODEL

Implement strongly typed models.

## Learner

Fields:

- id
- name
- experienceLevel
- goals
- interests
- weeklyHours
- preferredLearningModes
- completedResources
- skillStates
- assessmentHistory
- projectHistory
- feedbackEvents
- createdAt
- updatedAt

## SkillState

Fields:

- skillId
- proficiency: 0–100
- confidence: 0–1
- evidence[]
- lastUpdated

## Skill

Fields:

- id
- name
- category
- description
- prerequisites[]
- relatedSkills[]
- roleImportance[]
- difficulty
- estimatedHours

## Resource

Fields:

- id
- title
- type
- skills[]
- prerequisites[]
- difficulty
- estimatedHours
- qualityScore
- description
- source
- url

Types:

```text
COURSE
PROJECT
ASSESSMENT
PRACTICE
READING
VIDEO
```

## LearningEvent

Types:

```text
DIAGNOSTIC_COMPLETED
ASSESSMENT_COMPLETED
PROJECT_COMPLETED
RESOURCE_COMPLETED
PRACTICE_COMPLETED
FEEDBACK_RECEIVED
SKILL_SELF_REPORTED
GOAL_CHANGED
TIME_CONSTRAINT_CHANGED
```

---

# 8. SEED DATA

Create a meaningful seed knowledge base.

At minimum include these roles:

- Data Scientist
- Machine Learning Engineer
- Full Stack Developer
- Data Analyst
- AI Engineer

Include enough skills and prerequisite relationships to create realistic paths.

For Data Scientist, include at least:

```text
Python
NumPy
Pandas
SQL
Statistics
Probability
Data Cleaning
EDA
Data Visualization
Feature Engineering
Machine Learning
Regression
Classification
Model Evaluation
Git
Deployment
ML Project
```

Create realistic prerequisite relationships.

Example:

```text
Python
 → NumPy
 → Pandas
 → Data Analysis
 → Feature Engineering
 → Machine Learning
 → Applied ML Project
```

Do not make the graph completely linear. Include branching and converging dependencies.

---

# 9. GOAL INTERPRETER

Create an endpoint and service that converts natural language into structured JSON.

Example input:

> I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning.

Expected structure:

```json
{
  "targetRole": "Data Scientist",
  "objective": "career_transition",
  "timeframeWeeks": 24,
  "weeklyHours": 8,
  "currentLevel": "beginner_intermediate",
  "learningPreference": ["project_based"],
  "constraints": []
}
```

Validate the LLM output with Zod.

If the LLM fails, fall back to structured onboarding fields.

---

# 10. LEARNER MODEL

Implement a learner skill state rather than simple profile tags.

For every skill store:

```text
proficiency
confidence
evidence
lastUpdated
```

Evidence types:

```text
SELF_REPORT
DIAGNOSTIC
ASSESSMENT
PROJECT
PRACTICE
COURSE_COMPLETION
RECENCY
```

Use stronger evidence to update confidence more strongly.

Never allow:

```text
"I know SQL"
```

to automatically become:

```text
SQL = 80
```

without evidence.

---

# 11. DIAGNOSTIC ENGINE

The diagnostic must be personalized.

Determine which target-role skills have:

- high gap
- high importance
- high uncertainty

Generate questions around those skills.

Do not use exactly the same quiz for every learner.

After each answer:

```text
answer
 ↓
map to skill
 ↓
evaluate correctness
 ↓
update evidence
 ↓
revise proficiency/confidence
```

Show the user how the diagnostic changed their estimated skill profile.

Example:

```text
Statistics
Before: 41%
After diagnostic: 63%

Confidence: HIGH
Evidence: Diagnostic + recent assessment
```

---

# 12. SKILL GAP ENGINE

Implement:

```text
gap = max(0, targetProficiency - currentProficiency)
```

Then calculate priority using:

```text
Priority Score =
    Gap
  × Role Importance
  × Skill Centrality
  × Unlock Value
  × Goal Relevance
  ÷ Learning Cost
```

Normalize values to 0–1.

Keep the implementation in a dedicated learning-engine module.

Do NOT use an LLM to calculate this.

Write unit tests for the formula.

---

# 13. UNLOCK VALUE

Implement a meaningful unlock-value calculation.

A skill's unlock value should reflect the amount/importance of downstream capability it enables.

For example:

```text
Statistics
  ↓
Model Evaluation
  ↓
Machine Learning
```

can have higher unlock value than an isolated low-dependency skill.

Document the calculation in code.

Make it deterministic.

---

# 14. SKILL CENTRALITY

Calculate centrality from the skill graph.

Possible implementation:

- normalized downstream dependency count
- weighted downstream importance

Keep the algorithm simple, explainable, and testable.

Do not introduce a complicated graph ML model just to sound sophisticated.

---

# 15. PATH OPTIMIZER

Implement a deterministic prerequisite-aware optimizer.

Inputs:

```text
skill gaps
target role
priority scores
skill DAG
weekly hours
learning preferences
```

Output:

```text
ordered milestones
```

Requirements:

- prerequisites first
- high-value skills prioritized
- respect weekly capacity
- permit safe parallel learning
- avoid unnecessary repetition
- insert assessments at logical points
- insert projects after prerequisite mastery

Use topological ordering plus priority-aware selection.

Document the algorithm.

---

# 16. ROADMAP

Generate a roadmap consisting of:

- skills
- resources
- projects
- assessments
- practice tasks
- milestones

Every recommendation must contain:

```text
priorityScore
reason
skillIds
prerequisiteIds
estimatedHours
unlocks
status
```

Do not display resources as an unexplained flat list.

---

# 17. RECOMMENDATION TRACE

This is a first-class feature.

For every important recommendation provide:

```text
Gap
Role Importance
Centrality
Unlock Value
Goal Relevance
Learning Cost
Priority
Prerequisite reasoning
```

Also provide:

```text
Why this?
Why now?
What does it unlock?
Why not another skill?
```

Example:

```text
WHY SQL NOW?

Gap                 0.48
Role Importance     0.91
Centrality          0.84
Unlock Value        0.88
Goal Relevance      0.95
Learning Cost       0.35

Priority Score      0.91

UNLOCKS
Data Analysis
Feature Engineering
ML Projects

WHY NOT DEEP LEARNING?
Statistics and Machine Learning fundamentals
are currently below the required mastery threshold.
```

This must use actual calculated values.

Do not fabricate scores in the UI.

---

# 18. INCREMENTAL RECOMPILATION

This is a signature feature.

When the learner produces new evidence:

```text
assessment completed
project completed
skill updated
feedback received
goal changed
weekly availability changed
```

determine affected skills and downstream dependencies.

Then:

```text
update learner state
 ↓
identify affected graph region
 ↓
recalculate scores
 ↓
rerun affected path optimization
 ↓
update roadmap
 ↓
create change summary
```

Show a visible recompilation state.

Example:

```text
PATH RECOMPILED

14 dependencies checked
3 skills recomputed
1 resource removed
2 milestones updated

Reason:
SQL mastery increased from 58% → 82%.
```

Do not merely fake this animation.

The numbers must come from actual affected-node calculations.

---

# 19. FEEDBACK

Allow natural-language feedback.

Example:

> I already know basic SQL. Give me something harder.

LLM converts it into a structured event.

Example:

```json
{
  "type": "LEARNER_FEEDBACK",
  "skill": "SQL",
  "intent": "increase_difficulty",
  "confidence": 0.88
}
```

The deterministic engine decides whether to:

- skip
- accelerate
- assess
- replace
- add challenge
- reduce repetition

The LLM must not directly decide the final ranking.

---

# 20. AI ASSISTANT

Build a context-aware assistant.

It should know:

- learner profile
- current skill state
- roadmap
- recommendation traces
- current milestone
- relevant resource information

It should answer questions like:

```text
Why am I learning SQL?
Why is Statistics before ML?
Can I skip this?
What should I do after this project?
Why did my roadmap change?
I only have 4 hours this week. What should I prioritize?
```

The assistant must retrieve actual Pathwise state before answering.

Never hallucinate completion status or recommendations.

---

# 21. RAG

Use RAG where useful for:

- skill explanations
- resource descriptions
- learning concepts
- assistant contextual answers

Index:

```text
skills
resources
role descriptions
learning guidance
```

Do not use RAG as a replacement for the deterministic recommendation engine.

---

# 22. UI/UX

The UI must look like a real startup/productivity product.

Design direction:

```text
Linear
+
GitHub
+
Notion
+
modern education product
```

Do not copy these products.

Avoid:

- generic AI landing page
- neon gradients
- giant glowing brain/robot
- excessive glassmorphism
- huge rounded cards everywhere
- stock illustrations
- repetitive gradient text
- 20 dashboard widgets
- unnecessary animations

Use:

- strong typography
- clean spacing
- restrained color
- subtle borders
- meaningful states
- graph visualization
- progressive disclosure
- keyboard-friendly interactions
- responsive layouts

The skill graph should become Pathwise's visual signature.

---

# 23. REQUIRED SCREENS

Implement:

### Landing
Explain the product in one clear sentence.

### Onboarding
Goal + experience + interests + time + preferences.

### Diagnostic
Personalized assessment.

### Dashboard
Next best action + roadmap progress + skill development + recent changes.

### Roadmap
Interactive prerequisite-aware graph.

### Skill Graph
Explore current vs target capability.

### Skill Detail
Show proficiency, evidence, prerequisites, unlocks.

### Recommendation Trace
Show why a recommendation exists.

### Practice
Targeted exercises.

### Projects
Project milestones.

### Progress
Mastery and readiness.

### Assistant
Context-aware AI assistant.

### Settings
Profile/preferences.

---

# 24. DASHBOARD PRIORITY

Do not build a dashboard where every metric has equal visual weight.

The most important thing should be:

```text
YOUR NEXT BEST ACTION
```

Example:

```text
Complete SQL Data Challenge

12 min
Difficulty: Medium

Unlocks:
Feature Engineering

Why now:
High role relevance + high downstream unlock value
```

Then show:

- current milestone
- skill progress
- roadmap
- recent changes
- career readiness

---

# 25. SIGNATURE INTERACTION

Implement this exact demo interaction:

1. Seed/open a Data Scientist learner.
2. Show their roadmap.
3. Open SQL recommendation.
4. Open Recommendation Trace.
5. Complete SQL assessment with a strong score.
6. Update SQL proficiency.
7. Trigger recompilation.
8. Show affected dependencies.
9. Show updated roadmap.
10. Ask the assistant:

> Why did my roadmap change?

The assistant should explain the actual event.

This is the central hackathon demo.

---

# 26. WHAT-IF SIMULATOR

Implement only after the core system works.

Support:

```text
What if I study 15 hours/week?
What if I target ML Engineer instead?
What if I skip this skill?
```

Do not mutate the real learner state.

Display:

```text
CURRENT PATH
24 weeks

SIMULATED PATH
18 weeks

CHANGES
3 milestones compressed
1 skill becomes parallel
```

---

# 27. FALLBACKS

The application must remain demoable when APIs fail.

### LLM unavailable
Use deterministic onboarding and template explanations.

### External resources unavailable
Use local seed catalog.

### Vector search unavailable
Use metadata/keyword search.

### Database error
Show clear recovery UI.

Never expose stack traces to users.

---

# 28. PERFORMANCE

- Cache stable skill graph data.
- Cache resource retrieval.
- Avoid unnecessary LLM calls.
- Use React Query for server state.
- Lazy-load graph-heavy pages.
- Debounce assistant requests.
- Use database indexes.
- Incrementally recompute affected skills.
- Keep API payloads small.
- Avoid expensive client-side graph calculations when the backend can handle them.

---

# 29. CODE QUALITY

Requirements:

- TypeScript strict mode where practical.
- No giant components.
- Separate domain logic from UI.
- Reusable components.
- Service layer for AI calls.
- Learning engine independent of Express.
- Zod validation.
- Central error handling.
- Consistent API responses.
- No secrets in source.
- No duplicated business logic.
- Meaningful comments only where necessary.

Do not over-engineer with microservices unless the repository already requires them.

A modular monolith is preferred for the hackathon.

---

# 30. TESTING

Write tests for at least:

### Learning engine
- gap calculation
- priority score
- unlock value
- centrality
- prerequisite ordering
- path generation

### Adaptive engine
- skill update
- affected-node detection
- recompilation
- roadmap changes

### API
- goal interpretation validation
- path compilation
- progress event
- feedback event

### UI
At minimum test the critical happy path.

---

# 31. SECURITY

Implement:

- password hashing
- authentication
- authorization
- input validation
- rate limiting for AI endpoints
- environment variables
- API key protection
- sanitized user content

Never place Groq or database credentials in frontend code.

---

# 32. BUILD PRIORITY

If time becomes limited, follow this exact priority:

## P0 — MUST WORK

1. Authentication
2. Goal onboarding
3. Learner model
4. Skill graph
5. Diagnostic
6. Gap engine
7. Priority scoring
8. Path optimizer
9. Roadmap
10. Recommendation Trace
11. Progress event
12. Incremental recompilation
13. Dashboard

## P1 — SHOULD WORK

14. AI assistant
15. Feedback interpreter
16. Projects
17. Practice
18. RAG

## P2 — STRETCH

19. What-if simulator
20. External resource discovery
21. Job-market signals

Never sacrifice P0 for P2.

---

# 33. DEMO DATA

Create a polished seeded learner:

```text
Name:
Alex

Goal:
Become a Data Scientist in 6 months

Current:
Python — 72
Excel — 78
SQL — 52
Statistics — 41
Machine Learning — 21

Weekly availability:
8 hours

Preference:
Project-based

Target:
Data Scientist
```

After diagnostic:

```text
Statistics:
41 → 63

SQL:
52 → 68
```

After completing SQL assessment:

```text
SQL:
68 → 84
```

The roadmap should actually change based on these values.

Do not hard-code a fake "before/after" screen.

---

# 34. LANDING PAGE COPY

Use concise product messaging.

Primary:

> **Build the right learning path for the person you are becoming.**

Supporting:

> Pathwise maps your goal, skills, evidence and constraints into a personalized learning path — then adapts it as you learn.

CTA:

> Build My Path

Avoid excessive marketing copy.

---

# 35. BRAND

Product name:

# Pathwise

Tagline:

> **Your skills. Your goal. Your path.**

Use Pathwise consistently throughout the application.

Do not use "SkillCompiler" as the public product name.

Use the compiler/recompilation concept internally and in the hackathon explanation.

---

# 36. JUDGE-READY EXPLANATION

The application should make it easy to demonstrate:

### Problem Understanding
"We don't recommend based only on topic similarity. We model the learner's current capability, target capability, constraints and evidence."

### AI/ML
"The LLM understands language and feedback. The recommendation engine computes the actual learning decision using a skill graph and auditable priority model."

### Innovation
"Our key innovation is learning value: we prioritize the skill that unlocks the most useful downstream capability, not merely the skill with the largest gap."

### Adaptivity
"When new evidence arrives, Pathwise incrementally recompiles the affected portion of the roadmap."

### Explainability
"Every recommendation has a trace showing why it was prioritized and why alternatives were deferred."

---

# 37. ABSOLUTE ANTI-PATTERNS

Do not:

- invent ML training datasets
- claim an untrained classifier is production ML
- use synthetic labels to make a model look impressive
- hide recommendation logic inside prompts
- generate fake metrics
- fake recompilation
- fake progress
- fabricate external course data
- expose API keys
- create meaningless AI features solely for judging
- overuse animations
- produce a generic ChatGPT clone
- make the landing page more polished than the actual product
- sacrifice functionality for visual effects

---

# 38. FINAL ACCEPTANCE TEST

Before declaring the application complete, run this exact scenario:

```text
Create learner
→ enter natural-language goal
→ interpret goal
→ create learner profile
→ run diagnostic
→ update skill evidence
→ calculate skill gaps
→ calculate priority scores
→ generate prerequisite-aware roadmap
→ inspect Recommendation Trace
→ complete an assessment
→ update mastery
→ identify affected dependencies
→ recompile roadmap
→ show what changed
→ ask AI assistant why
→ verify explanation matches actual event
```

If any step is fake, disconnected, hard-coded, or dependent on manually editing database records, fix it.

The final application should be demonstrable from a clean browser session.

---

# 39. FINAL DELIVERABLE

Deliver:

1. Fully working frontend.
2. Fully working backend.
3. Database schema/models.
4. Seed data.
5. Learning engine.
6. AI integration.
7. RAG integration where applicable.
8. Authentication.
9. Diagnostic system.
10. Recommendation engine.
11. Roadmap.
12. Recommendation Trace.
13. Adaptive recompilation.
14. Dashboard.
15. AI assistant.
16. Tests.
17. `.env.example`.
18. README with setup instructions.
19. Architecture documentation.
20. Demo credentials/data if required.

Before finishing, run the application, test the complete golden demo flow, fix errors, and verify that the UI is responsive and coherent.

**Do not stop at scaffolding. Build the actual product.**

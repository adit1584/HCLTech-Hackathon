# PATHWISE — FINAL SYSTEM ARCHITECTURE

**Product:** Pathwise — Personalized Learning Intelligence  
**Hackathon:** HCLTech AI Challenge  
**Core proposition:** Pathwise does not merely recommend courses. It understands a learner's goal, measures the learner's current capability, identifies the highest-value skill gaps, constructs a prerequisite-aware learning path, and continuously recompiles that path as new evidence arrives.

---

## 1. Product Vision

### The problem

Most learning platforms answer:

> "What resources are related to this topic?"

Pathwise answers:

> "Given this learner, this goal, this deadline, and the evidence we have about their skills, what should they learn next, why, and what changes if they improve?"

The product therefore optimizes a **learning journey**, not a course list.

### Core loop

```text
Natural-language Goal
        ↓
Goal Understanding
        ↓
Learner Model
        ↓
Diagnostic Evidence
        ↓
Skill Graph + Gap Analysis
        ↓
Priority / Learning-Value Scoring
        ↓
Prerequisite-Aware Path Optimization
        ↓
Roadmap + Resources + Projects + Assessments
        ↓
Learner Progress / Feedback / New Evidence
        ↓
Incremental Recompilation
        ↺
```

---

# 2. Signature Concept: The Learning Compiler

Use the compiler metaphor internally and selectively in the UI/pitch.

| Compiler concept | Pathwise component | Purpose |
|---|---|---|
| Lexer | Goal Interpreter | Converts natural language into structured intent |
| Symbol Table | Learner Model | Stores skills, proficiency, evidence and goals |
| Semantic Diff | Skill Gap Engine | Compares current capability with target capability |
| Optimizer | Path Engine | Finds a high-value prerequisite-aware sequence |
| Code Generator | Roadmap Generator | Converts the optimized graph into an actionable plan |
| Debugger | Recommendation Trace | Explains why a recommendation exists |
| Recompiler | Adaptive Engine | Updates only affected parts after new evidence |

The metaphor is not the product's only feature. The underlying system must actually implement these separations.

---

# 3. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         PATHWISE UI                          │
│ React + TypeScript + Tailwind + graph visualization         │
│                                                              │
│ Onboarding │ Dashboard │ Skill Graph │ Roadmap │ Practice   │
│ Projects   │ Assistant │ Progress   │ Recommendation Trace  │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST / JSON
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       API / ORCHESTRATOR                     │
│ Node.js + Express                                            │
│ Authentication │ validation │ sessions │ orchestration      │
└──────────────┬────────────────┬────────────────┬──────────────┘
               │                │                │
               ▼                ▼                ▼
┌────────────────────┐ ┌────────────────────┐ ┌─────────────────┐
│ AI / LANGUAGE      │ │ LEARNING ENGINE    │ │ DATA LAYER      │
│                    │ │                    │ │                 │
│ Goal extraction    │ │ Skill gap engine   │ │ MongoDB         │
│ Feedback parsing   │ │ Priority scoring   │ │ Vector store    │
│ Explanations       │ │ Prerequisite DAG   │ │ Resource catalog│
│ Learner Q&A        │ │ Path optimizer     │ │ Learner state   │
│ Quiz generation    │ │ Mastery updates    │ │ Events/history  │
└─────────┬──────────┘ │ Recompiler         │ └─────────────────┘
          │            └─────────┬──────────┘
          │                      │
          ▼                      ▼
     Groq LLM API          Deterministic engine
     (LLM only)            (ranking/decision logic)
```

---

# 4. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Recharts
- React Flow or equivalent graph library
- Lucide icons
- Framer Motion only where useful

## Backend

- Node.js
- Express
- TypeScript
- Zod for request/response validation
- JWT or secure session authentication
- REST API

## AI Layer

- Groq API
- Llama-class instruction model available through the configured Groq API
- Embeddings through a configurable embedding provider
- RAG for resource/skill knowledge retrieval

## Data

- MongoDB / MongoDB Atlas
- Vector search using MongoDB Atlas Vector Search where available
- Local JSON seed catalog for guaranteed offline/demo resources

## Engineering

- ESLint
- Prettier
- environment-based configuration
- Docker-ready
- structured logging
- centralized error handling

---

# 5. Core Data Model

## Learner

```ts
Learner {
  id
  name
  experienceLevel
  goals[]
  interests[]
  weeklyHours
  preferredLearningModes[]
  completedResources[]
  skillStates[]
  assessmentHistory[]
  projectHistory[]
  feedbackEvents[]
  createdAt
  updatedAt
}
```

## SkillState

```ts
SkillState {
  skillId
  proficiency: 0..100
  confidence: 0..1
  evidence[]
  lastUpdated
}
```

Evidence types:

```text
SELF_REPORT
DIAGNOSTIC
COURSE_COMPLETION
ASSESSMENT
PROJECT
PRACTICE
RECENCY
```

Never treat a self-report and a project score as equally strong evidence.

---

# 6. Skill Knowledge Graph

Each skill is represented as a node.

```ts
Skill {
  id
  name
  category
  description
  prerequisites[]
  relatedSkills[]
  roleImportance[]
  difficulty
  estimatedHours
}
```

Edges represent relationships such as:

```text
PREREQUISITE
ENABLES
RELATED_TO
SPECIALIZES
```

Example:

```text
Python
  ↓
NumPy / Pandas
  ↓
Data Analysis
  ↓
Feature Engineering
  ↓
Machine Learning
  ↓
Applied ML Project
```

The graph must be stored as data, not hard-coded into React components.

---

# 7. Goal Interpreter

Input:

> "I know basic Python and Excel. I want to become a data scientist in six months. I can study 8 hours a week and prefer project-based learning."

Output:

```json
{
  "targetRole": "Data Scientist",
  "objective": "career_transition",
  "timeframeWeeks": 24,
  "weeklyHours": 8,
  "currentLevel": "beginner_intermediate",
  "learningPreference": ["project_based"],
  "constraints": [],
  "targetSkills": []
}
```

The LLM performs semantic extraction.

The backend validates the resulting JSON with Zod.

The LLM must never directly mutate the learner database.

---

# 8. Learner Profiling

Build the learner profile from multiple evidence sources.

### Evidence hierarchy

Recommended confidence ordering:

```text
Project evidence
    ↓
Assessment evidence
    ↓
Diagnostic evidence
    ↓
Practice evidence
    ↓
Completed-resource evidence
    ↓
Self-report
```

Recency should decay confidence over time where appropriate.

A learner saying:

> "I know SQL"

must not automatically produce:

`SQL = 80`.

Instead:

```text
SQL
Proficiency: 58
Confidence: 0.46
Evidence:
- Self report
- No recent assessment
```

After a diagnostic:

```text
SQL
Proficiency: 71
Confidence: 0.82
Evidence:
- Self report
- Diagnostic: 86%
- Recent practice
```

---

# 9. Diagnostic Placement Engine

Do not use a generic fixed quiz for everyone.

The diagnostic should sample questions based on the learner's target role and uncertain skills.

Example:

```text
Target: Data Scientist

High uncertainty:
Statistics
SQL
Feature Engineering

Generate:
2 Statistics questions
2 SQL questions
1 Feature Engineering question
```

After each response:

```text
Answer
 ↓
Skill mapping
 ↓
Difficulty-aware update
 ↓
Proficiency revision
```

The diagnostic is therefore an **evidence generator**, not just a quiz.

---

# 10. Semantic Skill Diff

Compute:

```text
Target Capability
        -
Current Capability
        =
Skill Gap
```

For each skill:

```text
gap = max(0, targetProficiency - currentProficiency)
```

But ranking must consider more than gap size.

---

# 11. Priority Score

Use this auditable formula:

```text
Priority Score =
    Gap
  × Role Importance
  × Skill Centrality
  × Unlock Value
  × Goal Relevance
  ÷ Learning Cost
```

Normalize each factor to `[0,1]`.

### Meaning

**Gap**
How far the learner is from the required proficiency.

**Role Importance**
How important the skill is for the selected target role.

**Skill Centrality**
How many downstream capabilities depend on it.

**Unlock Value**
How much learning this skill unlocks.

**Goal Relevance**
How directly it contributes to the user's stated objective.

**Learning Cost**
Estimated effort/time.

This formula must be visible in the Recommendation Trace.

Do not hide ranking behind an unexplained LLM response.

---

# 12. Learning Value / Unlock Value

This is a core differentiator.

Instead of asking:

> "Which skill is missing?"

Pathwise asks:

> "Which skill creates the most downstream learning value if learned now?"

Example:

```text
Deep Learning
Gap: HIGH
Role relevance: HIGH
Unlock value: LOW right now
Prerequisites unresolved: Statistics, ML fundamentals

SQL
Gap: MEDIUM
Role relevance: HIGH
Unlock value: HIGH
Cost: LOW

→ SQL gets higher priority.
```

This produces a more rational learning sequence.

---

# 13. Path Optimizer

Input:

```text
Skill Gap Set
+
Prerequisite DAG
+
Priority Scores
+
Learner constraints
```

Output:

```text
Ordered learning path
```

Constraints:

- prerequisites before dependents
- respect weekly study capacity
- avoid unnecessary duplication
- allow parallel learning where safe
- prioritize high-unlock-value skills
- insert assessment after meaningful milestones
- insert projects after sufficient prerequisite mastery

The optimizer must be deterministic and testable.

---

# 14. Roadmap Structure

Every roadmap item should contain:

```ts
RoadmapItem {
  id
  type: "SKILL" | "COURSE" | "PROJECT" | "ASSESSMENT" | "PRACTICE"
  title
  skillIds[]
  prerequisiteIds[]
  estimatedHours
  priorityScore
  status
  reason
  unlocks[]
}
```

Example:

```text
MILESTONE 1
Python for Data Analysis

Skills:
- NumPy
- Pandas
- Data Cleaning

Unlocks:
- Exploratory Data Analysis
- Feature Engineering

Assessment:
Data manipulation challenge

Project:
Exploratory analysis of a real dataset
```

---

# 15. Recommendation Trace

Every recommendation must have an explanation object.

```ts
RecommendationTrace {
  recommendationId
  triggeredBySkills[]
  gapContribution
  roleImportance
  centrality
  unlockValue
  goalRelevance
  estimatedCost
  prerequisiteReason[]
  excludedAlternatives[]
}
```

UI:

```text
WHY THIS?

SQL Fundamentals

Gap                 0.48
Role Importance     0.91
Centrality          0.84
Unlock Value        0.88
Goal Relevance      0.95
Learning Cost       0.35

Priority             0.91

UNLOCKS
→ Data Analysis
→ Feature Engineering
→ ML Projects

WHY NOT DEEP LEARNING?
Two prerequisite skills remain below
the required mastery threshold.
```

This is one of the most important screens in the product.

---

# 16. Adaptive Recompilation

When new evidence arrives:

```text
EVENT
 ↓
Update learner skill state
 ↓
Identify affected skill nodes
 ↓
Recalculate dependent priorities
 ↓
Re-run affected part of optimizer
 ↓
Update roadmap
 ↓
Explain what changed
```

Do not regenerate the entire system blindly after every event.

Track affected nodes.

Demo UI:

```text
PATH RECOMPILED

14 dependencies checked
3 skills recomputed
1 resource removed
2 milestones updated

Reason:
SQL mastery increased from 58 → 82.
```

---

# 17. Feedback Interpreter

Learners can say:

> "I already know basic SQL and don't want another beginner course."

The LLM converts this to a structured event:

```json
{
  "type": "LEARNER_FEEDBACK",
  "skill": "SQL",
  "intent": "increase_prior_knowledge",
  "confidence": 0.88
}
```

The deterministic engine decides what to do.

Possible outcomes:

```text
Skip
Accelerate
Assess
Replace resource
Lower repetition
Add challenge
```

The LLM does not directly alter ranking.

---

# 18. AI Assistant

The assistant should be context-aware.

It can answer:

> Why am I learning SQL?

> What should I do after this project?

> Can I skip this topic?

> Explain this skill.

> I only have 4 hours this week. What changes?

The assistant should retrieve:

- learner state
- current roadmap
- skill graph
- recommendation traces
- relevant resources

Then generate the answer.

Never let it invent roadmap state.

---

# 19. What-If Simulator

Stretch feature.

Examples:

> What if I can study 15 hours/week?

> What if I target ML Engineer instead?

> What if I skip Statistics?

The engine calculates a hypothetical path without mutating the real learner profile.

UI:

```text
CURRENT PATH
24 weeks

WHAT IF
15 hrs/week

NEW PATH
18 weeks

3 milestones compressed
1 prerequisite becomes parallel
```

---

# 20. Resource Catalog

Resources should be explicitly labeled:

```text
COURSE
PROJECT
ASSESSMENT
PRACTICE
READING
VIDEO
```

For hackathon reliability, ship a curated internal catalog.

Each resource contains:

```ts
Resource {
  id
  title
  type
  skills[]
  prerequisites[]
  difficulty
  estimatedHours
  qualityScore
  description
  source
  url
}
```

Do not pretend internally authored demo resources are external courses.

External resource search can be a stretch feature.

---

# 21. Dashboard

The dashboard should prioritize action over decorative analytics.

### Top section

```text
GOOD AFTERNOON

Your next best action

→ Complete SQL Data Challenge

12 min estimated
Unlocks: Feature Engineering
```

### Skill progress

Show:

```text
Current capability
Target capability
Confidence
Trend
```

### Roadmap

Interactive skill/resource graph.

### Recent changes

```text
PATH UPDATED
Statistics mastery ↑ 14%

RESOURCE SKIPPED
SQL Basics

NEW MILESTONE
Feature Engineering
```

### Readiness

```text
Career Readiness
68%

Target: Data Scientist
```

---

# 22. UI Design System

The interface must look like a serious product, not an AI template.

### Visual principles

- clean light/dark capable interface
- strong typography hierarchy
- restrained use of gradients
- no excessive glassmorphism
- no giant robot/AI illustrations
- no generic chatbot landing page
- minimal cards
- purposeful whitespace
- subtle motion
- graph-based visual identity
- clear information density

Reference quality level:

```text
Linear
GitHub
Notion
Stripe
Vercel
```

Do not clone their designs.

Create Pathwise's own visual language.

---

# 23. Main Screens

```text
/
├── Landing
├── Onboarding
│   ├── Goal
│   ├── Experience
│   ├── Interests
│   └── Constraints
│
├── Diagnostic
│
├── Dashboard
│
├── Roadmap
│
├── Skill Graph
│
├── Skill Detail
│
├── Recommendation Trace
│
├── Practice
│
├── Projects
│
├── Progress
│
├── Assistant
│
└── Settings
```

---

# 24. API Design

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

POST   /api/goals/interpret
GET    /api/learner/profile
PATCH  /api/learner/profile

POST   /api/diagnostic/start
POST   /api/diagnostic/answer
GET    /api/diagnostic/result

GET    /api/skills
GET    /api/skills/:id
GET    /api/skills/graph

POST   /api/path/compile
GET    /api/path/current
POST   /api/path/recompile

GET    /api/recommendations
GET    /api/recommendations/:id/trace

POST   /api/progress/event
POST   /api/feedback

POST   /api/assistant/chat

GET    /api/projects
GET    /api/resources

POST   /api/simulator/what-if
```

---

# 25. Event Architecture

Represent important learner actions as events.

```ts
LearningEvent {
  id
  learnerId
  type
  skillIds[]
  resourceId?
  score?
  metadata
  timestamp
}
```

Examples:

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

This makes adaptation explainable and testable.

---

# 26. Security

- password hashing
- secure authentication
- authorization checks
- input validation
- rate limiting on AI endpoints
- environment variables for API keys
- never expose provider keys in frontend
- sanitize user-generated content
- structured API errors

---

# 27. Performance

Critical rules:

- cache skill graph
- cache resource embeddings
- cache stable LLM extraction where safe
- do not call LLM for deterministic ranking
- debounce assistant requests
- lazy-load graph-heavy screens
- paginate resource lists
- incremental recompilation
- avoid unnecessary global state
- use indexes for learner/resource/skill queries

---

# 28. AI Cost Control

Use LLM only where semantic reasoning is required.

### LLM calls

```text
Goal interpretation
Feedback interpretation
Quiz generation
Explanation
Assistant response
```

### No LLM call

```text
Gap calculation
Priority score
Prerequisite ordering
Mastery update
Roadmap status
Dependency traversal
Recompilation
```

This improves both performance and credibility.

---

# 29. Failure Handling

The application must still work if the LLM fails.

Fallbacks:

```text
LLM goal extraction fails
→ structured onboarding form

LLM explanation fails
→ deterministic recommendation trace

External resource API fails
→ curated local catalog

Vector search unavailable
→ metadata/keyword search

Database temporarily unavailable
→ meaningful error state
```

The demo must never depend on a single external API call succeeding.

---

# 30. Judging-Criteria Mapping

## Problem Understanding — 20%

Demonstrates:

- learner-specific profiling
- goals
- current capability
- skill gaps
- constraints
- prerequisites
- adaptive paths

## Functionality — 25%

Demonstrates:

- onboarding
- diagnostic
- recommendations
- roadmap
- projects
- assessments
- progress
- assistant
- feedback
- recompilation

## AI/ML — 20%

Demonstrates:

- LLM semantic extraction
- RAG
- evidence-based learner modeling
- skill-gap computation
- priority scoring
- adaptive inference
- prerequisite optimization

## Innovation — 15%

Signature features:

- learning-value / unlock-value scoring
- recommendation trace
- mastery confidence
- incremental recompilation
- "Why not?" explanations
- what-if simulator

## UX — 10%

- graph-first roadmap
- action-oriented dashboard
- minimal interface
- explainable recommendations
- visible system state

## Performance / Code Quality — 10%

- typed APIs
- deterministic engine
- modular services
- caching
- validation
- error handling
- tests
- incremental updates

---

# 31. Recommended Repository Structure

```text
pathwise/
├── apps/
│   ├── web/
│   └── api/
│
├── packages/
│   ├── learning-engine/
│   ├── skill-graph/
│   ├── ai/
│   ├── shared/
│   └── ui/
│
├── data/
│   ├── skills/
│   ├── resources/
│   ├── roles/
│   └── seed/
│
├── docs/
│
├── tests/
│
├── .env.example
├── docker-compose.yml
├── README.md
└── package.json
```

If the agent's environment makes a monorepo unnecessarily heavy, a clean `/client` + `/server` structure is acceptable. Do not introduce infrastructure solely for architectural theater.

---

# 32. Definition of Done

The application is not considered complete until a fresh user can:

1. Create an account.
2. Describe a career/learning goal.
3. Receive a structured learner profile.
4. Complete a personalized diagnostic.
5. See revised skill proficiency.
6. See skill gaps.
7. Receive an ordered learning path.
8. Inspect why each major recommendation exists.
9. Start a resource.
10. Complete an assessment/project.
11. See mastery update.
12. Trigger path recompilation.
13. See the roadmap change.
14. Ask the assistant why something changed.
15. View overall progress and readiness.

The complete flow must work with seeded demo data even if external resource APIs are unavailable.

---

# 33. Golden Demo Scenario

Seed a compelling demo learner:

```text
Goal:
Become a Data Scientist in 6 months.

Current:
Basic Python
Basic Excel
Limited SQL
No formal ML experience

Constraint:
8 hours/week

Preference:
Project-based learning
```

Expected journey:

```text
Goal
 ↓
Diagnostic
 ↓
Statistics revised
 ↓
SQL prioritized
 ↓
Data Analysis
 ↓
Machine Learning
 ↓
Applied ML Project
 ↓
Assessment
 ↓
Career Readiness
```

Then deliberately complete SQL with a strong score.

The system should visibly recompile the path.

This should be the centerpiece of the hackathon demonstration.

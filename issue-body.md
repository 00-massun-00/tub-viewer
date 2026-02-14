### Track

🎨 Creative Apps - GitHub Copilot

### Project Name

TUB Viewer — Technology Update Briefing

### Microsoft Alias

takuyamasuda

### GitHub Username

@00-massun-00

### Repository URL

https://github.com/00-massun-00/tub-viewer

### Project Description

TUB Viewer is a multilingual web app for tracking Microsoft technology updates across Azure, Dynamics 365, Microsoft 365, Power Platform, and Security products.

**Multi-Agent Architecture (Orchestrator-Workers Pattern)**:
The app employs a 4-agent pipeline — QueryAgent → SearchAgent → RankingAgent → EvaluatorAgent — coordinated by a central Orchestrator. Each agent has a single responsibility and communicates via typed interfaces.

**Chain-of-Thought Reasoning**:
Natural language queries are analyzed through a 5-step CoT pipeline (Intent Classification → Entity Extraction → Query Expansion → Confidence Scoring → Reasoning Summary) powered by GPT-4o, with graceful fallback to rule-based parsing when LLM is unavailable.

**Self-Reflection & Evaluator-Optimizer Loop**:
After search results are ranked, an Evaluator agent performs quality assessment. If results fall below the confidence threshold, it automatically rewrites the query and re-executes the pipeline (max 1 retry), implementing the evaluator-optimizer workflow pattern.

**Key Features**:

- Microsoft Learn MCP integration for real-time documentation updates with retry & exponential backoff
- Zod input validation on all API routes with structured error responses
- Structured JSON logging with request ID tracing for full observability
- Security headers (X-Content-Type-Options, X-Frame-Options, CSP-related, Permissions-Policy)
- Export to Excel (3-sheet workbook) and PowerPoint (16:9 presentation)
- 8-language support (Japanese, English, Spanish, French, German, Chinese, Korean, Portuguese)
- 54 unit tests (Vitest) covering all core modules
- Built entirely with GitHub Copilot Agent Mode in VS Code

### Demo Video or Screenshots

#### Demo Animation (GIF)

![TUB Viewer Demo](https://raw.githubusercontent.com/00-massun-00/tub-viewer/master/screenshots/demo.gif)

#### Screenshots (English UI)

**1. Home Page — Product Selection (English)**
Users select from 21 products across 6 families (Azure, Dynamics 365, Microsoft 365, Power Platform, Security). Supports 8 languages.

![Home Page](https://raw.githubusercontent.com/00-massun-00/tub-viewer/master/screenshots/01_home_en.png)

**2. Azure (General) — Update List (English)**
Updates from Message Center + Microsoft Learn with severity stats (Total, Breaking, New, Info). All card content (titles, summaries, impact, actions) fully localized.

![Azure Browse Updates](https://raw.githubusercontent.com/00-massun-00/tub-viewer/master/screenshots/02_browse_en.png)

**3. Search Suggestions (English)**
Localized search suggestions dropdown with 8 example queries.

![Search Dropdown](https://raw.githubusercontent.com/00-massun-00/tub-viewer/master/screenshots/03_search_dropdown_en.png)

**4. Search Results — "Azure Breaking Changes" (English)**
Natural language query parsed into product + severity filters. Results show AKS Kubernetes 1.28 retirement with English card content.

![Search Results](https://raw.githubusercontent.com/00-massun-00/tub-viewer/master/screenshots/04_search_results_en.png)

**5. Export Menu — Excel & PowerPoint (English)**
One-click export to Excel (3-sheet workbook) or PowerPoint (16:9 presentation).

![Export Menu](https://raw.githubusercontent.com/00-massun-00/tub-viewer/master/screenshots/05_export_en.png)

Repository: https://github.com/00-massun-00/tub-viewer

### Primary Programming Language

TypeScript/JavaScript

### Key Technologies Used

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Multi-Agent Orchestrator-Workers Architecture (4 specialized agents)
- OpenAI GPT-4o (Chain-of-Thought reasoning with 5-step analysis pipeline)
- @modelcontextprotocol/sdk (MCP SDK for Microsoft Learn integration)
- Microsoft Learn Search API (real-time documentation updates)
- Zod (input validation on all API routes)
- Vitest (54 unit tests with coverage)
- Structured JSON logging with request ID tracing
- ExcelJS (Excel export with filters and color-coding)
- PptxGenJS (PowerPoint presentation generation)
- Self-Reflection Evaluator-Optimizer loop (automatic query rewrite)

### Submission Requirements

- [x] My project meets the track-specific challenge requirements
- [x] My repository includes a README.md with setup instructions
- [x] My code does not contain hardcoded API keys or secrets
- [x] I have included demo materials (video or screenshots)
- [x] My project is my own work created during this hackathon

### Technical Highlights

**Multi-Agent Orchestrator Pipeline**: The search system uses an Orchestrator-Workers pattern with 4 specialized agents (QueryAgent, SearchAgent, RankingAgent, EvaluatorAgent). The Orchestrator coordinates the pipeline: query analysis → parallel multi-source search → relevance-based ranking → quality evaluation with self-reflection retry.

**Chain-of-Thought Reasoning**: Natural language queries pass through a 5-step CoT pipeline powered by GPT-4o: Intent Classification → Entity Extraction → Query Expansion → Confidence Scoring → Reasoning Summary. Each step produces a typed `ReasoningStep` with explicit rationale, creating a full reasoning trace. Falls back gracefully to rule-based parsing when LLM is unavailable.

**Self-Reflection Evaluator-Optimizer Loop**: After ranking, the EvaluatorAgent assesses result quality (count ≥ 3, average relevance ≥ 0.5). If quality is insufficient, it rewrites the query using LLM and re-executes the entire pipeline (max 1 retry), implementing the evaluator-optimizer workflow pattern.

**Reliability & Safety**: All API routes use Zod schema validation with structured error responses. External API calls use retry with exponential backoff (max 2 retries). Security headers applied globally. Structured JSON logging with request ID tracing enables full observability. 54 unit tests (Vitest) cover core modules.

**MCP Integration**: Microsoft Learn Search API integrated via @modelcontextprotocol/sdk with retry mechanism, fetching real documentation updates and merging with Message Center data. The SearchAgent performs parallel queries across multiple data sources.

### Quick Setup Summary

1. Clone the repo: `git clone https://github.com/00-massun-00/tub-viewer.git`
2. Install dependencies: `cd tub-viewer && npm install`
3. Start dev server: `npm run dev`
4. Open http://localhost:3000 in your browser

### Team Members (if any)

_No response_

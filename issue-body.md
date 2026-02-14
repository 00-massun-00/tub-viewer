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

TUB Viewer is a multilingual web app for tracking Microsoft technology updates across Azure, Dynamics 365, Microsoft 365, Power Platform, and Security products. It features NLP-powered natural language search (supporting Japanese and English queries), Microsoft Learn MCP integration for real-time documentation updates, and export capabilities to both Excel and PowerPoint. The app categorizes updates into 3 severity levels (Breaking Changes, New Features, Improvements) with color-coded cards, and supports 8 languages. Built entirely with GitHub Copilot Agent Mode in VS Code.

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
- @modelcontextprotocol/sdk (MCP SDK for Microsoft Learn integration)
- Microsoft Learn Search API (real-time documentation updates)
- ExcelJS (Excel export with filters and color-coding)
- PptxGenJS (PowerPoint presentation generation)
- Lucide React (icons)
- Rule-based NLP query parser (Japanese + English)

### Submission Requirements

- [x] My project meets the track-specific challenge requirements
- [x] My repository includes a README.md with setup instructions
- [x] My code does not contain hardcoded API keys or secrets
- [x] I have included demo materials (video or screenshots)
- [x] My project is my own work created during this hackathon

### Technical Highlights

The app integrates Microsoft Learn search API via @modelcontextprotocol/sdk to fetch real documentation updates and merge them with Message Center-style mock data, demonstrating practical MCP integration. The NLP query parser handles Japanese morphological patterns (stop word removal for particles and compound words) to enable natural language search without requiring an LLM. The dual-format export system generates professional Excel workbooks with auto-filters and severity-based color coding, alongside 16:9 PowerPoint presentations with stat cards and detail slides, all server-side rendered via Next.js API routes.

### Quick Setup Summary

1. Clone the repo: `git clone https://github.com/00-massun-00/tub-viewer.git`
2. Install dependencies: `cd tub-viewer && npm install`
3. Start dev server: `npm run dev`
4. Open http://localhost:3000 in your browser

### Team Members (if any)

_No response_

# TUB Viewer — Technology Update Briefing

> **A multilingual, MCP-integrated web app for tracking Microsoft technology updates across Azure, Dynamics 365, Microsoft 365, Power Platform, and Security.**

Built with **GitHub Copilot** at [Agents League @ TechConnect](https://github.com/microsoft/agentsleague-techconnect) hackathon.

---

## ✨ Features

### 🔍 Dual-Mode Navigation

- **Browse Mode** — Select a product from the sidebar to view categorized updates
- **Search Mode** — Natural language queries like "今月のアップデート情報教えて" or "Azure breaking changes"

### 🌐 8-Language Support

Japanese, English, Korean, Chinese, Spanish, French, German, Portuguese — all UI text dynamically switches.

### 📊 Smart Categorization

Updates are auto-classified into 3 severity levels:

- 🔴 **Breaking Changes / Retirements** — Immediate action required
- 🟡 **New Features / Changes** — Review recommended
- 🟢 **Improvements / Enhancements** — Informational

### 📤 Export to Excel & PowerPoint

- **Excel (.xlsx)** — 3-sheet workbook with summary, full update list (with filters & color-coding), and a dedicated Breaking Changes sheet
- **PowerPoint (.pptx)** — 16:9 presentation with title slide (stat cards), severity sections, and per-update detail cards

### 🔗 MCP Integration (Model Context Protocol)

- **Microsoft Learn API** — Fetches real documentation updates from learn.microsoft.com
- Mock data from **Message Center** patterns (ready for WorkIQ MCP integration)
- Uses `@modelcontextprotocol/sdk` for MCP client connectivity

### 🤖 NLP Query Parser

Rule-based natural language understanding for queries in Japanese and English:

- Product detection: "Azure", "D365", "Power Platform", etc.
- Period detection: "今月", "last week", "3ヶ月"
- Severity detection: "breaking", "新機能"
- Source detection: "Message Center", "Learn"

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                   Next.js App                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Product     │  │ Search     │  │ Export     │ │
│  │ Selector    │  │ Bar (NLP)  │  │ Button     │ │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘ │
│        │               │               │         │
│  ┌─────▼───────────────▼───────────────▼──────┐  │
│  │              API Routes                     │  │
│  │  /api/updates  /api/search  /api/learn     │  │
│  │  /api/export/excel  /api/export/pptx       │  │
│  └──────┬──────────────┬──────────────────────┘  │
│         │              │                          │
│  ┌──────▼──────┐ ┌─────▼─────────┐               │
│  │ Mock Data   │ │ MCP Client    │               │
│  │ (MC equiv)  │ │ (Learn API)   │               │
│  └─────────────┘ └───────────────┘               │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/<your-username>/tub-viewer.git
cd tub-viewer

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Prerequisites

- Node.js 18+
- npm 9+

---

## 🛠️ Tech Stack

| Layer             | Technology                |
| ----------------- | ------------------------- |
| Framework         | Next.js 16 (App Router)   |
| Language          | TypeScript                |
| Styling           | Tailwind CSS 4            |
| MCP SDK           | @modelcontextprotocol/sdk |
| Excel Export      | ExcelJS                   |
| PowerPoint Export | PptxGenJS                 |
| Icons             | Lucide React              |

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── products/route.ts     # Product master data
│   │   ├── updates/route.ts      # Updates (mock + Learn MCP)
│   │   ├── search/route.ts       # NLP search
│   │   ├── learn/route.ts        # Microsoft Learn MCP
│   │   └── export/
│   │       ├── excel/route.ts    # Excel export
│   │       └── pptx/route.ts     # PowerPoint export
│   ├── layout.tsx
│   └── page.tsx                  # Main page (browse/search modes)
├── components/
│   ├── ProductSelector.tsx       # Accordion product list
│   ├── UpdateCard.tsx            # Severity-coded update card
│   ├── UpdateList.tsx            # Grouped update display
│   ├── SearchBar.tsx             # NLP search with suggestions
│   ├── ExportButton.tsx          # Excel/PPTX dropdown
│   ├── LanguageSelector.tsx      # 8-language switcher
│   └── PeriodSelector.tsx        # Time range filter
└── lib/
    ├── types.ts                  # Types + i18n text
    ├── products.ts               # 21 products, 6 families
    ├── mock-data.ts              # Realistic MC-style data
    ├── query-parser.ts           # NLP query → structured filter
    └── mcp-client.ts             # MCP SDK client (Learn)
```

---

## 🤖 GitHub Copilot Usage

This entire project was built using **GitHub Copilot in Agent Mode** within VS Code:

1. **Architecture design** — Copilot designed the component structure, API routes, and data flow
2. **Code generation** — All TypeScript/React components generated via Copilot
3. **MCP integration** — Copilot configured MCP SDK client and Microsoft Learn API connection
4. **NLP implementation** — Query parser with Japanese/English NLP built with Copilot assistance
5. **Export features** — ExcelJS and PptxGenJS document generation coded by Copilot
6. **Bug fixes** — Search filter bug identified and fixed through Copilot debugging
7. **i18n** — 8-language UI text generated and maintained by Copilot

---

## 🎯 Hackathon Track

**Track 1: 🎨 Creative Apps — GitHub Copilot**

| Criteria                 | How This Project Addresses It                     |
| ------------------------ | ------------------------------------------------- |
| **GitHub Copilot Usage** | Entire app built with Copilot Agent Mode          |
| **Creative App**         | Multi-lingual TUB viewer with NLP search + export |
| **MCP Integration**      | Microsoft Learn API via MCP SDK; ready for WorkIQ |

---

## 📜 Disclaimer

This project was created during the Agents League @ TechConnect hackathon.
See [DISCLAIMER.md](https://github.com/microsoft/agentsleague-techconnect/blob/main/DISCLAIMER.md) and [CODE_OF_CONDUCT.md](https://github.com/microsoft/agentsleague-techconnect/blob/main/CODE_OF_CONDUCT.md).

---

## 📄 License

MIT

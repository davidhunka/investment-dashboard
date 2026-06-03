# Technical Troubleshooting, AI Context & Session Handoff Guide

This high-fidelity documentation serves as the unified operational blueprint and technical handoff protocol for developers and AI assistants working in this repository. It integrates local development launch guides, CI/CD pipeline automation, custom React/ECharts rules, Keboola project structure, and resolutions for frequent system anomalies.

---

## 📖 Table of Contents
* [1. Global AI Instructions & Workspace Rules](#1-global-ai-instructions--workspace-rules)
* [2. Repository Map & Workspace Hierarchy](#2-repository-map--workspace-hierarchy)
* [3. Local Development Setup](#3-local-development-setup)
* [4. CI/CD & Deployment Lifecycle](#4-cicd--deployment-lifecycle)
* [5. How to Modify the Dashboard UI & ECharts](#5-how-to-modify-the-dashboard-ui--echarts)
* [6. Keboola Connection ETL Pipeline](#6-keboola-connection-etl-pipeline)
* [7. Troubleshooting & Anomalies Resolution](#7-troubleshooting--anomalies-resolution)

---

## 1. Global AI Instructions & Workspace Rules

Any AI assistant working in this repository MUST strictly adhere to the following operational rules:

### ⚠️ MANDATORY COMMAND EXPLANATION RULE
Before proposing, initiating, or executing ANY terminal, shell, or PowerShell command, you **MUST** present the command and its explanation in a single Czech headline block:

`### ⚠️ Příkaz: [command_string] ([Jednověté vysvětlení v češtině: co příkaz dělá, proč ho spouštíme a zda má nějaké vedlejší účinky / je bezpečný])`

*Constraint*: Do NOT use multiple bullets, lists, or separate explanation text under the command. Keep it highly visible, compact, and immediate.

### Language Standards
- **Developer Chat/Collaboration**: Strictly in **Czech** (Čeština).
- **Code, Configurations, & Deep-dive Docs**: Strictly in **English** (English-only descriptions, banners, labels, variables, and comments).

---

## 2. Repository Map & Workspace Hierarchy

This project integrates personal investment tracking sheets from OneDrive, cleanses and processes them in Snowflake, and serves them on a React app hosted as a Keboola Connection Data App.

```
/Users/david.hunka/Developer/github/davidhunka/investment-dashboard
├── deploy.js                                    # Unified production CI/CD deployment runner (Node.js)
├── README.md                                    # Main repository blueprint with setup instructions
├── documentation/                               # Segmented Business & Technical documents
│   └── TECH-AI_Technical_Troubleshooting_And_Handoff_Guide.md # (This File) Local setups, troubleshooting, & AI handoffs
├── keboola_project/                             # Keboola Connection CLI configuration
│   ├── .keboola/                                # System CLI manifest files tracking changes
│   │   └── manifest.json                        # CLI configuration mapping to project 67 (Azure North Europe)
│   ├── description.md                           # Cloud project master description
│   └── main/                                    # Project logical structures
│       ├── app/keboola.data-apps/my-data-app/   # Production Data App hosting configuration
│       │   ├── config.json                      # Config file directing Keboola to Git repository
│       │   ├── description.md                   # App description
│       │   └── meta.json                        # Configuration metadata
│       └── other/                               # Orchestrator and Schedule files
└── data-app/                                    # Vite + React Premium single-page frontend application
    ├── Dockerfile                               # Node.js slim base container to run app in Keboola Cloud
    ├── server.js                                # Express.js backend serving React static assets and endpoint files
    ├── package.json                             # Dependencies metadata and compile scripts
    ├── index.html                               # HTML5 entry skeleton
    └── src/                                     # React source files
        ├── main.jsx                             # App runtime bootstrapping
        ├── index.css                            # Glassmorphism tokens, badge animations, and responsive breaks
        ├── dataProcessor.js                     # Data parsing (PapaParse) and ROI metric calculation calculations
        └── App.jsx                              # Unified dashboard portal, KPI cards, interactive Apache ECharts
```

---

## 3. Local Development Setup

To test, debug, and run the React Investment Dashboard locally:

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### Installation & Launch
1. Navigate to the frontend directory:
   ```bash
   cd data-app
   ```
2. Install local dependencies:
   ```bash
   npm install
   ```
3. Start the Vite local development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`. Local mock data will be loaded from `/data-app/public/PORTFOLIO.csv`.

---

## 4. CI/CD & Deployment Lifecycle

To push local code modifications to GitHub and deploy them to the live Keboola Cloud Data App, run the automated integration script located at the workspace root:

```bash
node deploy.js
```

### What `deploy.js` Executes (Under the Hood):
1. **Phase 1: React Static Bundle Ingest**:
   Runs `npm run build` inside `data-app/` to compile assets into `data-app/dist/` (using Vite).
2. **Phase 2: GitHub Repository Push**:
   Stages (`git add .`), commits, and pushes the local repository changes to the remote branch `main`.
3. **Phase 3: Keboola CLI Metadata Sync**:
   Invokes `kbc local validate` inside `keboola_project/` to run syntax checks. Then invokes `kbc sync push` to push configurations to Keboola Connection. *(Fails gracefully with a warning if the CLI binary `kbc` is not installed on the system)*.
4. **Phase 4: Cloud Container Rebuild Job**:
   Uses the Keboola REST Queue API (backed by the token loaded from `.env`) to post a run request to `keboola.data-apps` config `108811109`. It polls the job status until completion.

---

## 5. How to Modify the Dashboard UI & ECharts

All dashboard components and UI layouts are defined inside `data-app/src/App.jsx`.

### Apache ECharts Integration
Unlike the e-commerce dashboard which uses custom inline SVG charts, the Investment Dashboard uses **Apache ECharts** (wrapped inside `echarts-for-react`) for high-fidelity interactive financial charting:
- **ROI Evolution Line Chart**: Configured inside `App.jsx` to render cumulative returns and M/M portfolio performance.
- **Data Processor (`dataProcessor.js`)**:
  - Handles parsing raw rows from `PORTFOLIO.csv`.
  - Calculates ROI as `(Cumulative Profit / Historical Max Investment) * 100` to prevent spikes during cash withdrawals.
  - Generates pivot tables for M/M changes by asset type.

---

## 6. Keboola Connection ETL Pipeline

The ETL pipeline runs on Keboola Connection project ID `67` in the Azure North Europe region:
1. **Ingest**: Downloads raw files from OneDrive (`extractor/keboola.ex-onedrive/portfolio`).
2. **Transform**: Executes SQL cleanups in Snowflake (`transformation/keboola.snowflake-transformation/investice`), generating the conformed table `out.c-investice.PORTFOLIO`.
3. **App Storage Map**: The Data App is configured with an input table mapping that mounts `out.c-investice.PORTFOLIO` to `/data/in/tables/PORTFOLIO.csv` inside the running container.

---

## 7. Troubleshooting & Anomalies Resolution

### Issue A: "KBC_TOKEN is missing" on deployment
- **Symptom**: Running `node deploy.js` aborted with an error.
- **Resolution**: Create a `.env` file in the root of the workspace and define `KBC_TOKEN=your-token-here`.

### Issue B: "PORTFOLIO.csv not found" in local Express production run
- **Symptom**: Express backend crashes or returns 404 when querying `/api/portfolio`.
- **Resolution**: Ensure you have a valid local fallback at `data-app/public/PORTFOLIO.csv`. The backend uses this file as a development fallback when the Keboola cloud mount path (`/data/in/tables/`) is unavailable.

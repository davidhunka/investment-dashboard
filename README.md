# 🚀 Osobní Investiční Dashboard

Tento projekt slouží ke sledování výkonnosti a stavu soukromého investičního portfolia.

Aplikace běží **24/7 na platformě Vercel**, přičemž datové zpracování a ETL zajišťuje **Keboola Connection** (Azure North Europe, projekt ID 67).

---

## 🏗️ Architektura projektu

```
[Google Drive: Osobní investice.gsheet]
                  │
                  ▼ (Automatický týdenní Keboola Flow)
[Keboola Connection: Google Drive Extractor -> Snowflake SQL Transformace -> out.c-investice.PORTFOLIO]
                  │
                  ▼ (Storage API preview / token)
[Vercel Serverless API: /api/portfolio (1h Edge Cache)]
                  │
                  ▼
[React + Vite Frontend (Apache ECharts, Glassmorphism, 24/7 bez uspávání)]
```

### 1. Frontend & Hosting (Vercel)
- **URL**: `https://investment-dashboard-bstkjoyhm-davidhunkas-projects.vercel.app` (a produkční alias)
- **Stack**: Vite, React 19, Apache ECharts, Lucide icons, PapaParse
- **Serverless API**: `data-app/api/portfolio.js` stahuje aktuální data z Keboola Storage a cachuje je na CDN.

### 2. Backend & ETL (Keboola Connection)
- **Flow**: `01kt7bcq52m01qh1nfvy8f8pct` (Investice)
- **Extrakce**: Google Drive Extractor `50811458` načítá list *Data input* ze souboru *Osobní investice*.
- **Transformace**: Snowflake transformace `15402` počítá snapshoty, měsíční a roční zisky a ukládá je do `out.c-investice.PORTFOLIO`.
- *Poznámka*: Původní Keboola Data App byla opuštěna kvůli pomalému startu a 15minutovému uspávání kontejnerů.

---

## 💻 Lokální vývoj (Local Development)

1. Přejděte do složky `data-app`:
   ```bash
   cd data-app
   ```
2. Nainstalujte závislosti (pokud ještě nemáte):
   ```bash
   npm install
   ```
3. Spusťte vývojový server:
   ```bash
   npm run dev
   ```
   Aplikace poběží na `http://localhost:5173/`. V lokálním režimu načítá data z `data-app/public/PORTFOLIO.csv`.

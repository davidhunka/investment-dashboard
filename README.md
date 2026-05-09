# 🚀 Osobní Investiční Dashboard

Tento projekt slouží ke sledování výkonnosti a stavu soukromého investičního portfolia.
Původní Python (Streamlit) aplikace byla z výkonnostních a designových důvodů migrována na moderní **Vite + React** frontend.

## 🏗️ Architektura projektu

Projekt je aktuálně rozdělen do dvou hlavních částí:

### 1. `keboola_project/` (Backend / ETL)
V této složce sídlí logika pro stahování, čištění a transformaci dat.
Data se zpracovávají přes [Keboola Connection](https://www.keboola.com/) a výsledkem je čistý soubor `PORTFOLIO.csv`, který je následně distribuován do frontendové aplikace.

### 2. `web_dashboard/` (Frontend)
Zbrusu nová, bleskově rychlá webová aplikace postavená na moderním stacku:
- **Vite** (Build tool)
- **React** (UI Knihovna)
- **Apache ECharts** (Interaktivní grafy)
- **Vanilla CSS** (Glassmorphism design bez závislostí na velkých frameworcích)

Veškerá prezentační logika (výpočty ROI, agregace M/M zisků a křížové tabulky) probíhá přímo v prohlížeči (`dataProcessor.js`), čímž jsme odbourali nutnost provozovat aplikační Python server.

---

## 💻 Jak spustit aplikaci lokálně

Pokud si chcete dashboard prohlédnout a upravovat na svém počítači:

1. Otevřete si terminál ve složce `web_dashboard`:
   ```bash
   cd web_dashboard
   ```
2. Nainstalujte potřebné závislosti (stačí udělat jen poprvé):
   ```bash
   npm install
   ```
3. Spusťte vývojový server:
   ```bash
   npm run dev
   ```
4. Aplikace poběží na adrese `http://localhost:5173/`. Jakákoliv úprava zdrojových kódů (např. v `App.jsx`) se okamžitě projeví v prohlížeči (Hot Reload).

---

## 📈 Nasazení (Deployment)
*V přípravě:* Aplikace bude konfigurována pro plně automatické nasazování na GitHub Pages. Pomocí GitHub Actions se po každé aktualizaci dat z Kebooly automaticky přebuduje a zveřejní aktuální stav portfolia online, a to zcela zdarma.

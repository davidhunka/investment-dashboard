# 🚀 Osobní Investiční Dashboard

Tento projekt slouží ke sledování výkonnosti a stavu soukromého investičního portfolia.
Aplikace běží jako kontejnerizovaná **Keboola Connection Data App** na platformě Azure v oblasti North Europe.

---

## 🏗️ Architektura projektu

Projekt se skládá ze tří hlavních částí:

### 1. `keboola_project/` (Backend / ETL & CLI Config)
V této složce sídlí Keboola Connection CLI konfigurace (extrakce z OneDrive, Snowflake transformace, orchestrace a nastavení Data App).
Data se zpracovávají přes ETL a výsledkem je soubor `PORTFOLIO.csv` namapovaný do vstupního úložiště Data App.

### 2. `data-app/` (React Frontend & Express Backend)
Bleskově rychlá webová aplikace postavená na moderním stacku:
- **Vite + React** – Frontend vykreslující interaktivní grafy přes Apache ECharts a ROI kalkulace.
- **Express.js** – Lehký backend (`server.js`), který servíruje statické assety frontendu a zpřístupňuje data z Keboola Storage na endpointu `/api/portfolio`.
- **Dockerfile** – Kontejnerizuje aplikaci pro běh v Keboola Connection cloudu.

### 3. `deploy.js` (Nasazovací Pipeline)
Integrační Node.js skript, který zautomatizuje celý nasazovací cyklus.

---

## 💻 Jak spustit aplikaci lokálně

### 1. Spuštění frontendu ve vývojovém režimu (Vite Dev Server)
1. Otevřete terminál ve složce `data-app`:
   ```bash
   cd data-app
   ```
2. Nainstalujte závislosti:
   ```bash
   npm install
   ```
3. Spusťte vývojový server:
   ```bash
   npm run dev
   ```
Aplikace poběží na `http://localhost:5173/` s načítáním lokálních mock dat z `data-app/public/PORTFOLIO.csv`.

### 2. Spuštění celého produkčního buildu lokálně (Express Server)
Pokud chcete otestovat Express backend, sestavte aplikaci a spusťte produkční server:
```bash
cd data-app
npm run build
npm start
```
Aplikace poběží na portu `8080` (`http://localhost:8080/`).

---

## 📈 Nasazení do Keboola Connection (Deployment)

Pro nasazení změn do živé Keboola Data App slouží automatizovaný skript v kořeni projektu.

### Příprava před prvním spuštěním:
1. Vytvořte soubor `.env` v kořenovém adresáři projektu.
2. Přidejte do něj svůj Keboola Storage API token:
   ```env
   KBC_TOKEN=tvuj-keboola-storage-api-token
   ```

### Spuštění nasazení:
V terminálu v kořeni projektu spusťte:
```bash
node deploy.js
```

**Co skript provede:**
1. Sestaví statické React soubory (`npm run build`).
2. Uloží a odešle změny kódu do GitHub repozitáře (odkud si Keboola stahuje Docker build).
3. Ověří a nahraje CLI konfigurace z `keboola_project/` do Kebooly (`kbc sync push`).
4. Pomocí Keboola Queue API vyvolá restart a nové sestavení kontejneru Data App a monitoruje průběh úlohy do úspěšného konce.

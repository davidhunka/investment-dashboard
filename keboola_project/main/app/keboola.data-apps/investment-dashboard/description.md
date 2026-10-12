⛔ DEPRECATED / NEPOUŽÍVAT:
Na tuto Data App v Kebooole seru – je těžkopádná, pomalu startuje a po 15 minutách usíná.

Celý Investment Dashboard byl přesunut a běží na Vercelu:
👉 Vercel App: https://investment-dashboard-bstkjoyhm-davidhunkas-projects.vercel.app
👉 GitHub Repo: https://github.com/davidhunka/investment-dashboard

Keboola slouží VÝHRADNĚ jako ETL engine:
1. Stahuje data z Google Drive (Osobní investice)
2. Transformuje je ve Snowflake (keboola.snowflake-transformation 15402)
3. Ukládá do tabulky out.c-investice.PORTFOLIO, odkud si je Vercel tahá přes Storage API.

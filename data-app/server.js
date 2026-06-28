import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Error Handlers for robust production debugging in Keboola logs
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION:', err.stack || err.message || err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Handle Keboola startup POST/GET checks on /
app.all('/', (req, res) => res.send('OK'));

// Path to Keboola Connection input tables
const KEBOOLA_TABLES_DIR = '/data/in/tables';
const LOCAL_MOCK_PATH = path.join(__dirname, 'public', 'PORTFOLIO.csv');

// API Endpoint to serve portfolio CSV
app.get('/api/portfolio', (req, res) => {
  const keboolaPath = path.join(KEBOOLA_TABLES_DIR, 'PORTFOLIO.csv');

  try {
    if (fs.existsSync(keboolaPath)) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.sendFile(keboolaPath);
    } else if (fs.existsSync(LOCAL_MOCK_PATH)) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      return res.sendFile(LOCAL_MOCK_PATH);
    } else {
      console.warn(`⚠️ Portfolio file not found in ${keboolaPath} or ${LOCAL_MOCK_PATH}`);
      return res.status(404).send('PORTFOLIO.csv file not found.');
    }
  } catch (err) {
    console.error('❌ Error serving portfolio data:', err.message);
    res.status(500).json({ error: 'Failed to read Portfolio data', details: err.message });
  }
});

// Serve compiled React bundle
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`📊 Keboola JS Data App Backend successfully running on port ${PORT}`);
  console.log(`🚀 Mount Folder checked: ${KEBOOLA_TABLES_DIR}`);
  console.log(`==================================================================`);
});

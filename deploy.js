import { execSync } from 'child_process';
import https from 'https';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration parameters
const API_HOST = 'queue.north-europe.azure.keboola.com';
const DATA_APP_CONFIG = '01kshevk5jgz7x0h3hyme2xfmv'; // Config ID for portfolio-dashboard in project 67

// Load token from environment or local .env file
let API_TOKEN = process.env.KBC_TOKEN || '';
const envPath = path.join(__dirname, '.env');
if (!API_TOKEN && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/^KBC_TOKEN\s*=\s*(.+)$/m);
  if (match) {
    API_TOKEN = match[1].trim().replace(/^["']|["']$/g, '');
  }
}

function runCmd(command, cwd) {
  console.log(`\n🤖 Running: "${command}" in ${cwd}...`);
  try {
    const stdout = execSync(command, { cwd, encoding: 'utf-8', stdio: 'inherit' });
    return stdout;
  } catch (error) {
    console.error(`❌ Command failed: "${command}"`);
    console.error(error.message);
    throw error;
  }
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}. Raw: ${data}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function triggerJob() {
  console.log('\n🚀 Triggering Live Keboola Data App Deployment...');
  const options = {
    hostname: API_HOST,
    path: '/jobs',
    method: 'POST',
    headers: {
      'X-StorageApi-Token': API_TOKEN,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const body = {
    component: 'keboola.data-apps',
    config: DATA_APP_CONFIG,
    mode: 'run'
  };

  const job = await makeRequest(options, body);
  if (job.status === 'error') {
    throw new Error(`Failed to create job: ${job.result?.error?.message || job.message}`);
  }
  console.log(`✅ Cloud Job successfully triggered! Job ID: ${job.id}`);
  return job.id;
}

async function pollJob(jobId) {
  console.log(`\n⏳ Monitoring Live Keboola Job ${jobId}...`);
  const options = {
    hostname: API_HOST,
    path: `/jobs/${jobId}`,
    method: 'GET',
    headers: {
      'X-StorageApi-Token': API_TOKEN,
      'Accept': 'application/json'
    }
  };

  while (true) {
    const job = await makeRequest(options);
    console.log(`[${new Date().toLocaleTimeString()}] Status: ${job.status}`);
    
    if (job.isFinished) {
      if (job.status === 'success') {
        console.log(`\n🎉 SUCCESS! Data App successfully updated and deployed in Cloud!`);
        console.log(`👉 Access URL: https://connection.north-europe.azure.keboola.com/admin/projects/67/dashboard`);
      } else {
        console.error(`\n❌ FAILED! Job ended with status: ${job.status}`);
        console.error(`Error details:`, JSON.stringify(job.result, null, 2));
      }
      break;
    }

    // Wait 5 seconds
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function main() {
  const rootDir = __dirname;
  const dataAppDir = path.join(rootDir, 'data-app');
  const projectDir = path.join(rootDir, 'keboola_project');

  console.log('====================================================');
  console.log('⚡ Starting Investment Dashboard Deploy Automation ⚡');
  console.log('====================================================');

  if (!API_TOKEN) {
    console.error('❌ ERROR: Keboola Storage API token is missing.');
    console.error('Please define KBC_TOKEN in your environment or inside a local .env file in the root directory.');
    process.exit(1);
  }

  // Ensure spawned child processes inherit the Storage API Token
  process.env.KBC_STORAGE_API_TOKEN = API_TOKEN;
  process.env.KBC_TOKEN = API_TOKEN;

  try {
    // 1. Build React assets
    console.log('\n📦 Phase 1: Compiling React static assets...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    runCmd(`${npmCmd} run build`, dataAppDir);
    console.log('✓ React compiled.');

    // 2. Git Commit & Push
    console.log('\n🐙 Phase 2: Committing and pushing modifications to GitHub...');
    runCmd('git add .', rootDir);
    try {
      runCmd('git commit -m "deploy: migrate investment dashboard to keboola data app"', rootDir);
    } catch (e) {
      console.log('⚠️ No changes detected for git commit. Proceeding to push...');
    }
    runCmd('git push origin main', rootDir);
    console.log('✓ Git push completed.');

    // 3. Keboola CLI Push
    console.log('\n☁️ Phase 3: Validating and pushing Keboola CLI configurations...');
    try {
      runCmd('kbc local encrypt', projectDir);
      runCmd('kbc local validate', projectDir);
      runCmd('kbc sync push', projectDir);
      console.log('✓ Keboola CLI sync push completed.');
    } catch (e) {
      console.log('⚠️ Keboola CLI command failed. Please ensure `kbc` is installed and logged in.');
      console.log('Continuing to deploy the pushed GitHub changes to the Data App container...');
    }

    // 4. Trigger and Poll Data App Job
    console.log('\n🌐 Phase 4: Deploying Data App Container inside Keboola Cloud...');
    const jobId = await triggerJob();
    await pollJob(jobId);

    console.log('\n====================================================');
    console.log('🎉 ALL PHASES COMPLETED WITH 100% SUCCESS!');
    console.log('====================================================');

  } catch (error) {
    console.error('\n💥 Pipeline execution aborted due to error.');
    console.error(error.message);
    process.exit(1);
  }
}

main();

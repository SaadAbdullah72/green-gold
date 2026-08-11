import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;
const WORKFLOW_DIR = path.join(__dirname, '..', 'deliverables', 'workflows');

if (!fs.existsSync(WORKFLOW_DIR)) fs.mkdirSync(WORKFLOW_DIR, { recursive: true });

async function run() {
  console.log('🚀 Rendering Master Workflow Diagram PNG...');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      body { background: #070D1B; color: #FFFFFF; padding: 50px 60px; min-height: 100vh; }
      
      .brand-bar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1E293B; padding-bottom: 24px; margin-bottom: 40px; }
      .brand-title { display: flex; align-items: center; gap: 16px; }
      .brand-logo { width: 50px; height: 50px; background: linear-gradient(135deg, #10B981, #059669); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900; color: white; box-shadow: 0 0 25px rgba(16, 185, 129, 0.4); }
      .brand-text h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; background: linear-gradient(to right, #FFFFFF, #94A3B8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .brand-text p { font-size: 14px; color: #64748B; font-weight: 500; }
      .version-tag { background: #1E293B; border: 1px solid #334155; color: #34D399; padding: 8px 18px; border-radius: 30px; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; }

      .flow-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 16px; position: relative; }

      .role-column { background: #0F172A; border: 1px solid #1E293B; border-radius: 20px; padding: 20px 16px; display: flex; flex-direction: column; gap: 16px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .role-column:hover { border-color: #334155; }

      .role-header { text-align: center; border-bottom: 1px solid #1E293B; padding-bottom: 16px; }
      .role-num { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.08); font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px auto; color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3); }
      .role-name { font-size: 15px; font-weight: 800; color: #F8FAFC; margin-bottom: 4px; line-height: 1.2; }
      .role-subtitle { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

      .step-card { background: #1E293B; border: 1px solid #334155; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 8px; position: relative; }
      .step-badge { font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 6px; text-transform: uppercase; width: fit-content; letter-spacing: 0.05em; }
      
      .c-gen { background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); }
      .c-tech { background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); }
      .c-drv { background: rgba(245, 158, 11, 0.15); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.3); }
      .c-plant { background: rgba(168, 85, 247, 0.15); color: #C084FC; border: 1px solid rgba(168, 85, 247, 0.3); }
      .c-qa { background: rgba(236, 72, 153, 0.15); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3); }
      .c-mgmt { background: rgba(148, 163, 184, 0.15); color: #E2E8F0; border: 1px solid rgba(148, 163, 184, 0.3); }
      .c-buy { background: rgba(52, 211, 153, 0.15); color: #6EE7B7; border: 1px solid rgba(52, 211, 153, 0.3); }

      .step-title { font-size: 13px; font-weight: 700; color: #F1F5F9; line-height: 1.3; }
      .step-desc { font-size: 11px; color: #94A3B8; line-height: 1.4; }

      .arrow-connector { text-align: center; color: #475569; font-size: 16px; margin: -4px 0; font-weight: bold; }

      .pipe-bar { margin-top: 36px; background: #0F172A; border: 1px solid #1E293B; border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
      .pipe-item { display: flex; align-items: center; gap: 12px; }
      .pipe-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; }
      .pipe-info h4 { font-size: 14px; font-weight: 700; color: #F8FAFC; }
      .pipe-info p { font-size: 12px; color: #64748B; }

      .footer-note { text-align: center; margin-top: 24px; font-size: 12px; color: #475569; letter-spacing: 0.05em; text-transform: uppercase; font-weight: 600; }
    </style>
  </head>
  <body>

    <!-- BRANDING HEADER -->
    <div class="brand-bar">
      <div class="brand-title">
        <div class="brand-logo">🌿</div>
        <div class="brand-text">
          <h1>GreenGold OS — Role-Based Workflow Diagram</h1>
          <p>End-to-End Circular Economy Stakeholder Motion & Data Pipeline Architecture</p>
        </div>
      </div>
      <div class="version-tag">SYSTEM SPEC v2.4</div>
    </div>

    <!-- 7 ROLE WORKFLOW COLUMNS -->
    <div class="flow-grid">

      <!-- ROLE 1 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">1</div>
          <div class="role-name">Waste Generator</div>
          <div class="role-subtitle">Hotel / Facility</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-gen">Step 01</span>
          <div class="step-title">IoT Telemetry</div>
          <div class="step-desc"> ultrasonic sensors track fill levels (>80%) and gas scores.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-gen">Step 02</span>
          <div class="step-title">Install Request</div>
          <div class="step-desc">Submit new smart bin deployment application.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-gen">Step 03</span>
          <div class="step-title">Carbon Rewards</div>
          <div class="step-desc">Accrue carbon offset points & diversion rank.</div>
        </div>
      </div>

      <!-- ROLE 2 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">2</div>
          <div class="role-name">Field Technician</div>
          <div class="role-subtitle">Hardware Crew</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-tech">Step 01</span>
          <div class="step-title">Work Orders</div>
          <div class="step-desc">Receive deployment tasks & check sensor stock.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-tech">Step 02</span>
          <div class="step-title">Calibrate Bin</div>
          <div class="step-desc">Set up RF telemetry, fill threshold & battery.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-tech">Step 03</span>
          <div class="step-title">Site Sign-Off</div>
          <div class="step-desc">Log completion & activate smart bin telemetry.</div>
        </div>
      </div>

      <!-- ROLE 3 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">3</div>
          <div class="role-name">Waste Collector</div>
          <div class="role-subtitle">Fleet Driver</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-drv">Step 01</span>
          <div class="step-title">Route Dispatch</div>
          <div class="step-desc">Access GPS-optimized collection route & jobs.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-drv">Step 02</span>
          <div class="step-title">Weight Log</div>
          <div class="step-desc">Sync Bluetooth scale payload (kg) & arrival photo.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-drv">Step 03</span>
          <div class="step-title">Issue Report</div>
          <div class="step-desc">Flag damaged bins or waste contamination.</div>
        </div>
      </div>

      <!-- ROLE 4 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">4</div>
          <div class="role-name">Plant Supervisor</div>
          <div class="role-subtitle">SCADA & Plant</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-plant">Step 01</span>
          <div class="step-title">Intake Weighing</div>
          <div class="step-desc">Weighbridge trucks & monitor SCADA machinery.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-plant">Step 02</span>
          <div class="step-title">Pile Analytics</div>
          <div class="step-desc">Track heat (66°C), moisture & trigger blowers.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-plant">Step 03</span>
          <div class="step-title">Stock Warehouse</div>
          <div class="step-desc">Manage Grade-A organic bags & bulk shipping.</div>
        </div>
      </div>

      <!-- ROLE 5 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">5</div>
          <div class="role-name">QA Specialist</div>
          <div class="role-subtitle">Soil Lab Science</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-qa">Step 01</span>
          <div class="step-title">Testing Queue</div>
          <div class="step-desc">Select mature compost batches for analysis.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-qa">Step 02</span>
          <div class="step-title">NPK Analysis</div>
          <div class="step-desc">Test Nitrogen, Phosphorus, Potassium & pH.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-qa">Step 03</span>
          <div class="step-title">Certify Batch</div>
          <div class="step-desc">Sign QA safety certificate & attest carbon.</div>
        </div>
      </div>

      <!-- ROLE 6 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">6</div>
          <div class="role-name">Management</div>
          <div class="role-subtitle">Command Hub</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-mgmt">Step 01</span>
          <div class="step-title">Command Center</div>
          <div class="step-desc">Executive KPIs, compliance & active site ledger.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-mgmt">Step 02</span>
          <div class="step-title">Crew Dispatch</div>
          <div class="step-desc">Approve bin requests & assign field tech crew.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-mgmt">Step 03</span>
          <div class="step-title">Mint Carbon</div>
          <div class="step-desc">Execute carbon credit tokenizer minting.</div>
        </div>
      </div>

      <!-- ROLE 7 -->
      <div class="role-column">
        <div class="role-header">
          <div class="role-num">7</div>
          <div class="role-name">Fertilizer Buyer</div>
          <div class="role-subtitle">Marketplace</div>
        </div>

        <div class="step-card">
          <span class="step-badge c-buy">Step 01</span>
          <div class="step-title">Market Catalog</div>
          <div class="step-desc">Browse certified organic compost batches.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-buy">Step 02</span>
          <div class="step-title">Audit Provenance</div>
          <div class="step-desc">Trace waste origin → plant SCADA → lab cert.</div>
        </div>
        <div class="arrow-connector">↓</div>
        <div class="step-card">
          <span class="step-badge c-buy">Step 03</span>
          <div class="step-title">Order Checkout</div>
          <div class="step-desc">Select volume & confirm fertilizer delivery.</div>
        </div>
      </div>

    </div>

    <!-- PIPELINE METRICS BAR -->
    <div class="pipe-bar">
      <div class="pipe-item">
        <div class="pipe-icon">📡</div>
        <div class="pipe-info">
          <h4>IoT Telemetry Trigger</h4>
          <p>Ultrasonic fill (>80%) auto-dispatches pickup</p>
        </div>
      </div>
      <div class="pipe-item">
        <div class="pipe-icon">⚖️</div>
        <div class="pipe-info">
          <h4>Bluetooth Scale Audit</h4>
          <p>Driver payload weight (kg) auto-verified</p>
        </div>
      </div>
      <div class="pipe-item">
        <div class="pipe-icon">🧪</div>
        <div class="pipe-info">
          <h4>Lab NPK Attestation</h4>
          <p>QA sign-off unlocks Marketplace & Carbon Minting</p>
        </div>
      </div>
      <div class="pipe-item">
        <div class="pipe-icon">🌱</div>
        <div class="pipe-info">
          <h4>Carbon Offset Rate</h4>
          <p>0.000912 MT CO2e per kg organic waste diverted</p>
        </div>
      </div>
    </div>

    <div class="footer-note">
      GreenGold OS — Circular Waste Management, Telemetry & Carbon Intelligence Governance Framework
    </div>

  </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 500));

  const pngPath = path.join(WORKFLOW_DIR, 'greengold_master_workflow_diagram.png');
  const jpgPath = path.join(WORKFLOW_DIR, 'greengold_master_workflow_diagram.jpg');

  await page.screenshot({ path: pngPath, type: 'png' });
  await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 95 });

  console.log('✨ Master Workflow Diagram PNG & JPG generated:');
  console.log('  ->', pngPath);
  console.log('  ->', jpgPath);

  await browser.close();
}

run().catch(err => {
  console.error('❌ Error generating diagram PNG:', err);
  process.exit(1);
});

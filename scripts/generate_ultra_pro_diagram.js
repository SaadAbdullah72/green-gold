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
  console.log('💎 Rendering Ultra-Professional Enterprise Architecture Workflow Diagram...');

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        background: #090D16;
        color: #F8FAFC;
        font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
        padding: 60px;
        min-height: 100vh;
        background-image: 
          radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 85% 85%, rgba(59, 130, 246, 0.08) 0%, transparent 40%);
      }

      /* HEADER CONTROL PANEL */
      .header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 32px;
        margin-bottom: 48px;
      }
      .brand-block {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .logo-box {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, #10B981 0%, #047857 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 30px rgba(16, 185, 129, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }
      .logo-box svg {
        width: 32px;
        height: 32px;
        fill: none;
        stroke: white;
        stroke-width: 2.2;
      }
      .brand-title h1 {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .brand-title p {
        font-size: 14px;
        color: #94A3B8;
        font-weight: 500;
        margin-top: 4px;
      }
      .sys-badge {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        background: rgba(16, 185, 129, 0.1);
        color: #34D399;
        border: 1px solid rgba(16, 185, 129, 0.25);
        padding: 4px 12px;
        border-radius: 6px;
        font-weight: 600;
      }
      .meta-stats {
        display: flex;
        gap: 32px;
      }
      .meta-item {
        text-align: right;
      }
      .meta-item label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .meta-item val {
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 700;
        color: #38BDF8;
      }

      /* ARCHITECTURE GRID */
      .arch-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 18px;
        position: relative;
      }

      .role-card {
        background: rgba(15, 23, 42, 0.75);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 24px 18px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        position: relative;
      }

      .role-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 20px;
        right: 20px;
        height: 2px;
        border-radius: 2px;
      }
      .rc-1::before { background: #10B981; }
      .rc-2::before { background: #3B82F6; }
      .rc-3::before { background: #F59E0B; }
      .rc-4::before { background: #A855F7; }
      .rc-5::before { background: #EC4899; }
      .rc-6::before { background: #64748B; }
      .rc-7::before { background: #14B8A6; }

      .role-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        padding-bottom: 16px;
      }
      .role-step-num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: #64748B;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 6px;
      }
      .role-name {
        font-size: 16px;
        font-weight: 800;
        color: #F8FAFC;
        letter-spacing: -0.01em;
        line-height: 1.25;
      }
      .role-actor {
        font-size: 12px;
        color: #94A3B8;
        font-weight: 500;
        margin-top: 4px;
      }

      /* WORKFLOW STEP NODES */
      .node-group {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .node {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 12px;
        padding: 14px;
        position: relative;
        transition: all 0.2s ease;
      }
      .node-tag {
        font-family: 'JetBrains Mono', monospace;
        font-size: 9px;
        font-weight: 700;
        padding: 3px 7px;
        border-radius: 4px;
        text-transform: uppercase;
        width: fit-content;
        margin-bottom: 8px;
        letter-spacing: 0.05em;
      }

      .t-gen { background: rgba(16, 185, 129, 0.15); color: #34D399; }
      .t-tech { background: rgba(59, 130, 246, 0.15); color: #60A5FA; }
      .t-drv { background: rgba(245, 158, 11, 0.15); color: #FBBF24; }
      .t-plant { background: rgba(168, 85, 247, 0.15); color: #C084FC; }
      .t-qa { background: rgba(236, 72, 153, 0.15); color: #F472B6; }
      .t-mgmt { background: rgba(148, 163, 184, 0.15); color: #CBD5E1; }
      .t-buy { background: rgba(20, 184, 166, 0.15); color: #2DD4BF; }

      .node-title {
        font-size: 13px;
        font-weight: 700;
        color: #F1F5F9;
        margin-bottom: 4px;
        line-height: 1.3;
      }
      .node-detail {
        font-size: 11px;
        color: #94A3B8;
        line-height: 1.45;
        font-weight: 400;
      }

      .conn-line {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 14px;
      }
      .conn-line svg {
        width: 12px;
        height: 12px;
        stroke: rgba(255, 255, 255, 0.2);
        fill: none;
      }

      /* DATA PIPELINE DATA FLOW BAR */
      .pipeline-footer {
        margin-top: 48px;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 24px 32px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
      }
      .pipe-card {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      .pipe-icon-wrapper {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .pipe-icon-wrapper svg {
        width: 22px;
        height: 22px;
        stroke: #38BDF8;
        fill: none;
        stroke-width: 2;
      }
      .pipe-content h3 {
        font-size: 14px;
        font-weight: 700;
        color: #F8FAFC;
        margin-bottom: 4px;
      }
      .pipe-content p {
        font-size: 12px;
        color: #64748B;
        line-height: 1.4;
      }

      .footer-legal {
        margin-top: 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        color: #475569;
        font-family: 'JetBrains Mono', monospace;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 20px;
      }
    </style>
  </head>
  <body>

    <!-- EXECUTIVE HEADER -->
    <div class="header-bar">
      <div class="brand-block">
        <div class="logo-box">
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12" stroke-linecap="round"/>
            <path d="M12 12c0-3-2-5-5-5c-2 0-3 2-1 4c3 3 6 1 6 1z"/>
            <path d="M12 12c0 3 2 5 5 5c2 0 3-2 1-4c-3-3-6-1-6-1z"/>
          </svg>
        </div>
        <div class="brand-title">
          <h1>GreenGold OS <span class="sys-badge">ENTERPRISE SYSTEM ARCHITECTURE</span></h1>
          <p>End-to-End Operational Governance & Stakeholder Lifecycle Pipeline</p>
        </div>
      </div>

      <div class="meta-stats">
        <div class="meta-item">
          <label>Protocol Standard</label>
          <val>ISO-14064 / Verra</val>
        </div>
        <div class="meta-item">
          <label>Carbon Offset Rate</label>
          <val>0.000912 MT/kg</val>
        </div>
        <div class="meta-item">
          <label>System Telemetry</label>
          <val>ACTIVE • 100%</val>
        </div>
      </div>
    </div>

    <!-- 7 ROLE ENTERPRISE STACK -->
    <div class="arch-grid">

      <!-- ROLE 1: GENERATOR -->
      <div class="role-card rc-1">
        <div class="role-header">
          <div class="role-step-num">STAGE 01</div>
          <div class="role-name">Waste Generator</div>
          <div class="role-actor">Commercial Facility</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-gen">INPUT Telemetry</div>
            <div class="node-title">Smart Bin Telemetry</div>
            <div class="node-detail">Ultrasonic level monitoring (>80% capacity trigger) & VOC odor index.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-gen">ACTION Request</div>
            <div class="node-title">Smart Bin Application</div>
            <div class="node-detail">Submit hardware installation request with site payload parameter.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-gen">LEDGER Ledger</div>
            <div class="node-title">Carbon Credit Ledger</div>
            <div class="node-detail">Accrue ESG carbon offset points & commercial leaderboard standing.</div>
          </div>
        </div>
      </div>

      <!-- ROLE 2: TECHNICIAN -->
      <div class="role-card rc-2">
        <div class="role-header">
          <div class="role-step-num">STAGE 02</div>
          <div class="role-name">Field Technician</div>
          <div class="role-actor">Hardware Deployment</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-tech">INPUT Dispatch</div>
            <div class="node-title">Work Order Queue</div>
            <div class="node-detail">Receive automated deployment work orders & check hardware stock.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-tech">ACTION Calibration</div>
            <div class="node-title">Sensor Setup</div>
            <div class="node-detail">Calibrate ultrasonic fill sensors, RF link, and lithium power cell.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-tech">OUTPUT Sign-Off</div>
            <div class="node-title">Site Verification</div>
            <div class="node-detail">Log installation sign-off and activate live telemetry stream.</div>
          </div>
        </div>
      </div>

      <!-- ROLE 3: COLLECTOR -->
      <div class="role-card rc-3">
        <div class="role-header">
          <div class="role-step-num">STAGE 03</div>
          <div class="role-name">Waste Collector</div>
          <div class="role-actor">Logistics Fleet</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-drv">INPUT Navigation</div>
            <div class="node-title">Optimized Routing</div>
            <div class="node-detail">Receive dynamic GPS route based on bin threshold alerts.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-drv">ACTION Scale Sync</div>
            <div class="node-title">Payload Weighing</div>
            <div class="node-detail">Record net waste weight (kg) via Bluetooth scale & site photo.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-drv">OUTPUT Audit</div>
            <div class="node-title">Field Exception Log</div>
            <div class="node-detail">Escalate damaged hardware or unsegregated waste contaminants.</div>
          </div>
        </div>
      </div>

      <!-- ROLE 4: PROCESSING PLANT -->
      <div class="role-card rc-4">
        <div class="role-header">
          <div class="role-step-num">STAGE 04</div>
          <div class="role-name">Plant Supervisor</div>
          <div class="role-actor">Industrial Composting</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-plant">INPUT SCADA</div>
            <div class="node-title">Weighbridge Intake</div>
            <div class="node-detail">Verify truck payload weight & monitor industrial shredder SCADA.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-plant">ACTION Controls</div>
            <div class="node-title">Pile Thermodynamics</div>
            <div class="node-detail">Monitor thermophilic heat (66°C), C:N ratio & trigger blowers.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-plant">OUTPUT Inventory</div>
            <div class="node-title">Compost Inventory</div>
            <div class="node-detail">Package Grade-A organic compost & log warehouse bay storage.</div>
          </div>
        </div>
      </div>

      <!-- ROLE 5: QA SPECIALIST -->
      <div class="role-card rc-5">
        <div class="role-header">
          <div class="role-step-num">STAGE 05</div>
          <div class="role-name">QA Specialist</div>
          <div class="role-actor">Soil Laboratory</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-qa">INPUT Queue</div>
            <div class="node-title">Sample Testing Queue</div>
            <div class="node-detail">Receive compost batch samples for biochemical attestation.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-qa">ACTION Lab Testing</div>
            <div class="node-title">NPK & Metal Analysis</div>
            <div class="node-detail">Measure Nitrogen, Phosphorus, Potassium, pH & heavy metals.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-qa">OUTPUT Certificate</div>
            <div class="node-title">Attestation Sign-Off</div>
            <div class="node-detail">Issue digital QA safety certificate & attest carbon offset batch.</div>
          </div>
        </div>
      </div>

      <!-- ROLE 6: MANAGEMENT -->
      <div class="role-card rc-6">
        <div class="role-header">
          <div class="role-step-num">STAGE 06</div>
          <div class="role-name">System Management</div>
          <div class="role-actor">Executive Command</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-mgmt">INPUT Oversight</div>
            <div class="node-title">Executive Command</div>
            <div class="node-detail">Audit system-wide KPIs, diversion metrics & compliance.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-mgmt">ACTION Approval</div>
            <div class="node-title">Resource Allocation</div>
            <div class="node-detail">Approve smart bin applications & assign field tech crews.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-mgmt">OUTPUT Tokenizer</div>
            <div class="node-title">Carbon Credit Minting</div>
            <div class="node-detail">Execute tokenized carbon credit minting post lab attestation.</div>
          </div>
        </div>
      </div>

      <!-- ROLE 7: FERTILIZER BUYER -->
      <div class="role-card rc-7">
        <div class="role-header">
          <div class="role-step-num">STAGE 07</div>
          <div class="role-name">Fertilizer Buyer</div>
          <div class="role-actor">Agri Marketplace</div>
        </div>

        <div class="node-group">
          <div class="node">
            <div class="node-tag t-buy">INPUT Marketplace</div>
            <div class="node-title">Product Catalogue</div>
            <div class="node-detail">Browse certified organic compost batches with live stock availability.</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-buy">ACTION Audit</div>
            <div class="node-title">Provenance Trace</div>
            <div class="node-detail">Audit origin trace (Hotel waste → Plant SCADA → Lab NPK cert).</div>
          </div>
          <div class="conn-line"><svg viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7" stroke-width="2"/></svg></div>
          <div class="node">
            <div class="node-tag t-buy">OUTPUT Purchase</div>
            <div class="node-title">Order Dispatch</div>
            <div class="node-detail">Select volume (50kg bags / Bulk tons) & confirm shipping.</div>
          </div>
        </div>
      </div>

    </div>

    <!-- TECHNICAL PIPELINE BAR -->
    <div class="pipeline-footer">
      <div class="pipe-card">
        <div class="pipe-icon-wrapper">
          <svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="pipe-content">
          <h3>IoT Telemetry Engine</h3>
          <p>Real-time ultrasonic fill level & gas risk scoring algorithm.</p>
        </div>
      </div>

      <div class="pipe-card">
        <div class="pipe-icon-wrapper">
          <svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        </div>
        <div class="pipe-content">
          <h3>Bluetooth Weigh Scale</h3>
          <p>Tamper-proof physical payload logging & photo verification.</p>
        </div>
      </div>

      <div class="pipe-card">
        <div class="pipe-icon-wrapper">
          <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="pipe-content">
          <h3>QA Soil Attestation</h3>
          <p>Lab NPK certificate verification unlocks Marketplace trade.</p>
        </div>
      </div>

      <div class="pipe-card">
        <div class="pipe-icon-wrapper">
          <svg viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="pipe-content">
          <h3>Carbon Tokenizer</h3>
          <p>Auto-mints verified carbon credits upon lab certification sign-off.</p>
        </div>
      </div>
    </div>

    <!-- FOOTER INFO -->
    <div class="footer-legal">
      <span>GREENGOLD OS ENTERPRISE PLATFORM SPECIFICATION</span>
      <span>ISO 14064 GHG COMPLIANT</span>
      <span>CONFIDENTIAL OPERATIONAL ARCHITECTURE</span>
    </div>

  </body>
  </html>
  `;

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 2400, height: 1350, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const proPng = path.join(WORKFLOW_DIR, 'greengold_enterprise_architecture_workflow.png');
  const proJpg = path.join(WORKFLOW_DIR, 'greengold_enterprise_architecture_workflow.jpg');
  const masterPng = path.join(WORKFLOW_DIR, 'greengold_master_workflow_diagram.png');
  const masterJpg = path.join(WORKFLOW_DIR, 'greengold_master_workflow_diagram.jpg');

  await page.screenshot({ path: proPng, type: 'png' });
  await page.screenshot({ path: proJpg, type: 'jpeg', quality: 95 });
  await page.screenshot({ path: masterPng, type: 'png' });
  await page.screenshot({ path: masterJpg, type: 'jpeg', quality: 95 });

  console.log('✨ Ultra-Professional Enterprise Workflow Diagram generated successfully!');
  console.log('  ->', proPng);
  console.log('  ->', proJpg);

  await browser.close();
}

run().catch(err => {
  console.error('❌ Error generating ultra-pro diagram PNG:', err);
  process.exit(1);
});

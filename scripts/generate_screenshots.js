import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const executablePath = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;

const SCREENSHOT_DIR = path.join(__dirname, '..', 'deliverables', 'screenshots');
const WORKFLOW_DIR = path.join(__dirname, '..', 'deliverables', 'workflows');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(WORKFLOW_DIR)) fs.mkdirSync(WORKFLOW_DIR, { recursive: true });

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Launching Headless Browser using:', executablePath);
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1.5 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  async function loginAs(roleValue) {
    console.log(`\n🔑 Logging in as role: ${roleValue}`);
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    
    // Check if on landing page and click button to enter portal
    const joinBtn = await page.$('button::-p-text(Join Us Now »)');
    if (joinBtn) {
      await joinBtn.click();
      await delay(500);
    } else {
      const getStartedBtn = await page.$('button::-p-text(Get Started »)');
      if (getStartedBtn) {
        await getStartedBtn.click();
        await delay(500);
      }
    }

    await page.waitForSelector('#role-select', { timeout: 10000 });
    await page.select('#role-select', roleValue);
    await delay(300);
    await page.click('button[type="submit"]');
    await delay(1000);
  }

  // =========================================================================
  // 1. WASTE GENERATOR WORKFLOW
  // =========================================================================
  console.log('--- Capturing 1. Waste Generator Workflow ---');
  await loginAs('generator');
  
  // Step 1: Telemetry Dashboard
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'generator_step1_telemetry.png'), fullPage: false });
  console.log('  [✓] generator_step1_telemetry.png');

  // Step 2: Bin Installation Form
  const reqBtn = await page.$('button::-p-text(Request Smart Bin)');
  if (reqBtn) {
    await reqBtn.click();
    await delay(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'generator_step2_install_request.png'), fullPage: false });
    console.log('  [✓] generator_step2_install_request.png');
    // Close modal if open
    const closeBtn = await page.$('button::-p-text(Cancel)');
    if (closeBtn) await closeBtn.click();
    await delay(300);
  } else {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'generator_step2_install_request.png'), fullPage: false });
  }

  // Step 3: Rewards & Pickup Status
  const rewardsBtn = await page.$('button::-p-text(Eco Rewards)');
  if (rewardsBtn) await rewardsBtn.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'generator_step3_rewards_pickup.png'), fullPage: false });
  console.log('  [✓] generator_step3_rewards_pickup.png');

  // =========================================================================
  // 2. FIELD TECHNICIAN / INSTALLER WORKFLOW
  // =========================================================================
  console.log('--- Capturing 2. Field Technician Workflow ---');
  await loginAs('installer');

  // Step 1: Work Queue
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'technician_step1_work_queue.png'), fullPage: false });
  console.log('  [✓] technician_step1_work_queue.png');

  // Step 2: Calibration Setup / Details
  const calibBtn = await page.$('button::-p-text(Calibrate)');
  if (calibBtn) {
    await calibBtn.click();
    await delay(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'technician_step2_calibration.png'), fullPage: false });
  console.log('  [✓] technician_step2_calibration.png');

  // Step 3: Deployment Complete / Inventory
  const stockTab = await page.$('button::-p-text(Stock)');
  if (stockTab) await stockTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'technician_step3_deployment_complete.png'), fullPage: false });
  console.log('  [✓] technician_step3_deployment_complete.png');

  // =========================================================================
  // 3. WASTE COLLECTOR / DRIVER WORKFLOW
  // =========================================================================
  console.log('--- Capturing 3. Waste Collector / Driver Workflow ---');
  await loginAs('collector');

  // Step 1: Route Dispatch & Tasks
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'collector_step1_route_dispatch.png'), fullPage: false });
  console.log('  [✓] collector_step1_route_dispatch.png');

  // Step 2: Weight Logging Modal / Action
  const collectBtn = await page.$('button::-p-text(Record Collection)');
  if (collectBtn) {
    await collectBtn.click();
    await delay(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'collector_step2_weight_logging.png'), fullPage: false });
  console.log('  [✓] collector_step2_weight_logging.png');

  // Step 3: Field Issue Escalation
  const cancelOrClose = await page.$('button::-p-text(Cancel)');
  if (cancelOrClose) await cancelOrClose.click();
  await delay(300);
  
  const issueTab = await page.$('button::-p-text(Issue Log)');
  if (issueTab) await issueTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'collector_step3_issue_escalation.png'), fullPage: false });
  console.log('  [✓] collector_step3_issue_escalation.png');

  // =========================================================================
  // 4. PROCESSING PLANT SUPERVISOR WORKFLOW
  // =========================================================================
  console.log('--- Capturing 4. Processing Plant Supervisor Workflow ---');
  await loginAs('composition');

  // Step 1: SCADA Intake & Machinery
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'plant_step1_scada_intake.png'), fullPage: false });
  console.log('  [✓] plant_step1_scada_intake.png');

  // Step 2: Compost Pile Monitoring
  const pileTab = await page.$('button::-p-text(Monitoring & Quality)');
  if (pileTab) await pileTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'plant_step2_compost_telemetry.png'), fullPage: false });
  console.log('  [✓] plant_step2_compost_telemetry.png');

  // Step 3: Inventory & Distribution
  const invTab = await page.$('button::-p-text(Inventory & Distribution)');
  if (invTab) await invTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'plant_step3_inventory_distribution.png'), fullPage: false });
  console.log('  [✓] plant_step3_inventory_distribution.png');

  // =========================================================================
  // 5. QA SPECIALIST WORKFLOW
  // =========================================================================
  console.log('--- Capturing 5. QA Specialist Workflow ---');
  await loginAs('qa');

  // Step 1: Testing Work Queue
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa_step1_testing_queue.png'), fullPage: false });
  console.log('  [✓] qa_step1_testing_queue.png');

  // Step 2: NPK Analysis
  const testBtn = await page.$('button::-p-text(Perform NPK Test)');
  if (testBtn) {
    await testBtn.click();
    await delay(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa_step2_npk_analysis.png'), fullPage: false });
  console.log('  [✓] qa_step2_npk_analysis.png');

  // Step 3: Certificate & Attestation
  const certTab = await page.$('button::-p-text(Certificates)');
  if (certTab) await certTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'qa_step3_cert_attestation.png'), fullPage: false });
  console.log('  [✓] qa_step3_cert_attestation.png');

  // =========================================================================
  // 6. MANAGEMENT / GENERAL MANAGER WORKFLOW
  // =========================================================================
  console.log('--- Capturing 6. Management / General Manager Workflow ---');
  await loginAs('management');

  // Step 1: Operations Command Center
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'management_step1_command_center.png'), fullPage: false });
  console.log('  [✓] management_step1_command_center.png');

  // Step 2: Tech Assignment Modal / Approvals
  const approveBtn = await page.$('button::-p-text(Approve & Assign Crew)');
  if (approveBtn) {
    await approveBtn.click();
    await delay(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'management_step2_tech_approval.png'), fullPage: false });
  console.log('  [✓] management_step2_tech_approval.png');

  // Step 3: Carbon Tokenizer & Logistics
  const cancelModal = await page.$('button::-p-text(Cancel)');
  if (cancelModal) await cancelModal.click();
  await delay(300);

  const carbonTab = await page.$('button::-p-text(Soil Attestations)');
  if (carbonTab) await carbonTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'management_step3_carbon_tokenizer.png'), fullPage: false });
  console.log('  [✓] management_step3_carbon_tokenizer.png');

  // =========================================================================
  // 7. FERTILIZER BUYER WORKFLOW
  // =========================================================================
  console.log('--- Capturing 7. Fertilizer Buyer Workflow ---');
  await loginAs('buyer');

  // Step 1: Marketplace Catalogue
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'buyer_step1_marketplace_catalogue.png'), fullPage: false });
  console.log('  [✓] buyer_step1_marketplace_catalogue.png');

  // Step 2: Provenance & Lab QA Audit
  const viewDetailBtn = await page.$('button::-p-text(Inspect Provenance)');
  if (viewDetailBtn) {
    await viewDetailBtn.click();
    await delay(500);
  }
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'buyer_step2_provenance_audit.png'), fullPage: false });
  console.log('  [✓] buyer_step2_provenance_audit.png');

  // Step 3: Order Checkout Confirmation
  const orderTab = await page.$('button::-p-text(My Orders)');
  if (orderTab) await orderTab.click();
  await delay(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'buyer_step3_order_checkout.png'), fullPage: false });
  console.log('  [✓] buyer_step3_order_checkout.png');

  // =========================================================================
  // GENERATE COMPOSITE WORKFLOW INFOGRAPHICS (PNG & JPG)
  // =========================================================================
  console.log('\n🎨 Generating Composite Workflow Infographics (PNG & JPG)...');

  const rolesWorkflows = [
    {
      id: 'workflow_1_waste_generator',
      title: 'Waste Generator Workflow',
      role: 'Hotel Marriott / Commercial Facility Manager',
      steps: [
        { num: '01', title: 'Telemetry Monitoring', file: 'generator_step1_telemetry.png', desc: 'Real-time smart bin fill levels, moisture, and VOC odor risk telemetry monitoring.' },
        { num: '02', title: 'Installation Request', file: 'generator_step2_install_request.png', desc: 'Submit application for IoT smart bin installation with site capacity details.' },
        { num: '03', title: 'Rewards & Carbon Credit', file: 'generator_step3_rewards_pickup.png', desc: 'Track organic waste diverted, carbon points accrued, and diversion leaderboard.' }
      ]
    },
    {
      id: 'workflow_2_field_technician',
      title: 'Field Technician Workflow',
      role: 'Hardware Installation & Calibration Crew',
      steps: [
        { num: '01', title: 'Work Order Queue', file: 'technician_step1_work_queue.png', desc: 'View assigned smart bin deployment jobs and hardware stock inventory.' },
        { num: '02', title: 'Sensor Calibration', file: 'technician_step2_calibration.png', desc: 'Calibrate ultrasonic fill sensors, RF battery levels, and gas telemetry.' },
        { num: '03', title: 'Deployment Sign-Off', file: 'technician_step3_deployment_complete.png', desc: 'Log hardware installation completion and site verification record.' }
      ]
    },
    {
      id: 'workflow_3_waste_collector',
      title: 'Waste Collector Workflow',
      role: 'Logistics Fleet Driver',
      steps: [
        { num: '01', title: 'Route Optimization', file: 'collector_step1_route_dispatch.png', desc: 'Access GPS-optimized collection route and automated bin emptying triggers.' },
        { num: '02', title: 'Payload Weight Logging', file: 'collector_step2_weight_logging.png', desc: 'Connect Bluetooth weigh scales to record actual waste weight (kg) & photo verification.' },
        { num: '03', title: 'Field Issue Escalation', file: 'collector_step3_issue_escalation.png', desc: 'Flag damaged bins or waste contamination directly to technical maintenance queue.' }
      ]
    },
    {
      id: 'workflow_4_processing_plant',
      title: 'Processing Plant Supervisor Workflow',
      role: 'Industrial Plant & Compost Operator',
      steps: [
        { num: '01', title: 'Weighbridge & SCADA Intake', file: 'plant_step1_scada_intake.png', desc: 'Inspect weighbridge truck intake logs and monitor industrial shredder/conveyor SCADA status.' },
        { num: '02', title: 'Compost Telemetry & Aeration', file: 'plant_step2_compost_telemetry.png', desc: 'Monitor thermophilic pile heat (66°C optimum), moisture, C:N ratios, and trigger blowers.' },
        { num: '03', title: 'Warehouse Stock & Shipments', file: 'plant_step3_inventory_distribution.png', desc: 'Track packaged Grade-A organic compost inventory and heavy bulk truck distribution.' }
      ]
    },
    {
      id: 'workflow_5_qa_specialist',
      title: 'QA Specialist Workflow',
      role: 'Quality Assurance & Soil Scientist',
      steps: [
        { num: '01', title: 'Lab Testing Queue', file: 'qa_step1_testing_queue.png', desc: 'Review compost batch samples awaiting chemical and biological certification.' },
        { num: '02', title: 'NPK & Heavy Metal Analysis', file: 'qa_step2_npk_analysis.png', desc: 'Perform lab testing for Nitrogen, Phosphorus, Potassium, pH, and heavy metal compliance.' },
        { num: '03', title: 'Certificate Sign-Off', file: 'qa_step3_cert_attestation.png', desc: 'Issue digital QA safety certificate and attest batch for carbon credit minting.' }
      ]
    },
    {
      id: 'workflow_6_management',
      title: 'Management Command Workflow',
      role: 'General Manager / System Administrator',
      steps: [
        { num: '01', title: 'Executive Command Center', file: 'management_step1_command_center.png', desc: 'High-level operational overview, active site compliance, and environmental KPIs.' },
        { num: '02', title: 'Request Approval & Dispatch', file: 'management_step2_tech_approval.png', desc: 'Approve bin installation requests and assign nearest technician field crew.' },
        { num: '03', title: 'Logistics & Carbon Minting', file: 'management_step3_carbon_tokenizer.png', desc: 'Assign bulk waste carrier haulers and mint verified carbon credits.' }
      ]
    },
    {
      id: 'workflow_7_fertilizer_buyer',
      title: 'Fertilizer Buyer Workflow',
      role: 'Organic Fertilizer Marketplace Customer',
      steps: [
        { num: '01', title: 'Marketplace Catalogue', file: 'buyer_step1_marketplace_catalogue.png', desc: 'Browse available certified organic compost batches with live warehouse availability.' },
        { num: '02', title: 'Batch Provenance Audit', file: 'buyer_step2_provenance_audit.png', desc: 'Inspect full origin trace (hotel waste -> plant digestion -> lab NPK certificate).' },
        { num: '03', title: 'Order Confirmation', file: 'buyer_step3_order_checkout.png', desc: 'Configure delivery volume, specify shipping destination, and confirm purchase.' }
      ]
    }
  ];

  for (const wf of rolesWorkflows) {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
        body { background: #0B132B; color: #FFFFFF; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .badge { display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
        .title { font-size: 32px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px; letter-spacing: -0.02em; }
        .subtitle { font-size: 16px; color: #94A3B8; font-weight: 500; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; position: relative; }
        .card { background: #1E293B; border-radius: 16px; border: 1px solid #334155; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
        .card-header { padding: 18px 20px; background: #0F172A; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 14px; }
        .step-num { background: linear-gradient(135deg, #F59E0B, #D97706); color: #000; font-size: 16px; font-weight: 900; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-title { font-size: 18px; font-weight: 700; color: #F8FAFC; }
        .img-container { width: 100%; height: 380px; overflow: hidden; background: #000; border-bottom: 1px solid #334155; }
        .img-container img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .card-body { padding: 18px 20px; font-size: 14px; color: #CBD5E1; line-height: 1.6; flex-grow: 1; background: #1E293B; }
        .footer { text-align: center; margin-top: 30px; font-size: 13px; color: #64748B; border-top: 1px solid #334155; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="badge">${wf.role}</div>
        <h1 class="title">${wf.title}</h1>
        <p class="subtitle">GreenGold OS Stakeholder Lifecycle & Workflow Motion Diagram</p>
      </div>

      <div class="grid">
        ${wf.steps.map(s => {
          const imgBase64 = fs.readFileSync(path.join(SCREENSHOT_DIR, s.file)).toString('base64');
          return `
            <div class="card">
              <div class="card-header">
                <div class="step-num">${s.num}</div>
                <div class="step-title">${s.title}</div>
              </div>
              <div class="img-container">
                <img src="data:image/png;base64,${imgBase64}" />
              </div>
              <div class="card-body">
                ${s.desc}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="footer">
        GreenGold OS Circular Economy Platform — Confidential Operational Workflow Deliverable
      </div>
    </body>
    </html>
    `;

    const compositePage = await browser.newPage();
    await compositePage.setViewport({ width: 1800, height: 750, deviceScaleFactor: 2 });
    await compositePage.setContent(htmlContent, { waitUntil: 'load' });
    await delay(300);

    const pngPath = path.join(WORKFLOW_DIR, `${wf.id}.png`);
    const jpgPath = path.join(WORKFLOW_DIR, `${wf.id}.jpg`);

    await compositePage.screenshot({ path: pngPath, type: 'png' });
    await compositePage.screenshot({ path: jpgPath, type: 'jpeg', quality: 95 });

    console.log(`  [✓] Generated ${wf.id}.png and ${wf.id}.jpg`);
    await compositePage.close();
  }

  await browser.close();
  console.log('\n✨ All screenshots and workflow deliverables generated successfully!');
}

run().catch(err => {
  console.error('❌ Error generating screenshots:', err);
  process.exit(1);
});

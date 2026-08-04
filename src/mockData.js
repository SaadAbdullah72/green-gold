// GreenGoldOS React Mock Database and Lists

export const MOCK_DATA = {
  // Global KPI Counters
  stats: {
    activeBins: 12,
    totalWasteDivertedKg: 4520,
    certifiedCarbonCreditsMt: 3.45,
    pendingCarbonCreditsMt: 0.68,
    recycledPlasticsKg: 485,
    compostRevenueUsd: 2180
  },

  // Active Bins/Sites Ledger
  activeSites: [
    { id: "SITE-01", name: "Hotel Marriott (Kitchen)", bins: 2, sortAccuracy: 97.8, status: "Compliant" },
    { id: "SITE-02", name: "Sector 7 Residential Gate", bins: 3, sortAccuracy: 92.4, status: "Compliant" },
    { id: "SITE-03", name: "City College Cafeteria", bins: 2, sortAccuracy: 88.5, status: "Warning" },
    { id: "SITE-04", name: "Downtown Office Hub", bins: 5, sortAccuracy: 94.1, status: "Compliant" }
  ],

  // 1. Pending Installation Requests (Approval Queue)
  installRequests: [
    {
      id: "REQ-101",
      org: "Grand Hyatt Hotel",
      contact: "Mark Vance (Gen Manager)",
      phone: "+1 (555) 302-9901",
      type: "Organic Food Waste",
      location: "Main Banquet Kitchen - Ground Floor",
      requestDate: "2026-08-03",
      estMonthlyWasteKg: 1200,
      binsRequested: 2,
      status: "Pending",
      assignedCrew: null
    },
    {
      id: "REQ-102",
      org: "Sector 4 Residential Block",
      contact: "Lydia Patel (Society Sec)",
      phone: "+1 (555) 773-1022",
      type: "Organic Food Waste",
      location: "Disposal Yard near Gate 2",
      requestDate: "2026-08-04",
      estMonthlyWasteKg: 2500,
      binsRequested: 4,
      status: "Pending",
      assignedCrew: null
    },
    {
      id: "REQ-103",
      org: "Tech Mahindra Campus",
      contact: "Rajesh Iyer (Facility Head)",
      phone: "+1 (555) 882-9988",
      type: "Organic Food Waste",
      location: "Block C Cafeteria Yard",
      requestDate: "2026-08-04",
      estMonthlyWasteKg: 1800,
      binsRequested: 3,
      status: "Pending",
      assignedCrew: null
    },
    {
      id: "REQ-104",
      org: "Green Sprout Nursery",
      contact: "Sandra Bull (Owner)",
      phone: "+1 (555) 441-2899",
      type: "Green/Carbon Waste",
      location: "East Soil Canopy Area",
      requestDate: "2026-08-02",
      estMonthlyWasteKg: 800,
      binsRequested: 1,
      status: "Pending",
      assignedCrew: null
    }
  ],

  // 2. Batches Awaiting Carbon Credit Certification
  batchesAwaitingCert: [
    {
      id: "BATCH-401",
      name: "BioGold Organic Mix A",
      wasteProcessedKg: 850,
      compostYieldKg: 382,
      carbonOffsetValueMt: 0.775,
      npkRatio: "4 - 2 - 2",
      qaScore: 94,
      ph: 6.8,
      leadPpm: 12,
      tester: "Dr. Sarah Lin (Soil Science Lab)",
      harvestDate: "2026-08-02",
      status: "Awaiting Certification"
    },
    {
      id: "BATCH-402",
      name: "Urban Green Humus B",
      wasteProcessedKg: 620,
      compostYieldKg: 279,
      carbonOffsetValueMt: 0.565,
      npkRatio: "3 - 2 - 1",
      qaScore: 87,
      ph: 7.2,
      leadPpm: 24,
      tester: "Dr. Sarah Lin (Soil Science Lab)",
      harvestDate: "2026-08-03",
      status: "Awaiting Certification"
    }
  ],

  // 3. Contamination & Non-Compliance Ledger
  contaminationAlerts: [
    {
      id: "ALERT-501",
      site: "Hotel Marriott (Kitchen)",
      binId: "BIN-101",
      reportedBy: "EcoTruck Driver John Doe",
      issueDescription: "Approximately 4.5kg of plastic packaging disposed inside the organic-only composter bin.",
      contaminationRate: 12,
      flaggedDate: "2026-08-04",
      status: "Awaiting Action"
    },
    {
      id: "ALERT-502",
      site: "City College Cafeteria",
      binId: "BIN-104",
      reportedBy: "EcoTruck Driver John Doe",
      issueDescription: "Disposable aluminum cans and plastic bottles mixed directly with cafeteria food scrap bins.",
      contaminationRate: 8,
      flaggedDate: "2026-08-03",
      status: "Awaiting Action"
    }
  ],

  // 4. Logistics Dispatch Queue (Collected Waste Awaiting Routing)
  collectedWasteQueue: [
    {
      id: "DISP-301",
      site: "Sector 7 Residential Gate",
      weightKg: 220,
      wasteType: "Organic Food Waste",
      collectedDate: "2026-08-04",
      status: "Awaiting Partner",
      assignedPartner: null
    },
    {
      id: "DISP-302",
      site: "Hotel Marriott (Kitchen)",
      weightKg: 180,
      wasteType: "Organic Food Waste",
      collectedDate: "2026-08-04",
      status: "Awaiting Partner",
      assignedPartner: null
    },
    {
      id: "DISP-303",
      site: "Downtown Office Hub",
      weightKg: 340,
      wasteType: "Organic Food Waste",
      collectedDate: "2026-08-03",
      status: "Awaiting Partner",
      assignedPartner: null
    }
  ],

  // System Logs
  logs: [
    { timestamp: "2026-08-04 09:40", category: "Audit", message: "System General Manager accessed the Carbon Credit Verification dashboard." },
    { timestamp: "2026-08-04 08:30", category: "Logistics", message: "Driver John Doe submitted route compliance log for Sector 7 pickups." },
    { timestamp: "2026-08-03 17:15", category: "QA", message: "Batch BATCH-401 certified by Dr. Sarah Lin with a QA Score of 94/100." }
  ]
};

// Technical Crews available for assignment
export const TECH_CREWS = [
  { id: "CREW-01", name: "Team 1 (North Area)", strength: "3 Technicians", lead: "Alex Mercer" },
  { id: "CREW-02", name: "Team 2 (South Area)", strength: "2 Technicians", lead: "Ben Stark" },
  { id: "CREW-03", name: "Team 3 (East Area)", strength: "4 Technicians", lead: "Chloe Adams" },
  { id: "CREW-04", name: "Team 4 (West Area)", strength: "3 Technicians", lead: "Danny DeVito" }
];

// Logistics partners available for routing collected waste to composting plants
export const LOGISTICS_PARTNERS = [
  { id: "LOG-01", name: "EcoHaulers Inc.", contact: "+1 (555) 019-2244", fleet: "Electric Vans", rate: "$0.10/kg" },
  { id: "LOG-02", name: "GreenFreight Logistics", contact: "+1 (555) 014-4881", fleet: "EcoTruck Heavy E-04", rate: "$0.12/kg" },
  { id: "LOG-03", name: "BioTransport Express", contact: "+1 (555) 018-7722", fleet: "CNG Light Trucks", rate: "$0.09/kg" }
];

// Factory reports data per week/month
export const FACTORY_REPORTS = {
  weekly: [
    { id: "FAC-01", name: "North Yard Bio-Mixers", recycledKg: 1200, carbonSavedMt: 1.09, plasticRecoveredKg: 120, rating: 4.8 },
    { id: "FAC-02", name: "East Canopy Digesters", recycledKg: 850, carbonSavedMt: 0.77, plasticRecoveredKg: 78, rating: 4.6 },
    { id: "FAC-03", name: "South Delta Compost Plant", recycledKg: 1540, carbonSavedMt: 1.40, plasticRecoveredKg: 165, rating: 4.9 }
  ],
  monthly: [
    { id: "FAC-01", name: "North Yard Bio-Mixers", recycledKg: 5200, carbonSavedMt: 4.74, plasticRecoveredKg: 540, rating: 4.8 },
    { id: "FAC-02", name: "East Canopy Digesters", recycledKg: 3800, carbonSavedMt: 3.46, plasticRecoveredKg: 320, rating: 4.7 },
    { id: "FAC-03", name: "South Delta Compost Plant", recycledKg: 6400, carbonSavedMt: 5.83, plasticRecoveredKg: 710, rating: 4.9 }
  ]
};

export const TECHNICAL_STAFF_DATA = {
  jobs: [
    { id: "JOB-201", org: "Grand Hyatt Hotel", priority: "High", binId: "BIN-501", gps: "12.9702, 77.5946", schedule: "Today · 09:30", status: "Assigned", workflow: "Installation", description: "Install hardware, sensors, and QR/RFID tags for a banquet kitchen deployment.", lastAction: "Accept" },
    { id: "JOB-202", org: "Sector 4 Residential Block", priority: "Medium", binId: "BIN-502", gps: "12.9610, 77.6024", schedule: "Today · 13:15", status: "In Progress", workflow: "Calibration", description: "Validate telemetry calibration and network connectivity.", lastAction: "Start" },
    { id: "JOB-203", org: "City College Cafeteria", priority: "High", binId: "BIN-503", gps: "12.9765, 77.5902", schedule: "Tomorrow · 08:00", status: "Pending", workflow: "Maintenance", description: "Replace battery and inspect sensor module after a low-power alert.", lastAction: "Pause" }
  ],
  inventory: [
    { id: "BIN-501", qr: "QR-501", rfid: "RFID-501", organization: "Grand Hyatt Hotel", facility: "Banquet Kitchen", gps: "12.9702, 77.5946", status: "Online", battery: 88, signal: 78, health: "Stable", connectivity: "Strong", firmware: "v3.4.1" },
    { id: "BIN-502", qr: "QR-502", rfid: "RFID-502", organization: "Sector 4 Residential Block", facility: "Gate 2 Yard", gps: "12.9610, 77.6024", status: "Online", battery: 72, signal: 65, health: "Stable", connectivity: "Stable", firmware: "v3.3.8" },
    { id: "BIN-503", qr: "QR-503", rfid: "RFID-503", organization: "City College Cafeteria", facility: "North Patio", gps: "12.9765, 77.5902", status: "Offline", battery: 21, signal: 24, health: "Critical", connectivity: "Offline", firmware: "v3.2.6" }
  ],
  installRequests: [
    { id: "INS-901", org: "North Gate Campus", workflow: "Request → Accept → Navigate → Install", schedule: "Tomorrow · 08:00", status: "Pending" },
    { id: "INS-902", org: "Green Sprout Nursery", workflow: "Configure Connectivity → Calibrate → Diagnostic", schedule: "Tomorrow · 12:00", status: "Accepted" }
  ],
  maintenanceTasks: [
    { id: "MT-110", binId: "BIN-503", issue: "Low battery / signal degradation", schedule: "Today · 10:30", status: "Pending" },
    { id: "MT-111", binId: "BIN-501", issue: "Humidity sensor drift", schedule: "Today · 15:10", status: "In Progress" }
  ],
  workOrders: [
    { id: "WO-301", date: "2026-08-03", tech: "Alex Mercer", issue: "Offline bin after install", action: "Replaced battery", parts: "Battery 12V", duration: "45 min", status: "Completed" },
    { id: "WO-302", date: "2026-08-04", tech: "Ben Stark", issue: "RFID read failure", action: "Repaired antenna", parts: "Antenna module", duration: "30 min", status: "Completed" }
  ],
  parts: [
    { id: "PART-01", name: "Battery 12V", stock: 12, location: "Crate A", status: "Healthy" },
    { id: "PART-02", name: "RFID Antenna", stock: 4, location: "Crate B", status: "Low Stock" },
    { id: "PART-03", name: "Humidity Sensor", stock: 8, location: "Cabinet 2", status: "Healthy" }
  ],
  notifications: [
    { id: "N-01", title: "New installation assigned", detail: "BIN-501 needs hardware, QR and RFID mapping before noon.", severity: "high" },
    { id: "N-02", title: "Critical low battery", detail: "BIN-503 dropped below 25% battery with weak signal.", severity: "critical" },
    { id: "N-03", title: "Firmware update available", detail: "Schedule a field update before next maintenance cycle.", severity: "medium" }
  ]
};

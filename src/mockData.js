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
  ],

  // Waste Collector Staff Data
  collectorTasks: [
    {
      id: "TASK-201",
      collectionPoint: "Hotel Marriott (Kitchen)",
      location: "Main Banquet Kitchen - Ground Floor",
      binId: "BIN-101",
      wasteType: "Organic Food Waste",
      scheduledTime: "08:30 AM",
      priority: "High",
      status: "Completed",
      estQuantity: 180,
      actualQuantity: 195,
      fillLevel: 95,
      binStatus: "Normal",
      notes: "Clean pickup, no contamination observed.",
      specialInstructions: "Enter through back alley gate, ring bell for kitchen staff.",
      lastCollection: "2026-08-03 08:45 AM by Driver E-04",
      stopNumber: 1
    },
    {
      id: "TASK-202",
      collectionPoint: "Sector 7 Residential Gate",
      location: "Disposal Yard near Gate 2",
      binId: "BIN-102",
      wasteType: "Organic Food Waste",
      scheduledTime: "09:45 AM",
      priority: "Medium",
      status: "Assigned",
      estQuantity: 220,
      actualQuantity: null,
      fillLevel: 85,
      binStatus: "Nearly Full",
      notes: "",
      specialInstructions: "Use RFID badge for gate access. Keep gate closed after leaving.",
      lastCollection: "2026-08-03 09:50 AM by Driver E-04",
      stopNumber: 2
    },
    {
      id: "TASK-203",
      collectionPoint: "City College Cafeteria",
      location: "Block C Cafeteria Yard",
      binId: "BIN-103",
      wasteType: "Organic Food Waste",
      scheduledTime: "11:00 AM",
      priority: "High",
      status: "Assigned",
      estQuantity: 150,
      actualQuantity: null,
      fillLevel: 100,
      binStatus: "Full",
      notes: "",
      specialInstructions: "Pickup before lunchtime rush starts at 11:30 AM.",
      lastCollection: "2026-08-03 11:15 AM by Driver E-03",
      stopNumber: 3
    },
    {
      id: "TASK-204",
      collectionPoint: "Downtown Office Hub",
      location: "Loading Dock B - Basement Level",
      binId: "BIN-104",
      wasteType: "Recyclables (Plastics/Paper)",
      scheduledTime: "12:15 PM",
      priority: "Low",
      status: "Assigned",
      estQuantity: 120,
      actualQuantity: null,
      fillLevel: 70,
      binStatus: "Normal",
      notes: "",
      specialInstructions: "Contact Security Officer at dock entry for access.",
      lastCollection: "2026-08-02 12:30 PM by Driver E-04",
      stopNumber: 4
    },
    {
      id: "TASK-205",
      collectionPoint: "Grand Hyatt Hotel",
      location: "South Kitchen Garbage Room",
      binId: "BIN-105",
      wasteType: "Organic Food Waste",
      scheduledTime: "01:30 PM",
      priority: "High",
      status: "Assigned",
      estQuantity: 300,
      actualQuantity: null,
      fillLevel: 110,
      binStatus: "Overflowing",
      notes: "",
      specialInstructions: "Composter bin has high liquid content. Handle carefully.",
      lastCollection: "2026-08-03 01:45 PM by Driver E-04",
      stopNumber: 5
    },
    {
      id: "TASK-206",
      collectionPoint: "Sector 4 Residential Block",
      location: "Main Waste Segregation Shed",
      binId: "BIN-106",
      wasteType: "Organic Food Waste",
      scheduledTime: "02:15 PM",
      priority: "Medium",
      status: "Assigned",
      estQuantity: 280,
      actualQuantity: null,
      fillLevel: 105,
      binStatus: "Overflowing",
      notes: "",
      specialInstructions: "Report any plastic contamination inside composting bins.",
      lastCollection: "2026-08-03 02:00 PM by Driver E-03",
      stopNumber: 6
    }
  ],

  collectorNotifications: [
    {
      id: "NOTIF-01",
      message: "High priority collection added at Grand Hyatt Hotel (TASK-205). Fill level reported at 110%.",
      time: "10 mins ago",
      type: "alert",
      read: false
    },
    {
      id: "NOTIF-02",
      message: "Route updated by dispatch: Sector 4 Residential Block added at stop #6.",
      time: "1 hour ago",
      type: "info",
      read: false
    },
    {
      id: "NOTIF-03",
      message: "Shift started: Morning Shift (06:00 AM - 02:00 PM). Drive safe!",
      time: "3 hours ago",
      type: "system",
      read: true
    }
  ],

  collectorPerformance: {
    tasksCompletedToday: 1,
    totalAssignedToday: 6,
    weeklyCollectionsKg: 1240,
    completionRate: 94.5,
    avgTimePerStopMin: 14.2,
    reportedIssuesCount: 3,
    weeklyTasksCompleted: 34,
    weeklyTasksSkipped: 2
  },

  collectorShift: {
    driverName: "Driver E-04",
    staffId: "GG-COLL-409",
    role: "Senior Waste Collector & Hauler",
    shiftName: "Morning Shift (06:00 AM - 02:00 PM)",
    assignedZone: "Downtown Sector Alpha",
    vehicleId: "EcoTruck Heavy E-04 (Electric)",
    availabilityStatus: "On Duty",
    contactNo: "+1 (555) 019-8800"
  }
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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 180));

const baseResponse = (data) => ({
  success: true,
  ...data,
});

async function safeFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.warn(`Using local fallback for ${endpoint}:`, error.message);
    return null;
  }
}

export async function submitBinRequest(requestData) {
  await mockDelay();
  return baseResponse({
    request: {
      id: `REQ-${Date.now()}`,
      ...requestData,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
  });
}

export async function submitBinIssue(issueData) {
  await mockDelay();
  return baseResponse({
    issue: {
      id: `ISS-${Date.now()}`,
      ...issueData,
      status: 'Open',
      createdAt: new Date().toISOString(),
    },
  });
}

export async function fetchGeneratorDashboard(userId) {
  await mockDelay();
  return baseResponse({
    userId,
    bins: [
      { id: 'BIN-101', location: 'F-7 Sector', category: 'Organic', fillLevel: 62, status: 'Active' },
      { id: 'BIN-102', location: 'G-8 Market', category: 'Mixed Food Waste', fillLevel: 83, status: 'Needs Pickup' },
    ],
    activeIssues: [{ id: 'ISS-91', title: 'Sensor Offline', binId: 'BIN-101', status: 'Open' }],
    requests: [{ id: 'REQ-19', location: 'H-11', category: 'Organic', qty: 2, status: 'Approved', installed: true }],
  });
}

export async function fetchManagementHubData() {
  await mockDelay();
  return baseResponse({
    pendingRequests: [
      { id: 'REQ-21', userId: 'GEN-004', location: 'B-17', category: 'Compostable', qty: 3, contact: '+92 333 1112223', status: 'Pending' },
      { id: 'REQ-22', userId: 'GEN-007', location: 'D-12', category: 'Food Waste', qty: 2, contact: '+92 333 4445556', status: 'Pending' },
    ],
    activeIssues: [{ id: 'ISS-20', binId: 'BIN-009', issueType: 'Bin Broken', location: 'C-5 Parking', status: 'Active' }],
    fullBins: [
      { id: 'PICKUP-18', binId: 'BIN-204', location: 'E-9', fillLevel: 96, timeFullMinutes: 185, urgency: 'High', status: 'Awaiting Routing' },
      { id: 'PICKUP-19', binId: 'BIN-210', location: 'F-7', fillLevel: 92, timeFullMinutes: 142, urgency: 'Medium', status: 'Awaiting Routing' },
    ],
    workforceStatus: { availableTechnicians: 4, busyTechnicians: 2, activeCollectors: 3, totalCollectors: 5 },
  });
}

export async function assignInstallationJob(requestId, technicianId) {
  await mockDelay();
  return baseResponse({ message: `Installation job ${requestId} assigned to technician ${technicianId}`, job: { id: requestId, technicianId, type: 'Installation', status: 'Assigned' } });
}

export async function assignMaintenanceJob(issueId, technicianId) {
  await mockDelay();
  return baseResponse({ message: `Maintenance job ${issueId} assigned to technician ${technicianId}`, job: { id: issueId, technicianId, type: 'Maintenance', status: 'Assigned' } });
}

export async function assignWastePickup(pickupId, collectorId) {
  await mockDelay();
  return baseResponse({ message: `Pickup ${pickupId} assigned to collector ${collectorId}`, assignment: { pickupId, collectorId, status: 'Assigned' } });
}

export async function fetchTechJobs(techId) {
  await mockDelay();
  return baseResponse({ techId, jobs: [{ id: 'JOB-INC-1001', type: 'Installation', title: 'Smart Bin Installation', location: 'F-7 Community Center', status: 'Assigned' }, { id: 'JOB-MNT-1002', type: 'Maintenance', title: 'Sensor Fault', location: 'G-8 Plaza', status: 'Assigned' }] });
}

export async function completeJob(jobId, type, resolutionNotes, iotSerialNumber) {
  await mockDelay();
  return baseResponse({ message: `${type} job ${jobId} completed`, job: { id: jobId, type, status: 'Completed', resolutionNotes, iotSerialNumber } });
}

export async function updateTechDutyStatus(techId, status) {
  await mockDelay();
  return baseResponse({ message: `Technician ${techId} updated to ${status}`, techId, status });
}

export async function fetchCollectorRoute(collectorId) {
  await mockDelay();
  return baseResponse({
    collectorId,
    currentLocation: { lat: 33.6844, lng: 73.0479 },
    pickups: [
      { id: 'PICKUP-18', binId: 'BIN-204', locationName: 'E-9 Green Park', address: 'Sector E-9, Islamabad', lat: 33.6862, lng: 73.0491, fillLevel: 96, timeFullMinutes: 185, urgency: 'High', status: 'Assigned' },
      { id: 'PICKUP-19', binId: 'BIN-210', locationName: 'F-7 Community Center', address: 'F-7 Markaz, Islamabad', lat: 33.6834, lng: 73.045, fillLevel: 92, timeFullMinutes: 142, urgency: 'Medium', status: 'Assigned' },
    ],
  });
}

export async function updateCollectorLocation(collectorId, coordinates) {
  await mockDelay();
  return baseResponse({ message: `Collector ${collectorId} location updated`, collectorId, coordinates });
}

export async function flagBinContamination(pickupId, notes) {
  await mockDelay();
  return baseResponse({ message: 'Contamination flagged and reported to management', contamination: { pickupId, notes, flaggedAt: new Date().toISOString() } });
}

export async function completeWastePickup(pickupId) {
  await mockDelay();
  return baseResponse({ message: `Pickup ${pickupId} completed and delivered to facility`, pickup: { id: pickupId, status: 'Completed' } });
}

export const greenGoldServices = {
  submitBinRequest,
  submitBinIssue,
  fetchGeneratorDashboard,
  fetchManagementHubData,
  assignInstallationJob,
  assignMaintenanceJob,
  assignWastePickup,
  fetchTechJobs,
  completeJob,
  updateTechDutyStatus,
  fetchCollectorRoute,
  updateCollectorLocation,
  flagBinContamination,
  completeWastePickup,
};

export default greenGoldServices;

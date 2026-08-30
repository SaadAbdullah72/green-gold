const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000/api' 
  : '/api';

const getHeaders = () => {
  const token = localStorage.getItem('greengold_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('greengold_token');
    localStorage.removeItem('greengold_user');
  }

  let data = {};
  try {
    data = await res.json();
  } catch (error) {
    data = {};
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'API Request Failed');
  }

  return data;
};

const fetchJson = async (url, options = {}) => {
  try {
    const res = await fetch(url, options);
    return await handleResponse(res);
  } catch (error) {
    const message = error.message || 'Failed to fetch';
    if (message.includes('Failed to fetch')) {
      throw new Error('Backend unavailable. Start the GreenGold backend on port 5000 or use the local mock fallback mode.');
    }
    throw error;
  }
};

export const api = {
  auth: {
    login: async (email, password) => {
      const data = await fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerUser: async (userData) => {
      const data = await fetchJson(`${API_BASE}/auth/register/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerManagement: async (mgmtData) => {
      const data = await fetchJson(`${API_BASE}/auth/register/management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mgmtData)
      });
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerTechnical: async (techData) => {
      const data = await fetchJson(`${API_BASE}/auth/register/technical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techData)
      });
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerCollector: async (collectorData) => {
      const data = await fetchJson(`${API_BASE}/auth/register/collector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectorData)
      });
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerTransporter: async (transporterData) => {
      const data = await fetchJson(`${API_BASE}/auth/register/transporter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transporterData)
      });
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerRecyclingPlant: async (plantData) => {
      const data = await fetchJson(`${API_BASE}/auth/register/recycling-plant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plantData)
      });
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    getMe: async () => {
      const res = await fetchJson(`${API_BASE}/auth/me`, { headers: getHeaders() });
      return res;
    },

    logout: () => {
      localStorage.removeItem('greengold_token');
      localStorage.removeItem('greengold_user');
    }
  },

  requests: {
    create: async (reqData) => {
      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reqData)
      });
      return await handleResponse(res);
    },

    createCollection: async (reqData) => {
      const res = await fetch(`${API_BASE}/requests/collection`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reqData)
      });
      return await handleResponse(res);
    },

    getMy: async () => {
      const res = await fetch(`${API_BASE}/requests/my`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getMyCollection: async () => {
      const res = await fetch(`${API_BASE}/requests/collection/my`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getById: async (id) => {
      const res = await fetch(`${API_BASE}/requests/${id}`, { headers: getHeaders() });
      return await handleResponse(res);
    }
  },

  management: {
    getRequests: async (status = '') => {
      const url = status ? `${API_BASE}/management/requests?status=${status}` : `${API_BASE}/management/requests`;
      const res = await fetch(url, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getCollectors: async () => {
      const res = await fetch(`${API_BASE}/management/collectors`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getCollectionQueue: async () => {
      const res = await fetch(`${API_BASE}/management/collection-queue`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    assignCollector: async (pickupId, collectorId, payload = {}) => {
      const res = await fetch(`${API_BASE}/management/collectors/${pickupId}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ collectorId, pickupId, ...payload })
      });
      return await handleResponse(res);
    },

    approveRequest: async (id) => {
      const res = await fetch(`${API_BASE}/management/requests/${id}/approve`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    declineRequest: async (id, declineReason) => {
      const res = await fetch(`${API_BASE}/management/requests/${id}/decline`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ declineReason })
      });
      return await handleResponse(res);
    },

    getWorkers: async () => {
      const res = await fetch(`${API_BASE}/management/workers`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    assignJob: async (requestId, workerId, binsAssigned = 2) => {
      const res = await fetch(`${API_BASE}/management/jobs/${requestId}/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ workerId, binsAssigned })
      });
      return await handleResponse(res);
    },

    getActiveSites: async () => {
      const res = await fetch(`${API_BASE}/management/active-sites`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    deleteActiveSite: async (siteId) => {
      const res = await fetch(`${API_BASE}/management/active-sites/${siteId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    getDumpRecords: async (query = {}) => {
      const qs = new URLSearchParams(query).toString();
      const url = qs ? `${API_BASE}/management/dump-records?${qs}` : `${API_BASE}/management/dump-records`;
      const res = await fetch(url, { headers: getHeaders() });
      return await handleResponse(res);
    },

    createManualDumpRecord: async (dumpData) => {
      const res = await fetch(`${API_BASE}/management/dump-records`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dumpData)
      });
      return await handleResponse(res);
    },

    separateDumpRecords: async (separationData) => {
      const res = await fetch(`${API_BASE}/management/dump-records/separate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(separationData)
      });
      return await handleResponse(res);
    },

    getTransporters: async () => {
      const res = await fetch(`${API_BASE}/management/transporters`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getRecyclingPlants: async () => {
      const res = await fetch(`${API_BASE}/management/recycling-plants`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    assignTransportJob: async (jobData) => {
      const res = await fetch(`${API_BASE}/management/transport-jobs/assign`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(jobData)
      });
      return await handleResponse(res);
    },

    getAllTransportJobs: async () => {
      const res = await fetch(`${API_BASE}/management/transport-jobs`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getAllRecyclingReports: async () => {
      const res = await fetch(`${API_BASE}/management/recycling-reports`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getWasteTrackingOverview: async () => {
      const res = await fetch(`${API_BASE}/management/waste-tracking`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    purgeUserAndData: async (userIdOrSiteId) => {
      const res = await fetch(`${API_BASE}/management/users/${userIdOrSiteId}/purge`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    deleteDumpRecord: async (recordId) => {
      const res = await fetch(`${API_BASE}/management/dump-records/${recordId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    clearAllDumpRecords: async () => {
      const res = await fetch(`${API_BASE}/management/dump-records`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    deleteTransportJob: async (jobId) => {
      const res = await fetch(`${API_BASE}/management/transport-jobs/${jobId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    clearAllTransportJobs: async () => {
      const res = await fetch(`${API_BASE}/management/transport-jobs`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    deleteRecyclingReport: async (reportId) => {
      const res = await fetch(`${API_BASE}/management/recycling-reports/${reportId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    clearAllRecyclingReports: async () => {
      const res = await fetch(`${API_BASE}/management/recycling-reports`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    deleteCollectorAssignment: async (assignmentId) => {
      const res = await fetch(`${API_BASE}/management/collectors/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    clearAllCollectorAssignments: async () => {
      const res = await fetch(`${API_BASE}/management/collectors/assignments`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  },

  transporter: {
    getMyJobs: async () => {
      const res = await fetch(`${API_BASE}/transporter/jobs`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    acceptJob: async (jobId) => {
      const res = await fetch(`${API_BASE}/transporter/jobs/${jobId}/accept`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    startTransit: async (jobId) => {
      const res = await fetch(`${API_BASE}/transporter/jobs/${jobId}/transit`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    markDelivered: async (jobId) => {
      const res = await fetch(`${API_BASE}/transporter/jobs/${jobId}/delivered`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  },

  recycling: {
    getMyDeliveries: async () => {
      const res = await fetch(`${API_BASE}/recycling/deliveries`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    submitReport: async (reportData) => {
      const res = await fetch(`${API_BASE}/recycling/report`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reportData)
      });
      return await handleResponse(res);
    },

    getMyReports: async () => {
      const res = await fetch(`${API_BASE}/recycling/reports`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    deleteReport: async (reportId) => {
      const res = await fetch(`${API_BASE}/recycling/reports/${reportId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    clearAllReports: async () => {
      const res = await fetch(`${API_BASE}/recycling/reports`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    getStats: async () => {
      const res = await fetch(`${API_BASE}/recycling/stats`, { headers: getHeaders() });
      return await handleResponse(res);
    }
  },

  technical: {
    getJobs: async () => {
      const res = await fetch(`${API_BASE}/technical/jobs`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    acceptJob: async (jobId) => {
      const res = await fetch(`${API_BASE}/technical/jobs/${jobId}/accept`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    declineJob: async (jobId, declineReason = '') => {
      const res = await fetch(`${API_BASE}/technical/jobs/${jobId}/decline`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ declineReason })
      });
      return await handleResponse(res);
    },

    startWork: async (jobId) => {
      const res = await fetch(`${API_BASE}/technical/jobs/${jobId}/start`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    delayJob: async (jobId, delayReason = '') => {
      const res = await fetch(`${API_BASE}/technical/jobs/${jobId}/delay`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ delayReason })
      });
      return await handleResponse(res);
    },

    completeWork: async (jobId, data = {}) => {
      const res = await fetch(`${API_BASE}/technical/jobs/${jobId}/complete`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return await handleResponse(res);
    }
  },

  collector: {
    getMyAssignments: async () => {
      const res = await fetch(`${API_BASE}/collector/assignments`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    acceptAssignment: async (assignmentId) => {
      const res = await fetch(`${API_BASE}/collector/assignments/${assignmentId}/accept`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    completeAssignment: async (assignmentId) => {
      const res = await fetch(`${API_BASE}/collector/assignments/${assignmentId}/complete`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  },

  notifications: {
    getMy: async () => {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    markRead: async (id) => {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      return await handleResponse(res);
    }
  },

  audit: {
    getLogs: async () => {
      const res = await fetch(`${API_BASE}/audit`, { headers: getHeaders() });
      return await handleResponse(res);
    }
  },

  iot: {
    getBins: async () => {
      const res = await fetch(`${API_BASE}/iot/bins`);
      return await handleResponse(res);
    },
    sendTelemetry: async (telemetryData) => {
      const res = await fetch(`${API_BASE}/iot/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryData)
      });
      return await handleResponse(res);
    }
  },

  dumpFacility: {
    getRecords: async (query = {}) => {
      const qs = new URLSearchParams(query).toString();
      const url = qs ? `${API_BASE}/dump-facility/records?${qs}` : `${API_BASE}/dump-facility/records`;
      const res = await fetch(url, { headers: getHeaders() });
      return await handleResponse(res);
    },

    deleteRecord: async (recordId) => {
      const res = await fetch(`${API_BASE}/dump-facility/records/${recordId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    clearAllRecords: async () => {
      const res = await fetch(`${API_BASE}/dump-facility/records`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return await handleResponse(res);
    },

    getAnalytics: async () => {
      const res = await fetch(`${API_BASE}/dump-facility/analytics`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    separateRecords: async (separationData) => {
      const res = await fetch(`${API_BASE}/dump-facility/separate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(separationData)
      });
      return await handleResponse(res);
    },

    getTransporters: async () => {
      const res = await fetch(`${API_BASE}/dump-facility/transporters`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    getRecyclingPlants: async () => {
      const res = await fetch(`${API_BASE}/dump-facility/recycling-plants`, { headers: getHeaders() });
      return await handleResponse(res);
    },

    dispatchTransporter: async (dispatchPayload) => {
      const res = await fetch(`${API_BASE}/dump-facility/dispatch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(dispatchPayload)
      });
      return await handleResponse(res);
    },

    getTransportJobs: async () => {
      const res = await fetch(`${API_BASE}/dump-facility/jobs`, { headers: getHeaders() });
      return await handleResponse(res);
    }
  }
};

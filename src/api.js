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
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'API Request Failed');
  }
  return data;
};

export const api = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerUser: async (userData) => {
      const res = await fetch(`${API_BASE}/auth/register/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerManagement: async (mgmtData) => {
      const res = await fetch(`${API_BASE}/auth/register/management`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mgmtData)
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    registerTechnical: async (techData) => {
      const res = await fetch(`${API_BASE}/auth/register/technical`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techData)
      });
      const data = await handleResponse(res);
      if (data.token) {
        localStorage.setItem('greengold_token', data.token);
        localStorage.setItem('greengold_user', JSON.stringify(data.user));
      }
      return data;
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
      return await handleResponse(res);
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

    getMy: async () => {
      const res = await fetch(`${API_BASE}/requests/my`, { headers: getHeaders() });
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
  }
};

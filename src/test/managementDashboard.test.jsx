import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManagementDashboard from '../components/ManagementDashboard';
import UserDashboard from '../components/UserDashboard';
import { api } from '../api';

vi.mock('../api', () => ({
  api: {
    requests: {
      createCollection: vi.fn().mockResolvedValue({
        success: true,
        request: {
          _id: 'COLL-9001',
          site: 'North Ridge Apartments',
          wasteType: 'Food Waste',
          weightKg: 185,
          status: 'Awaiting Partner'
        }
      }),
      getMy: vi.fn().mockResolvedValue({ requests: [] }),
      getMyCollection: vi.fn().mockResolvedValue({
        requests: [
          {
            id: 'COLL-9001',
            _id: 'COLL-9001',
            site: 'North Ridge Apartments',
            wasteType: 'Food Waste',
            weightKg: 185,
            collectedDate: '2026-08-18',
            status: 'WAITING_COLLECTION',
            notes: 'Need pickup'
          }
        ]
      })
    },
    management: {
      getRequests: vi.fn().mockResolvedValue({ requests: [] }),
      getWorkers: vi.fn().mockResolvedValue({ workers: [] }),
      getCollectors: vi.fn().mockResolvedValue({
        collectors: [
          { _id: 'c-1', fullName: 'Ayesha Khan', employeeId: 'C-201', workerStatus: 'ASSIGNED' },
          { _id: 'c-2', fullName: 'Bilal Shah', employeeId: 'C-202', workerStatus: 'IDLE' }
        ]
      }),
      getCollectionQueue: vi.fn().mockResolvedValue({
        requests: [{
          id: 'COLL-9001',
          _id: 'COLL-9001',
          site: 'Green Park Residence',
          wasteType: 'Food Waste',
          weightKg: 210,
          collectedDate: '2026-08-18',
          status: 'WAITING_COLLECTION',
          assignedPartner: null,
          notes: 'Need collection'
        }]
      }),
      assignCollector: vi.fn().mockResolvedValue({ success: true, message: 'Collector assigned successfully.' }),
      approveRequest: vi.fn(),
      declineRequest: vi.fn(),
      assignJob: vi.fn()
    },
    audit: {
      getLogs: vi.fn().mockResolvedValue({ logs: [] })
    }
  }
}));

describe('ManagementDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    window.alert = vi.fn();
  });

  it('renders with default fallback state when no dashboard props are supplied', () => {
    render(<ManagementDashboard username="Admin User" onLogout={() => {}} />);

    expect(screen.getByText(/System Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Pending Smart Bin Requests/i)).toBeInTheDocument();
  });

  it('shows user-requested collection jobs in the logistics dispatch queue', () => {
    localStorage.setItem('greengold_collection_requests', JSON.stringify([
      {
        id: 'COLL-9001',
        site: 'Green Park Residence',
        weightKg: 210,
        wasteType: 'Food Waste',
        collectedDate: '2026-08-18',
        status: 'Awaiting Partner',
        assignedPartner: null
      }
    ]));

    render(<ManagementDashboard username="Admin User" onLogout={() => {}} activeSubTab="logistics" />);

    expect(screen.getByText('Green Park Residence')).toBeInTheDocument();
    expect(screen.getByText('Food Waste')).toBeInTheDocument();
  });

  it('shows all collectors in the assignment modal and permits selecting a busy collector when needed', async () => {
    render(<ManagementDashboard username="Admin User" onLogout={() => {}} activeSubTab="logistics" />);

    fireEvent.click(screen.getByRole('button', { name: /assign collector/i }));

    const busyCollectorOption = screen.getByRole('option', { name: /Ayesha Khan/i });
    expect(busyCollectorOption).toBeInTheDocument();
    expect(busyCollectorOption).not.toBeDisabled();

    fireEvent.change(screen.getByLabelText(/select available collector/i), {
      target: { value: 'c-1' }
    });

    fireEvent.click(screen.getByRole('button', { name: /assign collector/i }));

    expect(api.management.assignCollector).toHaveBeenCalledWith('COLL-9001', 'c-1', expect.objectContaining({
      siteName: 'Green Park Residence'
    }));
  });
});

describe('UserDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    window.alert = vi.fn();
  });

  it('loads and displays user waste collection requests from the API', async () => {
    render(<UserDashboard />);

    await waitFor(() => {
      expect(api.requests.getMyCollection).toHaveBeenCalled();
      expect(screen.getByText('North Ridge Apartments')).toBeInTheDocument();
      expect(screen.getByText('Food Waste')).toBeInTheDocument();
    });
  });

  it('creates a new waste collection request that can be assigned by management', async () => {
    render(<UserDashboard />);

    fireEvent.click(screen.getByRole('button', { name: /request waste collection/i }));
    fireEvent.change(screen.getByLabelText(/site name/i), { target: { value: 'North Ridge Apartments' } });
    fireEvent.change(screen.getByLabelText(/waste type/i), { target: { value: 'Food Waste' } });
    fireEvent.change(screen.getByLabelText(/estimated weight/i), { target: { value: '185' } });
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => {
      const queuedRequests = JSON.parse(localStorage.getItem('greengold_collection_requests') || '[]');
      expect(queuedRequests).toHaveLength(1);
      expect(queuedRequests[0]).toMatchObject({
        site: 'North Ridge Apartments',
        wasteType: 'Food Waste',
        status: 'Awaiting Partner'
      });
    });
  });
});

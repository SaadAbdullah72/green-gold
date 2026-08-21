// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import TechnicianDashboard from './TechnicianDashboard';
import RequestProgressTracker from './RequestProgressTracker';
import { api } from '../api';

beforeEach(() => {
  localStorage.setItem('greengold_user', JSON.stringify({
    id: 'tech-user-1',
    fullName: 'Aisha Khan',
    role: 'ROLE_TECHNICIAN'
  }));
  localStorage.setItem('greengold_token', 'token-123');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TechnicianDashboard', () => {
  it('renders the simplified technical dispatch shell with queue and history navigation', () => {
    render(<TechnicianDashboard onLogout={() => {}} />);

    expect(screen.getByText('GreenGold OS')).toBeInTheDocument();
    expect(screen.getByText('Assigned Jobs Queue')).toBeInTheDocument();
    expect(screen.getByText('Completed Jobs History')).toBeInTheDocument();
    expect(screen.getByText(/Technical Worker Dispatch Console/i)).toBeInTheDocument();
  });

  it('loads assigned jobs from the API and displays the assigned job card with a live timer', async () => {
    const getJobsSpy = vi.spyOn(api.technical, 'getJobs').mockResolvedValue({
      success: true,
      jobs: [{
        _id: 'job-1',
        status: 'ASSIGNED',
        binsAssigned: 2,
        responseDeadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        request: {
          requestNumber: 'REQ-204',
          organizationName: 'Northwind Foods',
          address: 'Plot 18, Blue Area',
          city: 'Islamabad',
          town: 'F-8',
          contactPerson: 'Customer Portal',
          phone: '+92 300 1234567'
        }
      }]
    });

    render(<TechnicianDashboard onLogout={() => {}} />);

    expect(await screen.findByText(/REQ-204/i)).toBeInTheDocument();
    expect(screen.getByText('Northwind Foods')).toBeInTheDocument();
    expect(screen.getByText(/Timer:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accept Assignment/i })).toBeInTheDocument();
    expect(getJobsSpy).toHaveBeenCalled();
  });

  it('keeps the technician lifecycle in the requested order: viewed, accepted, destination, completed', () => {
    render(<RequestProgressTracker status="VIEWED" variant="technical" interactive />);

    expect(screen.getByRole('button', { name: /Viewed request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Accepted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reached destination/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Completed work/i })).toBeInTheDocument();
  });

  it('accepts an assignment through the backend API', async () => {
    vi.spyOn(api.technical, 'getJobs').mockResolvedValue({
      success: true,
      jobs: [{
        _id: 'job-1',
        status: 'ASSIGNED',
        binsAssigned: 2,
        responseDeadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        request: {
          requestNumber: 'REQ-205',
          organizationName: 'City Care',
          address: 'Plot 7, G-10',
          city: 'Islamabad',
          town: 'G-10',
          contactPerson: 'Customer Portal',
          phone: '+92 300 8889999'
        }
      }]
    });
    const acceptSpy = vi.spyOn(api.technical, 'acceptJob').mockResolvedValue({ success: true });

    render(<TechnicianDashboard onLogout={() => {}} />);

    const acceptButton = await screen.findByRole('button', { name: /Accept Assignment/i });
    fireEvent.click(acceptButton);

    expect(acceptSpy).toHaveBeenCalledWith('job-1');
  });
});

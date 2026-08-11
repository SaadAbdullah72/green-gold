// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import TechnicianDashboard from './TechnicianDashboard';

describe('TechnicianDashboard', () => {
  it('renders the field operations dashboard shell', () => {
    render(<TechnicianDashboard onLogout={() => {}} />);

    expect(screen.getByText('Field Operations Command Center')).toBeInTheDocument();
    expect(screen.getByText('Assigned Jobs & Details')).toBeInTheDocument();
    expect(screen.getByText('Smart Bin Inventory')).toBeInTheDocument();
  });
});

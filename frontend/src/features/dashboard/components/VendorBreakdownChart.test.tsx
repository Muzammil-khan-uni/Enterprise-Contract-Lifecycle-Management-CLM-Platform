import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VendorBreakdownChart } from './VendorBreakdownChart';

describe('VendorBreakdownChart', () => {
  it('shows an empty-state message when there is no vendor data', () => {
    render(<VendorBreakdownChart data={[]} />);
    expect(screen.getByText('No vendor contracts yet.')).toBeInTheDocument();
  });

  it('does not show the empty-state message when vendor data is present', () => {
    render(<VendorBreakdownChart data={[{ vendorName: 'Acme Supplies', count: 12 }]} />);
    expect(screen.queryByText('No vendor contracts yet.')).not.toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValueByTypeChart } from './ValueByTypeChart';

describe('ValueByTypeChart', () => {
  it('shows an empty-state message when there is no value data', () => {
    render(<ValueByTypeChart data={[]} />);
    expect(screen.getByText('No contract value data yet.')).toBeInTheDocument();
  });

  it('does not show the empty-state message when value data is present', () => {
    render(<ValueByTypeChart data={[{ contractType: 'Vendor', totalValue: 500000, count: 12 }]} />);
    expect(screen.queryByText('No contract value data yet.')).not.toBeInTheDocument();
  });
});

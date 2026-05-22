import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScenarioParameterForm } from '@/components/scenarios/scenario-parameter-form';
import { apiClient } from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('ScenarioParameterForm', () => {
  const mockOnSimulationStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with all required fields', () => {
    render(<ScenarioParameterForm onSimulationStart={mockOnSimulationStart} />);

    expect(screen.getByLabelText(/Disruption Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByText(/Severity Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Include sustainability/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Simulation/i })).toBeInTheDocument();
  });

  it('should show validation error when location is empty', async () => {
    render(<ScenarioParameterForm onSimulationStart={mockOnSimulationStart} />);

    const submitButton = screen.getByRole('button', { name: /Run Simulation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Location is required')).toBeInTheDocument();
    });

    expect(mockOnSimulationStart).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const mockResult = {
      scenarioId: 'test-123',
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResult);

    render(<ScenarioParameterForm onSimulationStart={mockOnSimulationStart} />);

    // Fill in location
    const locationInput = screen.getByLabelText(/Location/i);
    fireEvent.change(locationInput, { target: { value: 'Shanghai, China' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Run Simulation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        '/scenarios/simulate',
        expect.objectContaining({
          location: 'Shanghai, China',
          disruptionType: 'SUPPLIER_FAILURE',
          severity: 'MEDIUM',
        })
      );
    });

    expect(mockOnSimulationStart).toHaveBeenCalledWith(mockResult);
  });

  it('should disable form when disabled prop is true', () => {
    render(<ScenarioParameterForm onSimulationStart={mockOnSimulationStart} disabled={true} />);

    const locationInput = screen.getByLabelText(/Location/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /Run Simulation/i,
    }) as HTMLButtonElement;

    expect(locationInput.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });
});

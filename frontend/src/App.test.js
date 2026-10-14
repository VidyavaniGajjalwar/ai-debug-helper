import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock fetch globally
global.fetch = jest.fn();

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders AI Debugging Helper title', () => {
    render(<App />);
    expect(screen.getByText('AI Debugging Helper')).toBeInTheDocument();
  });

  test('renders language selector', () => {
    render(<App />);
    expect(screen.getByLabelText('Language:')).toBeInTheDocument();
  });

  test('renders analyze button', () => {
    render(<App />);
    expect(screen.getByText('Analyze')).toBeInTheDocument();
  });

  test('shows error when analyzing empty code', async () => {
    render(<App />);
    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText(/No code to analyze/i)).toBeInTheDocument();
    });
  });

  test('calls API when code is provided', async () => {
    const mockResponse = {
      errors: [],
      explanation: 'No syntax errors found',
      suggestions: 'Your code looks good!',
      lineNumbers: []
    };
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<App />);
    
    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('renders home and chatbot buttons', () => {
    render(<App />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Chatbot')).toBeInTheDocument();
  });
});

import { vi } from 'vitest';

export const mockUseAuth = vi.fn(() => ({
  user:     null as any,
  login:    vi.fn(),
  logout:   vi.fn(),
  register: vi.fn(),
  loading:  false,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

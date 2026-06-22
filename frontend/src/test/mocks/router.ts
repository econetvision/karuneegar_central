import { vi } from 'vitest';
import React from 'react';

export const mockNavigate  = vi.fn();
export const mockUseParams = vi.fn(() => ({} as Record<string, string>));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams:   mockUseParams,
    Link: ({ to, children, ...props }: { to: string; children?: React.ReactNode; [k: string]: unknown }) =>
      React.createElement('a', { href: to, ...props }, children),
  };
});

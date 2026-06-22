import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mocks must be hoisted before component import
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthImpl(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate:    () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'auth.welcomeBack':      'Welcome Back',
        'auth.signInSubtitle':   'Sign in to continue',
        'auth.emailOrUsername':  'Email or Username',
        'auth.emailPlaceholder': 'Enter email or username',
        'auth.password':         'Password',
        'auth.passwordPlaceholder': 'Enter password',
        'auth.signIn':           'Sign In',
        'auth.signingIn':        'Signing in…',
      };
      return map[key] ?? key;
    },
    i18n: { changeLanguage: vi.fn() },
  }),
}));

const mockNavigate  = vi.fn();
let mockAuthImpl    = vi.fn(() => ({ user: null, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));

import Login from '../../pages/Login';

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthImpl = vi.fn(() => ({
      user: null, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false,
    }));
  });

  it('renders email/username and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Enter email or username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has link to register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /join now/i })).toBeInTheDocument();
  });

  it('calls login with entered credentials on submit', async () => {
    const mockLogin = vi.fn().mockResolvedValueOnce(undefined);
    mockAuthImpl = vi.fn(() => ({
      user: null, login: mockLogin, logout: vi.fn(), register: vi.fn(), loading: false,
    }));
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Enter email or username'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Enter password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    const mockLogin = vi.fn().mockRejectedValueOnce({
      response: { data: { error: 'Invalid credentials' } },
    });
    mockAuthImpl = vi.fn(() => ({
      user: null, login: mockLogin, logout: vi.fn(), register: vi.fn(), loading: false,
    }));
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Enter email or username'), 'bad@example.com');
    await user.type(screen.getByPlaceholderText('Enter password'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    const mockLogin = vi.fn(() => new Promise(() => {}));
    mockAuthImpl = vi.fn(() => ({
      user: null, login: mockLogin, logout: vi.fn(), register: vi.fn(), loading: false,
    }));
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Enter email or username'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Enter password'), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});

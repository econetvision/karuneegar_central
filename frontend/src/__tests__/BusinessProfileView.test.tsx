import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthImpl(),
}));

vi.mock('../../api/client', () => ({
  default:   mockApiImpl,
  uploadUrl: (fn: string) => `http://test.local/uploads/${fn}`,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

let mockAuthImpl = vi.fn(() => ({
  user: null as any, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false,
}));

const mockApiImpl = {
  get:    vi.fn(),
  post:   vi.fn(),
  put:    vi.fn(),
  delete: vi.fn(),
  patch:  vi.fn(),
};

const mockBusiness = {
  id: 1, user_id: 1,
  company_name:   'Acme Corp',
  tagline:        'Building the future',
  category:       'IT & Technology',
  city:           'Chennai',
  state:          'Tamil Nadu',
  phone:          '+914412345678',
  email:          'acme@example.com',
  website:        'https://acme.com',
  logo_filename:  null,
  cover_filename: null,
  description:    'A great tech company',
  employees:      '11–50',
  established_year: 2015,
  owner_username: 'user1',
  owner_name:     'User One',
};

const mockAds = [
  { id: 1, business_id: 1, photo_filename: 'ad1.jpg', title: 'Grand Sale', caption: 'Up to 50% off', active: true, created_at: new Date().toISOString() },
];

import BusinessProfileView from '../../pages/BusinessProfileView';

const renderView = (id = '1') =>
  render(
    <MemoryRouter initialEntries={[`/business/${id}`]}>
      <Routes>
        <Route path="/business/:id" element={<BusinessProfileView />} />
      </Routes>
    </MemoryRouter>
  );

describe('BusinessProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiImpl.get.mockImplementation((url: string) => {
      if (url.includes('/ads')) return Promise.resolve({ data: { ads: mockAds } });
      return Promise.resolve({ data: { business: mockBusiness } });
    });
  });

  it('shows loading spinner initially', () => {
    mockApiImpl.get.mockImplementation(() => new Promise(() => {}));
    mockAuthImpl = vi.fn(() => ({ user: null, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders business name and tagline', async () => {
    mockAuthImpl = vi.fn(() => ({ user: { id: 99 }, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Building the future')).toBeInTheDocument();
    });
  });

  it('renders contact info', async () => {
    mockAuthImpl = vi.fn(() => ({ user: { id: 99 }, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('+914412345678')).toBeInTheDocument();
    });
  });

  it('renders advertisement title', async () => {
    mockAuthImpl = vi.fn(() => ({ user: { id: 99 }, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Grand Sale')).toBeInTheDocument();
    });
  });

  it('shows Add Advertisement button for owner', async () => {
    mockAuthImpl = vi.fn(() => ({ user: { id: 1 }, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText(/add advertisement/i)).toBeInTheDocument();
    });
  });

  it('hides Add Advertisement button for non-owner', async () => {
    mockAuthImpl = vi.fn(() => ({ user: { id: 99 }, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
    expect(screen.queryByText(/add advertisement/i)).not.toBeInTheDocument();
  });

  it('shows not-found state when business is null', async () => {
    mockApiImpl.get.mockResolvedValue({ data: { business: null } });
    mockAuthImpl = vi.fn(() => ({ user: null, login: vi.fn(), logout: vi.fn(), register: vi.fn(), loading: false }));
    renderView();
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});

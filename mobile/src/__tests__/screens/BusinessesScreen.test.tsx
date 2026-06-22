import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../api/client',           () => require('../../__mocks__/api'));
jest.mock('../../contexts/AuthContext', () => require('../../__mocks__/AuthContext'));

import mockApi from '../../__mocks__/api';
import BusinessesScreen from '../../screens/BusinessesScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };

const mockBusinesses = [
  { id: 1, company_name: 'Acme Corp',  tagline: 'Tech company',  category: 'IT & Technology',   city: 'Chennai',     logo_filename: null },
  { id: 2, company_name: 'Bakers Ltd', tagline: 'Baked goods',   category: 'Food & Hospitality', city: 'Coimbatore',  logo_filename: null },
];

describe('BusinessesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockApi.get as jest.Mock).mockResolvedValue({
      data: { businesses: mockBusinesses, total: 2, pages: 1, page: 1 },
    });
  });

  it('renders Create Business and Create Ads action cards', async () => {
    const { getByText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    await waitFor(() => {
      expect(getByText('Create Business')).toBeTruthy();
      expect(getByText('Create Ads')).toBeTruthy();
    });
  });

  it('navigates to CreateBusiness when card is pressed', async () => {
    const { getByText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    await waitFor(() => getByText('Create Business'));
    fireEvent.press(getByText('Create Business'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateBusiness');
  });

  it('navigates to CreateBusinessAd when Create Ads is pressed', async () => {
    const { getByText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    await waitFor(() => getByText('Create Ads'));
    fireEvent.press(getByText('Create Ads'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateBusinessAd');
  });

  it('renders list of businesses', async () => {
    const { getByText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    await waitFor(() => {
      expect(getByText('Acme Corp')).toBeTruthy();
      expect(getByText('Bakers Ltd')).toBeTruthy();
    });
  });

  it('navigates to BusinessProfile when a business is pressed', async () => {
    const { getByText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    await waitFor(() => getByText('Acme Corp'));
    fireEvent.press(getByText('Acme Corp'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('BusinessProfile', { id: 1 });
  });

  it('shows empty state when no businesses', async () => {
    (mockApi.get as jest.Mock).mockResolvedValue({
      data: { businesses: [], total: 0, pages: 0, page: 1 },
    });
    const { findByText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    expect(await findByText(/no businesses/i)).toBeTruthy();
  });

  it('renders search input', () => {
    const { getByPlaceholderText } = render(
      <BusinessesScreen navigation={mockNavigation} route={{}} />
    );
    expect(getByPlaceholderText(/search businesses/i)).toBeTruthy();
  });
});

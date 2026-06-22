import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('../../api/client',        () => require('../../__mocks__/api'));
jest.mock('../../contexts/AuthContext', () => require('../../__mocks__/AuthContext'));

import { useAuth } from '../../__mocks__/AuthContext';
import LoginScreen from '../../screens/LoginScreen';

const mockNavigation = { navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() };

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: null, login: jest.fn(), logout: jest.fn(), register: jest.fn(), loading: false, token: null,
    });
  });

  it('renders email/username and password inputs', () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} route={{}} />
    );
    expect(getByPlaceholderText(/email or username/i)).toBeTruthy();
    expect(getByPlaceholderText(/enter password/i)).toBeTruthy();
  });

  it('renders Sign In button', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{}} />
    );
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('calls login with entered credentials on press', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    (useAuth as jest.Mock).mockReturnValue({
      user: null, login: mockLogin, logout: jest.fn(), register: jest.fn(), loading: false, token: null,
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{}} />
    );

    fireEvent.changeText(getByPlaceholderText(/email or username/i), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText(/enter password/i), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('navigates to Register screen when Join Now is pressed', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{}} />
    );
    fireEvent.press(getByText(/join now/i));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('renders community tagline text', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} route={{}} />
    );
    expect(getByText('Welcome Back')).toBeTruthy();
  });
});

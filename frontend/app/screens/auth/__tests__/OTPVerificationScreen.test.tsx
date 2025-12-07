import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert } from 'react-native';

// Mock the useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    verifyOTP: jest.fn().mockResolvedValue({}),
    forgotPassword: jest.fn().mockResolvedValue({}),
  }),
}));

// Mock the usePerformance hook
jest.mock('@/hooks/usePerformance', () => ({
  usePerformance: () => ({
    trackCustom: jest.fn(),
  }),
}));

// Mock the navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

// Mock Alert
jest.spyOn(Alert, 'alert');

// Import the component after setting up mocks
import OTPVerificationScreen from '../OTPVerificationScreen';

describe('OTPVerificationScreen', () => {
  const Stack = createStackNavigator();
  
  const renderComponent = (routeParams = {}) => {
    return render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="OTPVerification" 
            component={OTPVerificationScreen} 
            initialParams={{
              email: 'test@example.com',
              type: 'forgot_password',
              ...routeParams
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByDisplayValue } = renderComponent();
    
    expect(getByText('Enter Verification Code')).toBeTruthy();
    expect(getByText(/We've sent a 6-digit verification code to/)).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
    
    // Check OTP input fields
    const otpInputs = ['', '', '', '', '', ''];
    otpInputs.forEach((_, index) => {
      const input = getByDisplayValue('');
      expect(input).toBeTruthy();
    });
  });

  it('allows entering OTP', () => {
    const { getAllByDisplayValue } = renderComponent();
    
    // Simulate entering OTP
    const otpInputs = getAllByDisplayValue('');
    fireEvent.changeText(otpInputs[0], '1');
    fireEvent.changeText(otpInputs[1], '2');
    fireEvent.changeText(otpInputs[2], '3');
    
    // Check if inputs are updated
    expect(getAllByDisplayValue('1').length).toBe(1);
    expect(getAllByDisplayValue('2').length).toBe(1);
    expect(getAllByDisplayValue('3').length).toBe(1);
  });

  it('handles OTP verification', async () => {
    const { getByText, getAllByDisplayValue } = renderComponent();
    
    // Enter OTP
    const otpInputs = getAllByDisplayValue('');
    const otp = '123456';
    otp.split('').forEach((digit, index) => {
      fireEvent.changeText(otpInputs[index], digit);
    });
    
    // Click verify button
    fireEvent.press(getByText('Verify Code'));
    
    // Check if verifyOTP was called with correct parameters
    await waitFor(() => {
      const { verifyOTP } = require('@/hooks/useAuth').useAuth();
      expect(verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('handles resend OTP', async () => {
    const { getByText } = renderComponent();
    
    // Click resend link
    fireEvent.press(getByText('Resend'));
    
    // Check if forgotPassword was called
    await waitFor(() => {
      const { forgotPassword } = require('@/hooks/useAuth').useAuth();
      expect(forgotPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows error for incomplete OTP', () => {
    const { getByText } = renderComponent();
    
    // Click verify without entering OTP
    fireEvent.press(getByText('Verify Code'));
    
    // Check if alert is shown
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid OTP',
      'Please enter a 6-digit verification code.'
    );
  });

  it('navigates back when back link is pressed', () => {
    const { getByText } = renderComponent();
    
    // Click back link
    fireEvent.press(getByText('Go Back'));
    
    // Check if goBack was called
    expect(mockGoBack).toHaveBeenCalled();
  });
});

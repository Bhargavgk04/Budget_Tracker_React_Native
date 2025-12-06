import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to crash reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 justify-center items-center bg-background px-6">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          
          <Text className="text-2xl font-bold text-textPrimary mt-4 text-center">
            Oops! Something went wrong
          </Text>
          
          <Text className="text-base text-textSecondary mt-2 text-center">
            We're sorry for the inconvenience. The app encountered an unexpected error.
          </Text>
          
          <TouchableOpacity
            onPress={this.handleRetry}
            className="bg-primary px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold text-base">
              Try Again
            </Text>
          </TouchableOpacity>
          
          {__DEV__ && (
            <View className="mt-6 p-4 bg-gray-100 rounded-lg">
              <Text className="text-sm text-gray-600 font-mono">
                {this.state.error && this.state.error.toString()}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
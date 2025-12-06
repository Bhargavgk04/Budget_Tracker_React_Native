import React, { useEffect } from "react";
import { StatusBar, Platform, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "./app/context/AuthContext";
import { TransactionProvider } from "./app/context/TransactionContext";
import AppNavigator from "./app/navigation/AppNavigator";
import ErrorBoundary from "./app/components/common/ErrorBoundary";
import {
  initializeFlipperPerformance,
  trackMemoryUsage,
} from "./app/utils/flipper";
import { performanceMonitor } from "./app/utils/performance";
import { apiService } from "./app/services/ApiService";
import { JSX } from "react/jsx-runtime";

export default function App(): JSX.Element {
  useEffect(() => {
    // Initialize services
    const initializeApp = async () => {
      try {
        // Initialize API service (fast, no await needed)
        apiService
          .initialize()
          .catch((err) => console.error("API service init error:", err));

        // Disable performance monitoring for faster load times
        // Uncomment below if you need performance tracking:
        // setTimeout(() => {
        //   initializeFlipperPerformance();
        //   performanceMonitor.startScreenLoad("App");
        //   performanceMonitor.endScreenLoad("App");
        // }, 5000);
      } catch (error) {
        console.error("App initialization error:", error);
      }
    };

    initializeApp();

    // Disable memory tracking for faster performance
    // Uncomment below if you need memory tracking:
    // const memoryInterval = setInterval(() => {
    //   trackMemoryUsage();
    //   performanceMonitor.trackMemoryUsage();
    // }, 60000);
    // return () => clearInterval(memoryInterval);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <AuthProvider>
          <TransactionProvider>
            <NavigationContainer
              theme={{
                dark: false,
                colors: {
                  primary: '#6366F1',
                  background: '#F8FAFC',
                  card: '#FFFFFF',
                  text: '#1E293B',
                  border: '#E2E8F0',
                  notification: '#6366F1',
                },
              }}
              fallback={
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text>Loading...</Text>
                </View>
              }
            >
              <StatusBar 
                barStyle='dark-content'
                backgroundColor="#F8FAFC" 
                translucent={false} 
              />
              <AppNavigator />
            </NavigationContainer>
          </TransactionProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

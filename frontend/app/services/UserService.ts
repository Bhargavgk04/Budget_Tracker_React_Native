import API from '@/config/api.config';

export interface UserProfile {
  name: string;
  email: string;
  currency: string;
  preferences: {
    theme: string;
    notifications: {
      budgetAlerts: boolean;
      friendRequests: boolean;
      settlements: boolean;
      recurring: boolean;
    };
    biometric: boolean;
    language: string;
    dateFormat: string;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ExportData {
  user: UserProfile;
  transactions: any[];
  categories: any[];
  exportDate: string;
  totalTransactions: number;
  totalCategories: number;
}

class UserService {
  // Get user profile
  static async getProfile(): Promise<{ success: boolean; data: UserProfile }> {
    try {
      const response = await API.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Reset all user data (transactions, categories, budgets) but keep the account
  static async resetUserData(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await API.post('/user/reset-data');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; data: UserProfile }> {
    try {
      const response = await API.put('/user/profile', updates);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Upload profile picture
  static async uploadProfilePicture(imageFile: File): Promise<{ success: boolean; data: any }> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', imageFile);

      const response = await API.post('/user/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete profile picture
  static async deleteProfilePicture(): Promise<{ success: boolean }> {
    try {
      const response = await API.delete('/user/profile/picture');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  static async changePassword(passwordData: ChangePasswordData): Promise<{ success: boolean }> {
    try {
      const response = await API.put('/user/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Export user data
  static async exportData(format: 'json' | 'csv' = 'json'): Promise<ExportData> {
    try {
      const response = await API.get(`/user/export?format=${format}`);
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  // Export user data as CSV download
  static async exportDataAsCSV(): Promise<Blob> {
    try {
      const response = await API.get('/user/export?format=csv', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete user account
  static async deleteAccount(password: string): Promise<{ success: boolean }> {
    try {
      const response = await API.delete('/user/account', {
        data: { password },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getUserStats(): Promise<{ success: boolean; data: any }> {
    try {
      const response = await API.get('/user/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;

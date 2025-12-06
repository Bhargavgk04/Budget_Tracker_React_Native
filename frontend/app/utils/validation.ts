/**
 * Validation utilities for forms and data
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const Validators = {
  /**
   * Validate amount is positive number
   */
  amount: (value: any): string | null => {
    if (!value) return 'Amount is required';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Amount must be a valid number';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > 10000000) return 'Amount is too large';
    return null;
  },

  /**
   * Validate email format
   */
  email: (value: string): string | null => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Invalid email format';
    return null;
  },

  /**
   * Validate UID format
   */
  uid: (value: string): string | null => {
    if (!value) return 'UID is required';
    if (value.length < 3) return 'UID must be at least 3 characters';
    if (value.length > 50) return 'UID is too long';
    return null;
  },

  /**
   * Validate required field
   */
  required: (value: any, fieldName: string = 'This field'): string | null => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Validate split configuration
   */
  split: (amount: number, splitType: string, participants: any[]): string[] => {
    const errors: string[] = [];

    if (!amount || amount <= 0) {
      errors.push('Amount must be positive');
    }

    if (!['equal', 'percentage', 'custom'].includes(splitType)) {
      errors.push('Invalid split type');
    }

    if (!participants || participants.length === 0) {
      errors.push('At least one participant is required');
    }

    if (participants) {
      const totalShares = participants.reduce((sum, p) => sum + (p.share || 0), 0);
      if (Math.abs(totalShares - amount) > 0.01) {
        errors.push(`Split amounts must sum to ${amount.toFixed(2)}`);
      }

      if (splitType === 'percentage') {
        const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          errors.push('Percentages must sum to 100');
        }
      }

      participants.forEach((p, index) => {
        if (p.share < 0) {
          errors.push(`Participant ${index + 1} share cannot be negative`);
        }
        if (splitType === 'percentage' && (p.percentage < 0 || p.percentage > 100)) {
          errors.push(`Participant ${index + 1} percentage must be between 0 and 100`);
        }
      });
    }

    return errors;
  },

  /**
   * Validate group name
   */
  groupName: (value: string): string | null => {
    if (!value || !value.trim()) return 'Group name is required';
    if (value.length < 2) return 'Group name must be at least 2 characters';
    if (value.length > 100) return 'Group name is too long';
    return null;
  },

  /**
   * Validate member selection
   */
  members: (members: string[]): string | null => {
    if (!members || members.length === 0) {
      return 'At least one member is required';
    }
    if (members.length > 50) {
      return 'Too many members (maximum 50)';
    }
    return null;
  },

  /**
   * Validate settlement amount
   */
  settlementAmount: (amount: number, maxAmount?: number): string | null => {
    const amountError = Validators.amount(amount);
    if (amountError) return amountError;

    if (maxAmount && amount > maxAmount) {
      return `Amount cannot exceed ${maxAmount.toFixed(2)}`;
    }

    return null;
  },

  /**
   * Validate date is not in future
   */
  pastDate: (date: Date): string | null => {
    if (!date) return 'Date is required';
    if (date > new Date()) return 'Date cannot be in the future';
    return null;
  },

  /**
   * Validate notes length
   */
  notes: (value: string): string | null => {
    if (value && value.length > 500) {
      return 'Notes are too long (maximum 500 characters)';
    }
    return null;
  }
};

/**
 * Validate form data
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => string | null>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const error = rules[field](data[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors: Record<string, string>): string => {
  return Object.values(errors).join('\n');
};

/**
 * Utility class for formatting and validation
 */
export class ValidationUtils {
  /**
   * Format currency value
   */
  static formatCurrency(value: number, currency: string = '₹'): string {
    if (typeof value !== 'number' || isNaN(value)) return `${currency}0.00`;
    return `${currency}${Math.abs(value).toFixed(2)}`;
  }

  /**
   * Format date
   */
  static formatDate(date: Date, pattern?: string): string {
    if (!date || !(date instanceof Date)) return '';
    if (pattern === 'YYYY-MM-DD') {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format date and time
   */
  static formatDateTime(date: Date): string {
    if (!date || !(date instanceof Date)) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Format percentage
   */
  static formatPercentage(value: number): string {
    if (isNaN(value)) return '0%';
    return `${value.toFixed(1)}%`;
  }

  /**
   * Parse currency string to number
   */
  static parseCurrency(value: string): number {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Validate and format phone number
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Capitalize first letter
   */
  static capitalizeFirst(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Format number with commas
   */
  static formatNumber(value: number): string {
    if (isNaN(value)) return '0';
    return value.toLocaleString('en-US');
  }

  /**
   * Calculate percentage given value and total
   */
  static calculatePercentage(value: number, total: number): number {
    if (!total || total <= 0) return 0;
    return (value / total) * 100;
  }

  /**
   * Quick boolean validator for amounts
   */
  static validateAmount(value: number): boolean {
    if (isNaN(value)) return false;
    if (value <= 0) return false;
    if (value > 10000000) return false;
    return true;
  }

  /**
   * Validate arbitrary data using a schema of field validators
   */
  static validateData(
    schema: Record<string, (value: any) => string | null>,
    data: Record<string, any>
  ): { isValid: boolean; errors: Record<string, string>; value: Record<string, any>; error?: string } {
    const errors: Record<string, string> = {};
    const value: Record<string, any> = { ...data };

    Object.keys(schema || {}).forEach((field) => {
      const validator = schema[field];
      const error = validator(value[field]);
      if (error) {
        errors[field] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      value,
      error: Object.values(errors)[0],
    };
  }
}

/**
 * Transaction validation schemas
 */
export const transactionValidationSchemas = {
  create: {
    amount: Validators.amount,
    category: (v: any) => Validators.required(v, 'Category'),
    type: (v: any) => Validators.required(v, 'Type'),
    paymentMode: (v: any) => Validators.required(v, 'Payment mode'),
    date: Validators.pastDate,
    notes: Validators.notes,
  },
  update: {
    // For updates, validate only provided fields
    amount: (v: any) => (v === undefined ? null : Validators.amount(v)),
    category: (v: any) => (v === undefined ? null : Validators.required(v, 'Category')),
    type: (v: any) => (v === undefined ? null : Validators.required(v, 'Type')),
    paymentMode: (v: any) => (v === undefined ? null : Validators.required(v, 'Payment mode')),
    date: (v: any) => (v === undefined ? null : Validators.pastDate(v)),
    notes: (v: any) => (v === undefined ? null : Validators.notes(v)),
  },
};

export default Validators;

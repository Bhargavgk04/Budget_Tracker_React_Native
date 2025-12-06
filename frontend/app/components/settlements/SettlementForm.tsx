import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SettlementFormProps {
  friendId: string;
  suggestedAmount?: number;
  onSubmit: (data: SettlementData) => void;
  onCancel: () => void;
}

interface SettlementData {
  amount: number;
  paymentMethod: string;
  notes: string;
  date: Date;
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'money' },
  { id: 'upi', label: 'UPI', icon: 'phone-android' },
  { id: 'card', label: 'Card', icon: 'credit-card' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: 'account-balance' },
  { id: 'other', label: 'Other', icon: 'more-horiz' },
];

export const SettlementForm: React.FC<SettlementFormProps> = ({
  friendId,
  suggestedAmount = 0,
  onSubmit,
  onCancel
}) => {
  const [amount, setAmount] = useState(suggestedAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    Alert.alert(
      'Confirm Settlement',
      `Record a payment of ₹${amountNum.toFixed(2)} via ${PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await onSubmit({
                amount: amountNum,
                paymentMethod,
                notes: notes.trim(),
                date
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to record settlement');
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <MaterialIcons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Settlement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {suggestedAmount > 0 && (
            <TouchableOpacity
              style={styles.suggestedButton}
              onPress={() => setAmount(suggestedAmount.toString())}
            >
              <Text style={styles.suggestedButtonText}>
                Use suggested: ₹{suggestedAmount.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethod,
                  paymentMethod === method.id && styles.paymentMethodActive
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <MaterialIcons
                  name={method.icon as any}
                  size={24}
                  color={paymentMethod === method.id ? '#007AFF' : '#64748B'}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method.id && styles.paymentMethodTextActive
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <MaterialIcons name="calendar-today" size={20} color="#64748B" />
            <Text style={styles.dateButtonText}>
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add a note about this payment..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Recording...' : 'Record Settlement'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
          maximumDate={new Date()}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: '#1E293B',
  },
  suggestedButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  suggestedButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethod: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  paymentMethodActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  paymentMethodTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
  },
  notesInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettlementForm;

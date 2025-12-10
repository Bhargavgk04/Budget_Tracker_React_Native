import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { SplitFormData, Friend } from "@/types";
import { SplitService } from "@/services/SplitService";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "@/utils/formatting";

interface EnhancedSplitConfigProps {
  totalAmount: number;
  participants: Friend[];
  splitType: "equal" | "percentage" | "custom";
  onSplitChange: (split: SplitFormData) => void;
  paidBy: string;
}

export const EnhancedSplitConfig: React.FC<EnhancedSplitConfigProps> = ({
  totalAmount,
  participants,
  splitType: initialSplitType,
  onSplitChange,
  paidBy,
}) => {
  const theme = useTheme();
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "custom">(initialSplitType);
  const [participantShares, setParticipantShares] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [paidByUserId, setPaidByUserId] = useState<string>(paidBy);
  const [includePayer, setIncludePayer] = useState<boolean>(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // Enhanced split calculation with better precision
  const calculateSplitShares = useMemo(() => {
    if (participants.length === 0) return [];

    const effectiveParticipants = [
      ...(includePayer ? [{ _id: paidByUserId, name: "You" }] : []),
      ...participants.filter(p => p._id !== paidByUserId)
    ];

    if (effectiveParticipants.length === 0) return [];

    let shares: any[] = [];

    switch (splitType) {
      case "equal":
        const equalShares = SplitService.calculateEqualSplit(totalAmount, effectiveParticipants.length);
        shares = effectiveParticipants.map((p, i) => ({
          userId: p._id,
          share: equalShares[i],
          percentage: Math.round((equalShares[i] / totalAmount) * 100 * 100) / 100,
          name: p.name || "Participant",
          isYou: p._id === paidByUserId
        }));
        break;

      case "percentage":
        const defaultPercentage = Math.round((100 / effectiveParticipants.length) * 100) / 100;
        shares = effectiveParticipants.map((p) => ({
          userId: p._id,
          share: Math.round((totalAmount * defaultPercentage / 100) * 100) / 100,
          percentage: defaultPercentage,
          name: p.name || "Participant",
          isYou: p._id === paidByUserId
        }));
        break;

      case "custom":
        const defaultShare = Math.round((totalAmount / effectiveParticipants.length) * 100) / 100;
        shares = effectiveParticipants.map((p) => ({
          userId: p._id,
          share: defaultShare,
          percentage: Math.round((defaultShare / totalAmount) * 100 * 100) / 100,
          name: p.name || "Participant",
          isYou: p._id === paidByUserId
        }));
        break;
    }

    return shares;
  }, [splitType, totalAmount, participants, paidByUserId, includePayer]);

  // Update shares when calculation changes
  useEffect(() => {
    const newShares = calculateSplitShares;
    setParticipantShares(newShares);
    
    // Validate and notify parent
    if (newShares.length > 0) {
      const validation = SplitService.validateSplit(totalAmount, splitType, newShares);
      setErrors(validation.errors);
      
      if (validation.isValid) {
        onSplitChange({ 
          splitType, 
          participants: newShares, 
          paidBy: paidByUserId 
        });
      }
    }
  }, [calculateSplitShares, totalAmount, splitType, paidByUserId, onSplitChange]);

  // Animate on mount
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Handle split type change with animation
  const handleSplitTypeChange = (newType: "equal" | "percentage" | "custom") => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
    
    setSplitType(newType);
  };

  // Handle individual share update
  const updateParticipantShare = (index: number, value: string, field: "share" | "percentage") => {
    const newShares = [...participantShares];
    const numValue = parseFloat(value) || 0;
    
    if (field === "percentage") {
      newShares[index] = {
        ...newShares[index],
        percentage: numValue,
        share: Math.round((totalAmount * numValue / 100) * 100) / 100,
      };
    } else {
      newShares[index] = {
        ...newShares[index],
        share: numValue,
        percentage: Math.round((numValue / totalAmount) * 100 * 100) / 100,
      };
    }
    
    setParticipantShares(newShares);
    
    // Validate and notify parent
    const validation = SplitService.validateSplit(totalAmount, splitType, newShares);
    setErrors(validation.errors);
    
    if (validation.isValid) {
      onSplitChange({ 
        splitType, 
        participants: newShares, 
        paidBy: paidByUserId 
      });
    }
  };

  // Calculate totals for display
  const totalAllocated = participantShares.reduce((sum, p) => sum + (p.share || 0), 0);
  const totalPercentage = participantShares.reduce((sum, p) => sum + (p.percentage || 0), 0);
  const remaining = totalAmount - totalAllocated;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.colors.surface,
          transform: [{ scale: animatedValue }],
          opacity: animatedValue
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="call-split" size={24} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Split Configuration
        </Text>
      </View>

      {/* Split Type Selector */}
      <View style={styles.typeSelector}>
        {(['equal', 'percentage', 'custom'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeButton,
              splitType === type && [styles.typeButtonActive, { backgroundColor: theme.colors.primary }],
              { borderColor: theme.colors.border }
            ]}
            onPress={() => handleSplitTypeChange(type)}
          >
            <Text
              style={[
                styles.typeButtonText,
                { color: splitType === type ? theme.colors.onPrimary : theme.colors.textSecondary }
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payer Selection */}
      <View style={styles.payerSection}>
        <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
          Paid by:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[{ _id: paidBy, name: "You" }, ...participants].map((person) => (
            <TouchableOpacity
              key={person._id}
              style={[
                styles.payerButton,
                paidByUserId === person._id && [styles.payerButtonActive, { backgroundColor: theme.colors.primary }],
                { borderColor: theme.colors.border }
              ]}
              onPress={() => setPaidByUserId(person._id)}
            >
              <Text
                style={[
                  styles.payerButtonText,
                  { color: paidByUserId === person._id ? theme.colors.onPrimary : theme.colors.textSecondary }
                ]}
              >
                {person.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Include Payer Toggle */}
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => setIncludePayer(!includePayer)}
      >
        <MaterialIcons
          name={includePayer ? "check-box" : "check-box-outline-blank"}
          size={24}
          color={theme.colors.primary}
        />
        <Text style={[styles.toggleText, { color: theme.colors.textPrimary }]}>
          Include payer in split
        </Text>
      </TouchableOpacity>

      {/* Participants List */}
      <ScrollView style={styles.participantsList}>
        {participantShares.map((participant, index) => (
          <View
            key={`${participant.userId}-${index}`}
            style={[
              styles.participantRow,
              { borderBottomColor: theme.colors.border }
            ]}
          >
            <View style={styles.participantInfo}>
              <Text style={[styles.participantName, { color: theme.colors.textPrimary }]}>
                {participant.name}
                {participant.isYou && " (You)"}
                {participant.userId === paidByUserId && " 💳"}
              </Text>
              
              {splitType === "equal" && (
                <Text style={[styles.shareAmount, { color: theme.colors.primary }]}>
                  {formatCurrency(participant.share)}
                </Text>
              )}
            </View>

            {splitType === "percentage" && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                      backgroundColor: theme.colors.surfaceVariant
                    }
                  ]}
                  value={participant.percentage?.toString() || ""}
                  onChangeText={(value) => updateParticipantShare(index, value, "percentage")}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <Text style={[styles.inputSuffix, { color: theme.colors.textSecondary }]}>%</Text>
                <Text style={[styles.calculatedAmount, { color: theme.colors.textSecondary }]}>
                  = {formatCurrency(participant.share)}
                </Text>
              </View>
            )}

            {splitType === "custom" && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      borderColor: theme.colors.border,
                      color: theme.colors.textPrimary,
                      backgroundColor: theme.colors.surfaceVariant
                    }
                  ]}
                  value={participant.share?.toString() || ""}
                  onChangeText={(value) => updateParticipantShare(index, value, "share")}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Summary Section */}
      <View style={[styles.summarySection, { borderTopColor: theme.colors.border }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Total Amount:
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Allocated:
          </Text>
          <Text style={[
            styles.summaryValue,
            { color: Math.abs(remaining) < 0.01 ? theme.colors.success : theme.colors.warning }
          ]}>
            {formatCurrency(totalAllocated)}
          </Text>
        </View>
        
        {Math.abs(remaining) > 0.01 && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Remaining:
            </Text>
            <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
        )}

        {splitType === "percentage" && (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Total %:
            </Text>
            <Text style={[
              styles.summaryValue,
              { color: Math.abs(totalPercentage - 100) < 0.01 ? theme.colors.success : theme.colors.warning }
            ]}>
              {totalPercentage.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      {/* Error Messages */}
      {errors.length > 0 && (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.error + '20' }]}>
          {errors.map((error, index) => (
            <Text key={index} style={[styles.errorText, { color: theme.colors.error }]}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      {/* Success Indicator */}
      {errors.length === 0 && participantShares.length > 0 && Math.abs(remaining) < 0.01 && (
        <View style={[styles.successContainer, { backgroundColor: theme.colors.success + '20' }]}>
          <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
          <Text style={[styles.successText, { color: theme.colors.success }]}>
            Split configuration is valid
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  payerSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  payerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  payerButtonActive: {
    borderWidth: 0,
  },
  payerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    marginLeft: 8,
  },
  participantsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  shareAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: 'right',
  },
  inputPrefix: {
    fontSize: 16,
  },
  inputSuffix: {
    fontSize: 16,
  },
  calculatedAmount: {
    fontSize: 14,
  },
  summarySection: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 4,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default EnhancedSplitConfig;
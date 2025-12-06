import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { SplitFormData, Friend } from "@/types";
import { SplitService } from "@/services/SplitService";

interface SplitConfigProps {
  totalAmount: number;
  participants: Friend[];
  splitType: "equal" | "percentage" | "custom";
  onSplitChange: (split: SplitFormData) => void;
  paidBy: string;
}

export const SplitConfig: React.FC<SplitConfigProps> = ({
  totalAmount,
  participants,
  splitType: initialSplitType,
  onSplitChange,
  paidBy,
}) => {
  const [splitType, setSplitType] = useState<"equal" | "percentage" | "custom">(
    initialSplitType
  );
  const [participantShares, setParticipantShares] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [paidByUserId, setPaidByUserId] = useState<string>(paidBy);
  const [includePayer, setIncludePayer] = useState<boolean>(false);
  const [lockedParticipants, setLockedParticipants] = useState<Set<number>>(new Set());

  // Simplified UI - default to equal split and exclude payer for better UX
  useEffect(() => {
    setSplitType('equal');
    setIncludePayer(false);
  }, []);

  const getDisplayName = (id: string, name?: string) => {
    if (id === paidBy) return "You";
    return name || "Friend";
  };

  // Initialize shares when participants or split type changes
  useEffect(() => {
    if (participants.length === 0) return;

    const baseParticipants: Array<{ _id: string; name: string }> = [
      ...(includePayer ? [{ _id: paidByUserId, name: getDisplayName(paidByUserId) }] : []),
      ...participants.map((p) => ({ _id: p._id, name: p.name })),
    ];
    // Remove duplicates by _id
    const seen = new Set<string>();
    const effectiveParticipants = baseParticipants.filter(p => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });

    let shares: any[] = [];

    if (splitType === "equal") {
      const equalShares = SplitService.calculateEqualSplit(
        totalAmount,
        effectiveParticipants.length
      );
      shares = effectiveParticipants.map((p, i) => ({
        userId: p._id,
        share: equalShares[i],
        percentage: (equalShares[i] / totalAmount) * 100,
        name: p.name,
      }));
    } else if (splitType === "percentage") {
      // Initialize with equal percentages
      const defaultPercentage = 100 / effectiveParticipants.length;
      shares = effectiveParticipants.map((p) => ({
        userId: p._id,
        share: (totalAmount * defaultPercentage) / 100,
        percentage: defaultPercentage,
        name: p.name,
      }));
    } else {
      // Custom - initialize with equal amounts
      const defaultShare = totalAmount / effectiveParticipants.length;
      shares = effectiveParticipants.map((p) => ({
        userId: p._id,
        share: defaultShare,
        percentage: undefined,
        name: p.name,
      }));
    }

    setParticipantShares(shares);

    const validation = SplitService.validateSplit(
      totalAmount,
      splitType,
      shares
    );
    setErrors(validation.errors);

    if (validation.isValid) {
      onSplitChange({ splitType, participants: shares, paidBy: paidByUserId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    splitType,
    totalAmount,
    paidByUserId,
    includePayer,
    // Create a stable dependency for participants
    JSON.stringify(participants.map(p => p._id).sort())
  ]);

  const redistributeEvenly = () => {
    if (participants.length === 0) return;

    const baseParticipants: Array<{ _id: string; name: string }> = [
      { _id: paidByUserId, name: getDisplayName(paidByUserId) },
      ...participants.map((p) => ({ _id: p._id, name: p.name })),
    ];
    const seen = new Set<string>();
    const effectiveParticipants = baseParticipants.filter(p => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });

    let shares: any[] = [];
    if (splitType === 'equal') {
      const equalShares = SplitService.calculateEqualSplit(totalAmount, effectiveParticipants.length);
      shares = effectiveParticipants.map((p, i) => ({
        userId: p._id,
        share: equalShares[i],
        percentage: (equalShares[i] / totalAmount) * 100,
        name: p.name,
      }));
    } else if (splitType === 'percentage') {
      const defaultPercentage = 100 / effectiveParticipants.length;
      shares = effectiveParticipants.map((p) => ({
        userId: p._id,
        share: (totalAmount * defaultPercentage) / 100,
        percentage: defaultPercentage,
        name: p.name,
      }));
    } else {
      const defaultShare = totalAmount / effectiveParticipants.length;
      shares = effectiveParticipants.map((p) => ({
        userId: p._id,
        share: defaultShare,
        percentage: undefined,
        name: p.name,
      }));
    }

    setParticipantShares(shares);

    const validation = SplitService.validateSplit(totalAmount, splitType, shares);
    setErrors(validation.errors);
    if (validation.isValid) {
      onSplitChange({ splitType, participants: shares, paidBy: paidByUserId });
    }
  };

  // Toggle participant lock to prevent auto-adjustment
  const toggleParticipantLock = (index: number) => {
    const newLocked = new Set(lockedParticipants);
    if (newLocked.has(index)) {
      newLocked.delete(index);
    } else {
      newLocked.add(index);
    }
    setLockedParticipants(newLocked);
  };

  const updateParticipantShare = (
    index: number,
    value: string,
    field: "share" | "percentage"
  ) => {
    const newShares = [...participantShares];
    const numValue = parseFloat(value) || 0;
    
    if (field === "percentage") {
      // Update percentage and recalculate share
      newShares[index] = {
        ...newShares[index],
        percentage: numValue,
        share: (totalAmount * numValue) / 100,
      };

      // Auto-adjust other percentages to maintain 100% total
      const currentTotalPercentage = newShares.reduce((sum, share) => sum + (share.percentage || 0), 0);
      const percentageDifference = 100 - currentTotalPercentage;
      
      if (Math.abs(percentageDifference) > 0.01 && newShares.length > 1) {
        const unlockedParticipants = newShares.filter((_, i) => i !== index && !lockedParticipants.has(i));
        
        if (unlockedParticipants.length > 0) {
          const adjustmentPerPerson = percentageDifference / unlockedParticipants.length;
          
          newShares.forEach((share, i) => {
            if (i !== index && !lockedParticipants.has(i)) {
              const newPercentage = Math.max(0, (share.percentage || 0) + adjustmentPerPerson);
              share.percentage = newPercentage;
              share.share = (totalAmount * newPercentage) / 100;
            }
          });
        }
      }
    } else {
      // Update share directly
      newShares[index] = {
        ...newShares[index],
        share: numValue,
      };

      // Auto-adjust other shares to maintain total
      const currentTotal = newShares.reduce((sum, share) => sum + (share.share || 0), 0);
      const difference = totalAmount - currentTotal;
      
      if (Math.abs(difference) > 0.01 && newShares.length > 1) {
        const unlockedParticipants = newShares.filter((_, i) => i !== index && !lockedParticipants.has(i));
        
        if (unlockedParticipants.length > 0) {
          const adjustmentPerPerson = difference / unlockedParticipants.length;
          
          newShares.forEach((share, i) => {
            if (i !== index && !lockedParticipants.has(i)) {
              share.share = Math.max(0, (share.share || 0) + adjustmentPerPerson);
            }
          });
        }
      }
    }
    
    setParticipantShares(newShares);

    // Validate and notify parent
    const validation = SplitService.validateSplit(
      totalAmount,
      splitType,
      newShares
    );
    setErrors(validation.errors);
    
    if (validation.isValid) {
      onSplitChange({ splitType, participants: newShares, paidBy });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Split Configuration</Text>

      <View style={styles.payerSelector}>
        <Text style={styles.payerLabel}>Paid By:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {React.useMemo(() => {
            const rawItems = [{ _id: paidBy, name: "You" }, ...participants];
            const seen = new Set<string>();
            const payerItems = rawItems.filter(p => {
              if (seen.has(p._id)) return false;
              seen.add(p._id);
              return true;
            });
            return payerItems.map((p) => (
              <TouchableOpacity
                key={`payer-${p._id}`}
                style={[
                  styles.payerButton,
                  paidByUserId === p._id && styles.payerButtonActive,
                ]}
                onPress={() => setPaidByUserId(p._id)}
              >
                <Text
                  style={[
                    styles.payerButtonText,
                    paidByUserId === p._id && styles.payerButtonTextActive,
                  ]}
                >
                  {getDisplayName(p._id, (p as any).name)}
                </Text>
              </TouchableOpacity>
            ));
          }, [paidBy, JSON.stringify(participants.map(p => p._id).sort()), paidByUserId])}
        </ScrollView>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            splitType === "equal" && styles.typeButtonActive,
          ]}
          onPress={() => setSplitType("equal")}
        >
          <Text
            style={[
              styles.typeButtonText,
              splitType === "equal" && styles.typeButtonTextActive,
            ]}
          >
            Equal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            splitType === "percentage" && styles.typeButtonActive,
          ]}
          onPress={() => setSplitType("percentage")}
        >
          <Text
            style={[
              styles.typeButtonText,
              splitType === "percentage" && styles.typeButtonTextActive,
            ]}
          >
            Percentage
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            splitType === "custom" && styles.typeButtonActive,
          ]}
          onPress={() => setSplitType("custom")}
        >
          <Text
            style={[
              styles.typeButtonText,
              splitType === "custom" && styles.typeButtonTextActive,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarButton} onPress={redistributeEvenly}>
          <Text style={styles.toolbarButtonText}>Distribute Evenly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, includePayer ? {} : styles.toolbarButtonActive]}
          onPress={() => setIncludePayer(!includePayer)}
        >
          <Text style={[styles.toolbarButtonText, includePayer ? {} : styles.toolbarButtonTextActive]}>Exclude Payer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.participantsList}>
        {React.useMemo(() => {
          const rawItems = [
            ...(includePayer ? [{ _id: paidByUserId, name: getDisplayName(paidByUserId) }] : []),
            ...participants
          ];
          const seen = new Set<string>();
          const participantItems = rawItems.filter(p => {
            if (seen.has(p._id)) return false;
            seen.add(p._id);
            return true;
          });
          return participantItems.map((participant, index) => (
            <View key={`${participant._id}-${index}`} style={styles.participantRow}>
              <View style={styles.participantHeader}>
                <Text style={styles.participantName}>
                  {getDisplayName(participant._id, participant.name)}
                  {participant._id === paidByUserId ? " (Payer)" : ""}
                </Text>
                {(splitType === "percentage" || splitType === "custom") && (
                  <TouchableOpacity
                    style={[
                      styles.lockButton,
                      lockedParticipants.has(index) && styles.lockButtonLocked
                    ]}
                    onPress={() => toggleParticipantLock(index)}
                  >
                    <MaterialIcons
                      name={lockedParticipants.has(index) ? "lock" : "lock-open"}
                      size={16}
                      color={lockedParticipants.has(index) ? "#ff6b6b" : "#999"}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {splitType === "equal" && (
                <Text style={styles.shareAmount}>
                  ₹{participantShares[index]?.share?.toFixed(2) || "0.00"}
                </Text>
              )}

              {splitType === "percentage" && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={participantShares[index]?.percentage?.toString() || ""}
                    onChangeText={(value) =>
                      updateParticipantShare(index, value, "percentage")
                    }
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                  <Text style={styles.shareAmount}>
                    = ₹{participantShares[index]?.share?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              )}

              {splitType === "custom" && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefix}>₹</Text>
                  <TextInput
                    style={styles.input}
                    value={participantShares[index]?.share?.toString() || ""}
                    onChangeText={(value) =>
                      updateParticipantShare(index, value, "share")
                    }
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>
              )}
            </View>
          ));
        }, [includePayer, paidByUserId, JSON.stringify(participants.map(p => p._id).sort()), participantShares, splitType, updateParticipantShare])}
      </ScrollView>

      {errors.length > 0 && (
        <View style={styles.errorContainer}>
          {errors.map((error, index) => (
            <Text key={`error-${index}`} style={styles.errorText}>
              • {error}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryAmount}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Allocated:</Text>
          <Text style={[
            styles.summaryAmount,
            {
              color: participantShares.reduce((sum, p) => sum + (p.share || 0), 0) === totalAmount
                ? '#28a745'
                : '#dc3545'
            }
          ]}>
            ₹{participantShares.reduce((sum, p) => sum + (p.share || 0), 0).toFixed(2)}
          </Text>
        </View>
        
        {participantShares.reduce((sum, p) => sum + (p.share || 0), 0) !== totalAmount && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining:</Text>
            <Text style={[styles.summaryAmount, { color: '#ff9500' }]}>
              ₹{(totalAmount - participantShares.reduce((sum, p) => sum + (p.share || 0), 0)).toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  typeSelector: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeButtonText: {
    fontSize: 14,
    color: "#666",
  },
  typeButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  participantsList: {
    maxHeight: 300,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  lockButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  lockButtonLocked: {
    backgroundColor: '#ffe0e0',
  },
  shareAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 80,
    textAlign: "right",
  },
  inputPrefix: {
    fontSize: 16,
    color: "#666",
  },
  inputSuffix: {
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#fee",
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  errorText: {
    color: "#c00",
    fontSize: 14,
    marginBottom: 4,
  },
  summaryContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#007AFF",
  },
  payerSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  payerLabel: {
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  payerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  payerButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#e6f0ff",
  },
  payerButtonText: {
    fontSize: 13,
    color: "#666",
  },
  payerButtonTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginLeft: 8,
  },
  toolbarButtonText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  toolbarButtonActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#007AFF',
  },
  toolbarButtonTextActive: {
    color: '#007AFF',
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
});

export default SplitConfig;

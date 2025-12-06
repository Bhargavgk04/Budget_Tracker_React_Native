# Design Document

## Overview

This design enhances the split validation logic in both frontend and backend services to prevent individual participant shares from exceeding the total transaction amount. The solution adds a new validation rule that checks each participant's share is within the valid range [0, totalAmount], provides clear error messages, and ensures consistent validation across the application stack.

## Architecture

The validation enhancement will be implemented in three layers:

1. **Frontend Validation (SplitService.ts)** - Real-time validation in the UI
2. **Backend Validation (SplitService.js)** - Server-side validation for API requests
3. **UI Feedback (SplitConfig.tsx)** - User-facing error display and form state management

The validation flow:
```
User Input → Frontend Validation → UI Feedback
                ↓
         API Request → Backend Validation → Response
```

## Components and Interfaces

### 1. Frontend SplitService Enhancement

**File:** `frontend/app/services/SplitService.ts`

**Method to Modify:** `validateSplit(amount, splitType, participants)`

**New Validation Logic:**
```typescript
// Add individual share validation
participants.forEach((participant, index) => {
  const share = participant.share || 0;
  
  if (share < 0) {
    errors.push(`${getParticipantName(participant, index)}: Share cannot be negative`);
  }
  
  if (share > amount) {
    errors.push(`${getParticipantName(participant, index)}: Share (₹${share.toFixed(2)}) cannot exceed total amount (₹${amount.toFixed(2)})`);
  }
  
  // For percentage splits, also validate the percentage
  if (splitType === 'percentage' && participant.percentage !== undefined) {
    if (participant.percentage < 0) {
      errors.push(`${getParticipantName(participant, index)}: Percentage cannot be negative`);
    }
    if (participant.percentage > 100) {
      errors.push(`${getParticipantName(participant, index)}: Percentage cannot exceed 100%`);
    }
  }
});
```

**Helper Function:**
```typescript
function getParticipantName(participant: any, index: number): string {
  return participant.name || `Participant ${index + 1}`;
}
```

### 2. Backend SplitService Enhancement

**File:** `backend/services/SplitService.js`

**Method to Modify:** `validateSplit(amount, splitType, participants)`

**New Validation Logic:**
```javascript
// Add individual share validation after existing participant validation
participants.forEach((p, index) => {
  const share = p.share || 0;
  
  if (share < 0) {
    errors.push(`Participant ${index + 1}: share cannot be negative`);
  }
  
  if (share > amount) {
    errors.push(`Participant ${index + 1}: share (${share.toFixed(2)}) cannot exceed transaction amount (${amount.toFixed(2)})`);
  }
  
  // For percentage splits, validate percentage bounds
  if (splitType === 'percentage') {
    const percentage = p.percentage || 0;
    if (percentage < 0) {
      errors.push(`Participant ${index + 1}: percentage cannot be negative`);
    }
    if (percentage > 100) {
      errors.push(`Participant ${index + 1}: percentage cannot exceed 100%`);
    }
  }
});
```

### 3. UI Component Enhancement

**File:** `frontend/app/components/splits/SplitConfig.tsx`

**Changes:**
- The component already displays validation errors from the SplitService
- No structural changes needed - the new validation errors will automatically appear in the existing error display
- The existing `onSplitChange` callback already prevents invalid splits from being passed to parent components

**Existing Error Display (no changes needed):**
```typescript
{errors.length > 0 && (
  <View style={styles.errorContainer}>
    {errors.map((error, index) => (
      <Text key={index} style={styles.errorText}>
        • {error}
      </Text>
    ))}
  </View>
)}
```

## Data Models

No changes to data models are required. The validation operates on existing data structures:

**Frontend Participant Interface:**
```typescript
interface Participant {
  userId: string;
  name?: string;
  share: number;
  percentage?: number;
}
```

**Backend Participant Object:**
```javascript
{
  user: ObjectId,
  nonAppUser?: { name: string, uid: string },
  share: number,
  percentage?: number,
  settled: boolean,
  settledAt?: Date
}
```

## Error Handling

### Frontend Error Handling

**Validation Errors:**
- Collected in an array and displayed in the UI
- Prevent form submission when present
- Clear automatically when user corrects the input

**Error Message Format:**
```
"[Participant Name]: Share (₹X.XX) cannot exceed total amount (₹Y.YY)"
"[Participant Name]: Share cannot be negative"
"[Participant Name]: Percentage cannot exceed 100%"
```

### Backend Error Handling

**Validation Errors:**
- Return 400 Bad Request status
- Include all validation errors in response body
- Prevent database writes when validation fails

**Error Response Format:**
```json
{
  "success": false,
  "error": "Split validation failed: Participant 1: share (250.00) cannot exceed transaction amount (200.00)"
}
```

## Testing Strategy

### Unit Tests

**Frontend Tests (SplitService.ts):**
1. Test individual share exceeds total amount
2. Test negative share values
3. Test percentage exceeds 100%
4. Test valid shares within bounds
5. Test edge case: share equals total amount (valid)
6. Test multiple participants with one invalid share

**Backend Tests (SplitService.js):**
1. Test individual share exceeds total amount
2. Test negative share values
3. Test percentage validation for percentage splits
4. Test valid custom splits
5. Test validation during split creation
6. Test validation during split update

### Integration Tests

1. **Frontend-Backend Integration:**
   - Submit split with invalid share through UI
   - Verify frontend catches error before API call
   - Verify backend rejects if frontend validation bypassed

2. **API Tests:**
   - POST /api/transactions/:id/split with invalid shares
   - PUT /api/transactions/:id/split with invalid shares
   - Verify 400 response with descriptive errors

### Manual Testing Scenarios

1. **Custom Split:**
   - Enter share > total amount
   - Verify error appears immediately
   - Verify submit button disabled

2. **Percentage Split:**
   - Enter percentage > 100%
   - Verify calculated share validation
   - Verify error message clarity

3. **Edge Cases:**
   - Share exactly equals total (should be valid)
   - Multiple participants, one invalid
   - Update existing split with invalid amount

## Implementation Notes

1. **Validation Order:** Individual share validation should occur after basic validation (amount > 0, participants exist) but before sum validation
2. **Precision:** Use same precision (0.01) for comparison as existing sum validation
3. **Performance:** Validation is O(n) where n is number of participants - acceptable for typical use cases (< 20 participants)
4. **Backward Compatibility:** This is a new validation rule that makes the system more strict - existing valid splits remain valid
5. **User Experience:** Error messages should be specific and actionable, including participant names when available

## Design Decisions

### Decision 1: Validate Individual Shares Before Sum
**Rationale:** If a single share exceeds the total, the sum will also be wrong. Catching individual share errors first provides more specific feedback to users.

### Decision 2: Use Participant Names in Error Messages
**Rationale:** Makes errors more actionable - users can immediately identify which participant needs correction without counting positions.

### Decision 3: No Changes to UI Component Structure
**Rationale:** The existing error display mechanism is sufficient. Adding new validation rules automatically integrates with the existing UI.

### Decision 4: Consistent Error Format Across Frontend/Backend
**Rationale:** While the exact wording differs slightly (frontend uses names, backend uses indices), the structure and information content are consistent for easier debugging.

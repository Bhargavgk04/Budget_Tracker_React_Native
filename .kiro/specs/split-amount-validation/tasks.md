# Implementation Plan

- [x] 1. Enhance backend split validation logic



  - Add individual share validation to `validateSplit` method in `backend/services/SplitService.js`
  - Validate each participant's share is non-negative and does not exceed total amount
  - Add percentage bounds validation (0-100%) for percentage split type
  - Ensure validation occurs after basic checks but before sum validation
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 4.1, 4.2, 4.3_



- [ ] 2. Write backend unit tests for new validation rules
  - Create test cases for share exceeding total amount
  - Create test cases for negative share values
  - Create test cases for percentage exceeding 100%
  - Create test cases for valid shares at boundary conditions (0, total amount)

  - Create test cases for multiple participants with one invalid share
  - _Requirements: 1.1, 1.2, 3.2, 4.4_


- [ ] 3. Enhance frontend split validation logic
  - Add individual share validation to `validateSplit` method in `frontend/app/services/SplitService.ts`
  - Implement helper function to get participant names for error messages

  - Validate each participant's share is non-negative and does not exceed total amount
  - Add percentage bounds validation for percentage split type
  - Format error messages with participant names and amounts

  - _Requirements: 1.1, 1.2, 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 4. Write frontend unit tests for new validation rules

  - Create test cases for share exceeding total amount with proper error messages
  - Create test cases for negative share values
  - Create test cases for percentage validation
  - Create test cases for valid shares within bounds

  - Create test cases for participant name inclusion in error messages

  - _Requirements: 1.1, 1.2, 2.1, 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Test validation integration in split creation flow
  - Verify frontend validation prevents invalid splits from being submitted
  - Verify backend validation rejects invalid splits if frontend is bypassed

  - Test error message display in SplitConfig component
  - Verify submit button state responds to validation errors
  - _Requirements: 1.3, 1.4, 2.3, 2.4, 3.1, 3.2, 3.3_

- [ ] 6. Test validation integration in split update flow
  - Verify validation applies when updating existing splits
  - Test re-validation when transaction amount changes
  - Verify error handling prevents invalid updates
  - Confirm all participant shares remain valid after successful update
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

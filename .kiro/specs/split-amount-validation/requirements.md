# Requirements Document

## Introduction

This feature addresses a critical validation gap in the expense splitting functionality. Currently, the system validates that split amounts sum to the total transaction amount, but it doesn't prevent individual participant shares from exceeding the total amount. This violates basic financial logic - if a transaction is ₹200, no single participant's share should be greater than ₹200. This enhancement will add validation to ensure each participant's share is within reasonable bounds (0 to total amount).

## Requirements

### Requirement 1

**User Story:** As a user creating a split transaction, I want the system to prevent me from entering a participant share that exceeds the total transaction amount, so that I don't create financially invalid splits.

#### Acceptance Criteria

1. WHEN a user enters a custom split amount for any participant THEN the system SHALL validate that the amount is not greater than the total transaction amount
2. WHEN a user enters a percentage for any participant THEN the system SHALL validate that the calculated share does not exceed the total transaction amount
3. IF a participant's share exceeds the total amount THEN the system SHALL display a clear error message indicating which participant has an invalid share
4. WHEN validation fails THEN the system SHALL prevent the split from being saved or submitted

### Requirement 2

**User Story:** As a user, I want to see real-time validation feedback when entering split amounts, so that I can immediately correct any errors without submitting the form.

#### Acceptance Criteria

1. WHEN a user modifies a participant's share in the UI THEN the system SHALL immediately validate the amount
2. IF the share exceeds the total amount THEN the system SHALL display an error message within 100ms
3. WHEN an invalid share is present THEN the system SHALL disable the save/submit button
4. WHEN all shares are valid THEN the system SHALL enable the save/submit button

### Requirement 3

**User Story:** As a developer, I want consistent validation logic across frontend and backend, so that invalid splits cannot be created through any interface or API call.

#### Acceptance Criteria

1. WHEN split validation is performed THEN both frontend and backend SHALL apply the same validation rules
2. IF the frontend validation is bypassed THEN the backend SHALL reject splits with participant shares exceeding the total amount
3. WHEN backend validation fails THEN the system SHALL return a 400 error with a descriptive message
4. WHEN validation logic is updated THEN both frontend and backend validation SHALL be updated in sync

### Requirement 4

**User Story:** As a user, I want clear error messages that specify which participant has an invalid share and what the valid range is, so that I can quickly fix the issue.

#### Acceptance Criteria

1. WHEN a participant's share exceeds the total THEN the error message SHALL include the participant's name
2. WHEN a participant's share is negative THEN the error message SHALL indicate that shares must be non-negative
3. WHEN displaying validation errors THEN the system SHALL show the valid range (0 to total amount)
4. WHEN multiple participants have invalid shares THEN the system SHALL display all validation errors simultaneously

### Requirement 5

**User Story:** As a user updating an existing split, I want the same validation to apply, so that I cannot modify a split to create an invalid state.

#### Acceptance Criteria

1. WHEN a user updates a split transaction THEN the system SHALL validate all participant shares against the total amount
2. IF the transaction amount is modified THEN the system SHALL re-validate all participant shares
3. WHEN validation fails during update THEN the system SHALL prevent the update and display appropriate errors
4. WHEN a split is successfully updated THEN all participant shares SHALL be within valid bounds

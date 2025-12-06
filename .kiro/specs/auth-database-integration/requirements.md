# Requirements Document

## Introduction

This feature ensures that the login and sign-in functionality works properly with the database on Android devices, providing a secure and reliable authentication system. The system needs to properly validate user credentials against the MongoDB database, handle authentication tokens correctly on Android, and provide appropriate error handling and user feedback throughout the authentication flow. Special attention is given to Android-specific considerations such as secure storage, network connectivity, and platform-specific UI behaviors.

## Requirements

### Requirement 1: Database User Authentication

**User Story:** As a user, I want to log in with my email and password, so that I can securely access my budget tracking data stored in the database.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials THEN the system SHALL query the MongoDB database to verify the user exists
2. WHEN the user exists in the database THEN the system SHALL compare the provided password with the hashed password stored in the database using bcrypt
3. WHEN the password matches THEN the system SHALL generate a JWT access token and refresh token
4. WHEN tokens are generated THEN the system SHALL store the refresh token in the user's document in the database
5. WHEN authentication succeeds THEN the system SHALL return the user object (without password), access token, and refresh token to the client
6. WHEN the user does not exist THEN the system SHALL return a 401 error with message "Invalid email or password"
7. WHEN the password does not match THEN the system SHALL increment login attempts and return a 401 error with message "Invalid email or password"

### Requirement 2: User Registration with Database Persistence

**User Story:** As a new user, I want to create an account with my email and password, so that my information is securely stored in the database for future logins.

#### Acceptance Criteria

1. WHEN a user submits registration details (name, email, password) THEN the system SHALL validate that the email is not already registered in the database
2. WHEN the email is unique THEN the system SHALL hash the password using bcrypt with a salt rounds of 12
3. WHEN the password is hashed THEN the system SHALL generate a unique UID for the user
4. WHEN the UID is generated THEN the system SHALL create a new user document in MongoDB with all provided details
5. WHEN the user is created THEN the system SHALL create default categories for the user
6. WHEN default categories are created THEN the system SHALL generate JWT tokens and return them with the user object
7. WHEN the email already exists THEN the system SHALL return a 400 error with message "Email already exists"
8. WHEN validation fails THEN the system SHALL return appropriate error messages for each validation failure

### Requirement 3: Token-Based Session Management

**User Story:** As a logged-in user, I want my session to persist securely, so that I don't have to log in repeatedly while using the app.

#### Acceptance Criteria

1. WHEN a user logs in successfully THEN the system SHALL store the access token and refresh token in secure storage on the client
2. WHEN the access token expires THEN the system SHALL automatically use the refresh token to obtain a new access token
3. WHEN refreshing the token THEN the system SHALL verify the refresh token exists in the database and is not expired
4. WHEN the refresh token is valid THEN the system SHALL generate new access and refresh tokens
5. WHEN new tokens are generated THEN the system SHALL update the refresh token in the database and remove the old one
6. WHEN the refresh token is invalid or expired THEN the system SHALL log out the user and redirect to the login screen
7. WHEN the user logs out THEN the system SHALL remove the refresh token from the database and clear all tokens from client storage

### Requirement 4: Account Security and Failed Login Protection

**User Story:** As a user, I want my account protected from brute force attacks, so that unauthorized users cannot gain access to my data.

#### Acceptance Criteria

1. WHEN a user enters an incorrect password THEN the system SHALL increment the loginAttempts counter in the database
2. WHEN loginAttempts reaches 5 THEN the system SHALL set a lockUntil timestamp 2 hours in the future
3. WHEN a locked account attempts to log in THEN the system SHALL return a 423 error with message "Account temporarily locked due to too many failed login attempts"
4. WHEN a successful login occurs THEN the system SHALL reset loginAttempts to 0 and clear lockUntil
5. WHEN the lockUntil time has passed THEN the system SHALL allow login attempts again
6. WHEN a login attempt is made THEN the system SHALL log the event in the AuditLog collection with IP address and device info
7. WHEN suspicious activity is detected THEN the system SHALL flag it in the audit logs

### Requirement 5: Password Reset Flow with Database Verification

**User Story:** As a user who forgot my password, I want to reset it securely, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user requests password reset THEN the system SHALL verify the email exists in the database
2. WHEN the email exists THEN the system SHALL generate a secure random reset token
3. WHEN the token is generated THEN the system SHALL hash it and store it in the user's passwordResetToken field with an expiry time
4. WHEN the user submits the reset token and new password THEN the system SHALL verify the hashed token matches and is not expired
5. WHEN the token is valid THEN the system SHALL hash the new password and update it in the database
6. WHEN the password is updated THEN the system SHALL clear the passwordResetToken and passwordResetExpires fields
7. WHEN the password is updated THEN the system SHALL clear all refresh tokens from the database for security
8. WHEN the reset token is invalid or expired THEN the system SHALL return a 400 error with message "Reset link has expired"

### Requirement 6: Android Authentication State Management

**User Story:** As an Android user, I want the app to remember my login state securely, so that I don't see loading screens unnecessarily and can access my data quickly.

#### Acceptance Criteria

1. WHEN the app starts on Android THEN the system SHALL check for stored tokens in AsyncStorage
2. WHEN tokens exist THEN the system SHALL validate the access token is not expired
3. WHEN the access token is valid THEN the system SHALL load the user data and set isAuthenticated to true
4. WHEN the access token is expired but refresh token exists THEN the system SHALL attempt to refresh the token
5. WHEN token refresh succeeds THEN the system SHALL update stored tokens and authenticate the user
6. WHEN no valid tokens exist THEN the system SHALL set isAuthenticated to false and show the login screen
7. WHEN authentication state changes THEN the system SHALL update the UI immediately without unnecessary loading states
8. WHEN the Android app is backgrounded THEN the system SHALL maintain the authentication state
9. WHEN the Android app is killed and restarted THEN the system SHALL restore authentication from AsyncStorage

### Requirement 7: Error Handling and User Feedback

**User Story:** As an Android user, I want clear error messages when authentication fails, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a network error occurs THEN the system SHALL display "Unable to connect to server. Please check your internet connection."
2. WHEN invalid credentials are provided THEN the system SHALL display "Invalid email or password"
3. WHEN the account is locked THEN the system SHALL display "Account temporarily locked due to too many failed login attempts"
4. WHEN email validation fails THEN the system SHALL display "Please enter a valid email address"
5. WHEN password validation fails THEN the system SHALL display specific requirements (e.g., "Password must be at least 8 characters")
6. WHEN registration fails due to existing email THEN the system SHALL display "Email already exists"
7. WHEN any error occurs THEN the system SHALL log it to the console for debugging purposes
8. WHEN displaying errors on Android THEN the system SHALL use React Native Alert for critical errors
9. WHEN the Android keyboard is open THEN the system SHALL ensure error messages are visible above the keyboard

### Requirement 8: Android Network Configuration

**User Story:** As an Android user, I want the app to connect to the backend server reliably, so that I can authenticate and access my data.

#### Acceptance Criteria

1. WHEN the Android app makes API requests THEN the system SHALL use the correct backend URL configured for Android
2. WHEN running on Android emulator THEN the system SHALL use 10.0.2.2 to access localhost backend
3. WHEN running on physical Android device THEN the system SHALL use the local network IP address of the backend server
4. WHEN the network request times out THEN the system SHALL display a timeout error after 30 seconds
5. WHEN the backend is unreachable THEN the system SHALL provide clear feedback about connection issues
6. WHEN making HTTPS requests on Android THEN the system SHALL properly handle SSL certificates
7. WHEN network connectivity changes THEN the system SHALL detect it and retry failed authentication requests

### Requirement 9: Android Secure Storage

**User Story:** As an Android user, I want my authentication tokens stored securely, so that my account remains protected even if my device is compromised.

#### Acceptance Criteria

1. WHEN storing tokens on Android THEN the system SHALL use AsyncStorage with proper encryption
2. WHEN the app is uninstalled THEN the system SHALL ensure all stored tokens are removed
3. WHEN tokens are retrieved THEN the system SHALL validate they haven't been tampered with
4. WHEN storing sensitive data THEN the system SHALL never log tokens or passwords to console in production
5. WHEN the device is rooted THEN the system SHALL still maintain basic security measures
6. WHEN clearing auth data THEN the system SHALL remove all authentication-related items from AsyncStorage

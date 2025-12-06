# Design Document

## Overview

This design document outlines the implementation of a secure, database-integrated authentication system for the Android budget tracker application. The system uses JWT-based authentication with refresh tokens, MongoDB for data persistence, and React Native with AsyncStorage for client-side token management.

## Architecture

### High-Level Archire

```
Android App (React Native)
├── Auth Screens (Login, Signup, ForgotPassword)
├── AuthContext (State Management)
├── AuthService (API Layer)
└── AsyncStorage (Token Storage)
        ↓ HTTP (10.0.2.2:3000 for emula
Node.js Backend
├── Auth Routes (/api/auth/*)
├── Auth Middleware (JWT verification)
└── User Model (Mongoose)
        ↓
MongoDB Database
└──ection
```

## Cofaces

### 1. Frontend Components (React Native - Android)

#### LoginScreen Component
- **Location**: `frontend/app/screens/auth/LoginScreen.tsx`
-:
  - Email and password input n
  le
  - Form validation using reac
ation
  - Error display with Android Alert
  - Naord
  - Demo login option

#### SignupScreen Component
- **Location**: `frontend/app/screens/auth/SignupScreen.tsx`
-
  - Name, email, pas
  - Password strength indicator
  - Confirm password field
  - Form validation
  - Nto login

t
- **Location**: `frontend/app/screens/auth/ForgotPasswordScreen.sx`
- **Features**:
  - Email input for reset request
  - Token verification
  - New password input
  - Multi-step flow

### 2. State Management Layer

#### AuthContext
- **Location**: `frontend/app/context/Aux`
- **State Structure**:
```typescript
interface AuthState {
  ;
  token: string | null;
  refresll;
  i

  error: string | nu;

```

- **Methods**:
  - `login(email, password)`: Authenticate user
  - `register(email, password, name)`: Crount
  -ssion
reset
  - `resetPassword(token, newte reset
  - en
  - `updateProfile(userData)`: Update us
r state
  - `demoLogin()`: Demo access

ions**:
  - `AUTH_START`: Set loadig
  - `AUTH_SUCCESS`: Store user and tokens
  rors
  - `LOGOUT`: Clear
  - `TOKEN_REFRESH`: Update tokens
  - `UPDATE_USER`: Update user data
  - `CLEAR_ERROR`: Reset error

 Layer

e
- **Location**: `frontend/app/conte
- **Methods**:
  - `login(email, password)`: POSTlogin`
  - `register(emailr`
  - `forgotPassword(emad`
  - `resetPassword(token, 
  - 


```typescript
{
  baseURL: 'httpemulator
  0,
  headers: {
    json',
    'Authoriz`
  }
}
```

yer

###
-text.tsx`
- *s**:
 token
 h token
  - `@user_data`ject

- **Methods**:
  - `setItem(key, value)`: Store data
  - `getItem(key)`: Retrieve data
  - `removeItem(key)`: Delete item
  - `multiSet(pairs)`: Store multiple
  - `multiRemoveultiple

s

#### Auth Routes
- **Location**: `backend/`
- **E**:
  - POST `/api/auth/register` - Cer
  - POST `/api/auth/login` - Authecate
  - POST `/api/auth/ln
  - POST `/api/auten
set
  - POST `/api/auth/rese reset


#### Ul
- **Location**: `backend/models/User.js`
- **Methods**:
  - `generateUniqueUID()`: Create unique ID
  - `matchPassword(password)`: Verify password
  - `getSignedJwtToken()`:token
  - `generateRefreshToken()`: Create sh token
  - `getResetPasswordToken()`: Generate
s
  - `resetLoginAttnter

#ata Models

### User DocumentongoDB)

```javascript
{
  _d,
 e ID
  ne: String,
wercase
  password: String, /ed
ng,
  currency: String,
  preferences: {
    theme: String,
    notifications: ect,
  Boolean,
    l
    dateFg
  },
  [{
    token: String,
Object,
    rememberMe: Boolean,
    createdAt: Date,
    expiree

  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
 
  lockUn,

  updatedAt: Date
}
```

### JWT Token Payload

n:**
```javascript
{
  id: String, // User _id
  iat: Number,
r
}
```

**Refresh 
```javascript
{
  id: String,
fresh',
  iat: Number,
  exp: Number  // 7-30 days
}
```

## Authentication Flow

### Login Flow

1. User enters credentials in LoginScreen
2. LoginScreen`
3. AuthContext dispART`
in`
5. Backendentials:
email
   - Check account ltus
rypt
   - Track lopts
6 tokens
7. Backend store
8. BackeditLog
9. Storage
10. Au
11.

# Flow

n
2. Call `AuthContext
3. Backend validates input
4. Backend creates user:
   - Generate unique UID
   - Hash password (bcry
   - Cent
   - Create default caties
5
6. Frontend stores tokens
7. Noard

### Token Refresh Flow

1. API request wit
2. Backend returns 401
3. Call `AuthContext.re
4. ackend
5. Backend validates reoken
6. Backens
7. Frontend updates stokens
8. Retry original reest

## Erg

### Network Errors
- Times
- Connection refused
- DNS failure
- Display: "Unable to conternet."

### Authenticationrs

|ge |
----|

| 401 | Bad credentia" |
|
| 429 | Rate limi
| 

### Android-Specific Handng

**Keyboard Management:**
`script
<Keing">

</Keybo>
```

**Network Detection:**
```typescript
import NetInfo from '@react-native-co
NetInfo.addEventListener(state => {
 
   et');

});


## Testing Strategy

### Unit Tests
- AuthC
- Token validat
- Form validation
- Password hashing

### Integration T

- Lnt
h
- Password reset
- Account locut

### E2E Tests (An
- 
- Existing user login
-out
- Pd reset
fresh
- out
 tokens
- Network errors

## 

#n

**Emulator:**
```typescript
baseURL: 'http://10.0.2./api'
```

**Physical Device:**
```script
baseURL: 'http://192.168.1s IP
```

**Find IP:**
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

#ge

**Installation:**
```bash
rage
```

**U
```typescript
await AsyncStorage.setItem('@auth_token', token);
co
await AsyncStorage.removeIte);
```

##mance
- Lazy load auth screens
- Check token expiry locly
- Batch storage operation
- Implement retry logic
- Ca

## Security Considerations

### Password Security
- Minirs
- B(cost 12)
lain

ty
- 
- Refresh tokens: 7-30 
- Stored in AsyncStorage
- Validated in database
- Invalidated on password change

### Account Protection
- Ramin
- Lockout: 2 hours after 5 fails
- Audit logging
- IP and device tracking

### Network Security
- Hduction
- C
idation
- SQL injection
n

## Deployment

### Environmeriables

**Backend
```
Nction
MONn-db
et
JWT_REFRESH_SECREh-secret
```


```typescript
const API_URL = __DEV__ 
  ? 'http://10.0.2.2/api'
  : 'https://api.product
```

### Produclist
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Database backups
- [ ] onfigured
- [ ] Error monitoring
- [ ] Rate limited
- [ ] CORSred
- [ ] Sec
- [ ] Secrets rotated

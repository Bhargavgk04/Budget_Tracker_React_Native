# 🏗️ Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BUDGET TRACKER APP                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│   FRONTEND       │◄───────►│    BACKEND       │◄───────►│    DATABASE      │
│   React Native   │  HTTPS  │    Express.js    │  TCP    │    MongoDB       │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  UI Components   │         │  Route Handlers  │         │  Collections     │
│  - Screens       │         │  - Auth          │         │  - Users         │
│  - Navigation    │         │  - Transactions  │         │  - Transactions  │
│  - Forms         │         │  - Analytics     │         │  - Categories    │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  State Mgmt      │         │  Middleware      │         │  Indexes         │
│  - Context API   │         │  - Auth          │         │  - userId        │
│  - Reducers      │         │  - Validation    │         │  - date          │
│  - Hooks         │         │  - Error Handler │         │  - category      │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        │                            │                            │
        ▼                            ▼                            ▼
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│  Services        │         │  Models          │         │  Aggregations    │
│  - API Service   │         │  - Transaction   │         │  - Stats         │
│  - Realtime      │         │  - User          │         │  - Breakdown     │
│  - Cache         │         │  - Category      │         │  - Trends        │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

---

## Transaction Flow (Optimized)

### Before Optimization ❌
```
User Action: Add Transaction
│
├─► [1] Submit Form
│   └─► API Call: POST /transactions (500ms)
│
├─► [2] Manual Refresh #1
│   ├─► API Call: GET /transactions (500ms)
│   ├─► API Call: GET /transactions/stats (500ms)
│   └─► API Call: GET /analytics/category-breakdown (500ms)
│
├─► [3] RealtimeService Sync
│   ├─► API Call: GET /transactions (500ms)
│   ├─► API Call: GET /transactions/stats (500ms)
│   └─► API Call: GET /analytics/category-breakdown (500ms)
│
├─► [4] Periodic Refresh
│   ├─► API Call: GET /transactions (500ms)
│   ├─► API Call: GET /transactions/stats (500ms)
│   └─► API Call: GET /analytics/category-breakdown (500ms)
│
└─► [5] App State Sync
    ├─► API Call: GET /transactions (500ms)
    ├─► API Call: GET /transactions/stats (500ms)
    └─► API Call: GET /analytics/category-breakdown (500ms)

Total Time: 3-5 seconds ⏱️
Total API Calls: 13 calls 📡
User Experience: Poor 😞
```

### After Optimization ✅
```
User Action: Add Transaction
│
├─► [1] Submit Form
│   ├─► API Call: POST /transactions (500ms)
│   └─► Update Local State (0ms) ⚡
│
├─► [2] Show Success Message (0ms) ✅
│
├─► [3] Navigate Back (0ms) 🔙
│
└─► [4] Background Sync (500ms delay)
    ├─► Batch Operations
    ├─► API Call: GET /transactions (500ms)
    ├─► API Call: GET /transactions/stats (500ms)
    └─► API Call: GET /analytics/category-breakdown (500ms)

Total Perceived Time: < 500ms ⚡
Total API Calls: 4 calls 📡
User Experience: Excellent 😊
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Add Trans │  │Analytics │  │Settings  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   TRANSACTION CONTEXT     │
        │  ┌─────────────────────┐  │
        │  │  State Management   │  │
        │  │  - transactions     │  │
        │  │  - summary          │  │
        │  │  - categoryBreakdown│  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │  Actions            │  │
        │  │  - addTransaction   │  │
        │  │  - updateTransaction│  │
        │  │  - deleteTransaction│  │
        │  │  - refreshData      │  │
        │  └─────────────────────┘  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     API SERVICE           │
        │  ┌─────────────────────┐  │
        │  │  HTTP Client        │  │
        │  │  - Auth Headers     │  │
        │  │  - Error Handling   │  │
        │  │  - Retry Logic      │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │  Cache Manager      │  │
        │  │  - Memory Cache     │  │
        │  │  - AsyncStorage     │  │
        │  │  - Invalidation     │  │
        │  └─────────────────────┘  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │   REALTIME SERVICE        │
        │  ┌─────────────────────┐  │
        │  │  Sync Manager       │  │
        │  │  - Periodic Sync    │  │
        │  │  - Mutation Sync    │  │
        │  │  - Throttling       │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │  Subscribers        │  │
        │  │  - Context          │  │
        │  │  - Components       │  │
        │  └─────────────────────┘  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │      BACKEND API          │
        │  ┌─────────────────────┐  │
        │  │  Express Routes     │  │
        │  │  - /transactions    │  │
        │  │  - /analytics       │  │
        │  │  - /auth            │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │  Middleware         │  │
        │  │  - Authentication   │  │
        │  │  - Validation       │  │
        │  │  - Rate Limiting    │  │
        │  └─────────────────────┘  │
        └─────────────┬─────────────┘
                      │
        ┌─────────────▼─────────────┐
        │     MONGODB DATABASE      │
        │  ┌─────────────────────┐  │
        │  │  Collections        │  │
        │  │  - transactions     │  │
        │  │  - users            │  │
        │  │  - categories       │  │
        │  └─────────────────────┘  │
        │  ┌─────────────────────┐  │
        │  │  Indexes            │  │
        │  │  - userId + date    │  │
        │  │  - category         │  │
        │  │  - type             │  │
        │  └─────────────────────┘  │
        └───────────────────────────┘
```

---

## Sync Strategy (Optimized)

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC STRATEGY                             │
└─────────────────────────────────────────────────────────────┘

1. USER ACTION (Add/Update/Delete Transaction)
   │
   ├─► Optimistic Update (0ms)
   │   └─► Update local state immediately
   │
   ├─► API Call (500ms)
   │   └─► Send to server
   │
   └─► Trigger Mutation Sync
       └─► Schedule batched sync (500ms delay)

2. BATCHED SYNC (After 500ms)
   │
   ├─► Check Throttle
   │   └─► Skip if synced < 2s ago
   │
   ├─► Parallel API Calls
   │   ├─► GET /transactions
   │   ├─► GET /transactions/stats
   │   └─► GET /analytics/category-breakdown
   │
   └─► Update State
       └─► Notify subscribers

3. PERIODIC SYNC (Every 10s)
   │
   ├─► Check Throttle
   │   └─► Skip if synced < 2s ago
   │
   ├─► Parallel API Calls
   │   ├─► GET /transactions
   │   ├─► GET /transactions/stats
   │   └─► GET /analytics/category-breakdown
   │
   └─► Update State
       └─► Notify subscribers

4. APP STATE CHANGE (Background → Foreground)
   │
   ├─► Force Sync
   │   └─► Bypass throttle
   │
   ├─► Parallel API Calls
   │   ├─► GET /transactions
   │   ├─► GET /transactions/stats
   │   └─► GET /analytics/category-breakdown
   │
   └─► Update State
       └─► Notify subscribers
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  ERROR HANDLING                              │
└─────────────────────────────────────────────────────────────┘

API Request
│
├─► Success (200-299)
│   └─► Return data
│
├─► Client Error (400-499)
│   ├─► 401 Unauthorized
│   │   ├─► Try refresh token
│   │   ├─► Success → Retry request
│   │   └─► Fail → Logout user
│   │
│   ├─► 400 Bad Request
│   │   └─► Show validation error
│   │
│   └─► 404 Not Found
│       └─► Show not found error
│
├─► Server Error (500-599)
│   ├─► Log error
│   ├─► Show generic error
│   └─► Retry with backoff
│
└─► Network Error
    ├─► Check connectivity
    ├─► Queue request (if mutation)
    ├─► Show offline message
    └─► Retry when online

Background Sync Error
│
├─► Log warning
├─► Don't show to user
└─► Retry on next sync

User Action Error
│
├─► Log error
├─► Show error message
└─► Allow retry
```

---

## Performance Optimization Points

```
┌─────────────────────────────────────────────────────────────┐
│              PERFORMANCE OPTIMIZATIONS                       │
└─────────────────────────────────────────────────────────────┘

1. FRONTEND
   ├─► Optimistic Updates (Instant UI)
   ├─► Memoization (Reduce re-renders)
   ├─► Lazy Loading (Faster initial load)
   ├─► Code Splitting (Smaller bundles)
   └─► Image Optimization (Faster loading)

2. API LAYER
   ├─► Request Batching (Fewer calls)
   ├─► Request Deduplication (No duplicates)
   ├─► Throttling (Rate limiting)
   ├─► Caching (Faster responses)
   └─► Compression (Smaller payloads)

3. BACKEND
   ├─► Database Indexing (Faster queries)
   ├─► Query Optimization (Less data)
   ├─► Connection Pooling (Reuse connections)
   ├─► Caching (Redis)
   └─► Load Balancing (Scale horizontally)

4. DATABASE
   ├─► Compound Indexes (Multi-field queries)
   ├─► Lean Queries (Plain objects)
   ├─► Projection (Only needed fields)
   ├─► Aggregation Pipeline (Server-side processing)
   └─► Sharding (Horizontal scaling)
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS                             │
└─────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ├─► JWT Tokens (Stateless auth)
   ├─► Refresh Tokens (Long-lived sessions)
   ├─► Token Expiration (Auto logout)
   └─► Secure Storage (Encrypted)

2. AUTHORIZATION
   ├─► User Isolation (userId filter)
   ├─► Role-Based Access (Admin/User)
   ├─► Resource Ownership (Can only modify own data)
   └─► API Permissions (Route protection)

3. INPUT VALIDATION
   ├─► Frontend Validation (UX)
   ├─► Backend Validation (Security)
   ├─► Schema Validation (Data integrity)
   └─► Sanitization (XSS prevention)

4. NETWORK SECURITY
   ├─► HTTPS (Encrypted transport)
   ├─► CORS (Origin control)
   ├─► Rate Limiting (DDoS prevention)
   └─► Helmet (Security headers)

5. DATA SECURITY
   ├─► Password Hashing (bcrypt)
   ├─► Sensitive Data Encryption (AES)
   ├─► Soft Deletes (Data recovery)
   └─► Audit Logs (Tracking)
```

---

**Date**: December 8, 2025
**Status**: Optimized and Production Ready ✅

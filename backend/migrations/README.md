# Database Migrations

This folder contains database migration scripts for the Budget Tracker application.

## Running Migrations

### Run a specific migration:
```bash
node backend/migrations/001_add_profile_features.js
```

### Run all migrations (future):
```bash
npm run migrate
```

## Migration Files

### 001_add_profile_features.js
- **Purpose**: Add 2FA and enhanced profile features to User model
- **Fields Added**:
  - `twoFactorEnabled` (Boolean, default: false)
  - `twoFactorSecret` (String, default: null)
  - `twoFactorBackupCodes` (Array, default: [])
- **Requirements**: 1.9, 1.11, 1.12
- **Date**: 2025-12-02

## Creating New Migrations

1. Create a new file with format: `XXX_description.js`
2. Follow the template structure from existing migrations
3. Include proper error handling and rollback logic
4. Document the migration in this README
5. Test thoroughly before running in production

## Best Practices

- Always backup database before running migrations
- Test migrations on development environment first
- Include verification steps in migration scripts
- Document all changes and requirements
- Use descriptive migration names
- Keep migrations idempotent (safe to run multiple times)

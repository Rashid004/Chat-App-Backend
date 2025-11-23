# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a real-time chat application backend built with Express, Socket.IO, MongoDB, and TypeScript. The application is in early setup stages with core infrastructure in place but minimal feature implementation.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (once configured)
# Note: No dev script currently exists in package.json
# Expected: ts-node-dev is available, likely needs: npm run dev

# Build TypeScript
# Note: No build script currently exists in package.json
# Expected: tsc (outputs to ./dist directory per tsconfig)

# Run tests
npm test  # Currently fails - no tests implemented yet
```

## Architecture

### Entry Point Flow
- [src/server.ts](src/server.ts) - Main entry point, creates HTTP server and Socket.IO instance
- [src/app.ts](src/app.ts) - Express app configuration with middleware setup
- HTTP server wraps Express app to enable WebSocket support

### Configuration System
Located in [src/config/](src/config/):
- **env.ts** - Environment variable validation using `@t3-oss/env-core` and Zod schemas
  - All environment variables are strictly typed and validated on startup
  - Validation fails fast with descriptive errors if required vars are missing
  - Required vars: `MONGODB_URI`, `JWT_SECRET` (min 32 chars)
  - Optional: `NODE_ENV`, `PORT`, `LOG_LEVEL`, `CORS_ORIGIN`, etc.
- **logger.ts** - Pino-based structured logging
  - Development: Pretty-printed colored logs
  - Production: JSON logs with sensitive data redaction (auth headers, passwords, tokens)
  - HTTP request/response logging via `pinoHttp` middleware

### Middleware Stack (in order)
1. CORS - Configured with credentials support, origin from `CORS_ORIGIN` env var
2. JSON body parser
3. Cookie parser
4. HTTP logger (pino-http)

### Socket.IO Setup
- Configured with CORS matching Express
- Basic connection handler in place (logs "Socket connected")
- Ready for real-time chat event handlers (not yet implemented)

### Security & Quality Tools
Installed but not yet configured:
- `helmet` - Security headers middleware
- `express-rate-limit` - Rate limiting
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication

### TypeScript Configuration
- **Module System**: ESNext with NodeNext resolution (modern Node.js)
- **Output**: [dist/](dist/) directory with source maps and declarations
- **Strict Mode**: Enabled with additional strictness (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Type Note**: package.json incorrectly has `"types": "module"` - should be `"type": "module"` if using ES modules, or remove if using CommonJS (currently set to `"type": "commonjs"`)

## Database
- MongoDB via Mongoose (installed but not yet connected)
- Connection setup will need to be added to server.ts using `MONGODB_URI` from env

## Authentication
- JWT-based authentication planned (jsonwebtoken installed)
- JWT configuration available via env vars: `JWT_SECRET`, `JWT_EXPIRES_IN`

## Project State
- Core infrastructure: ✅ Complete
- Database connection: ❌ Not implemented
- Authentication/Authorization: ❌ Not implemented
- Chat routes/controllers: ❌ Not implemented
- Socket.IO event handlers: ❌ Not implemented
- Tests: ❌ Not implemented
- Build/dev scripts: ❌ Missing from package.json

## Environment Variables
Create a `.env` file in the root with:
```env
NODE_ENV=development
PORT=5000
SERVICE_NAME=chat-backend
LOG_LEVEL=debug

# Required
MONGODB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Optional
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

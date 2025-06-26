# Bridge Bidding Discussion Website

## Project Overview
A web application for bridge players to discuss hands, analyze bidding sequences, and share experiences from their weekly bridge games. The site focuses on interactive discussion of bridge deals with sophisticated bidding analysis tools.

## Core Features (MVP)
- **Hand Display**: Graphical card visualization of bridge deals
- **User System**: Account registration with role-based permissions (admin/user/guest)
- **Comments**: Threaded discussion system for each board
- **PBN Integration**: Automatic weekly fetch from 1011.bridge.nl + manual upload capability
- **Bidding Entry**: Visual bidding table with comments and alert notation
- **Play Entry**: Sequence of card play entry system
- **Polling**: Board-linked polls with public voting results
- **Labeling & Search**: Tag system with advanced filtering

## Future Features
- Partnership surveys for new pairs
- Convention card builder
- Bidding system designer
- Quizzes for partnership understanding

## Technical Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: Passport.js (open source)
- **Deployment**: Docker Compose for self-hosting

## Data Sources
- Primary: 1011.bridge.nl PBN files (weekly auto-fetch)
- Secondary: Manual PBN file uploads
- Manual trigger for immediate fetching

## Key Requirements
- All frameworks must be free and open source
- Self-hosting preferred over cloud services
- Threaded comments (not linear)
- Visual bidding table interface
- Bid alerts with free-text explanations
- Public (non-anonymous) poll voting
- Graphical card display with suit symbols
- Username-based accounts (no real name requirement)

## Development Commands
```bash
# Frontend development
npm run dev

# Backend development
npm run dev:server

# Database operations
npx prisma migrate dev
npx prisma studio

# Testing
npm test

# Build for production
npm run build
```

## Admin Features
- **PBN File Import**: Admin users can upload .pbn files to import tournaments
- **Tournament Management**: View statistics and delete tournaments
- **Access**: Admin panel accessible via "Admin" navigation button (admin users only)
- **File Upload**: Supports .pbn files up to 5MB with validation

## Bridge-Specific Notes
- Support standard PBN format for broad compatibility
- Hand display should support all 4 perspectives (N/S/E/W)
- Bidding table should clearly show alerts and comments
- Card display uses standard suit symbols (♠♥♦♣)
- Focus initially on local bridge club, expandable later

## Architecture Notes
- Monorepo structure with frontend and backend
- RESTful API design
- PostgreSQL for relational data (users, comments, hands)
- Real-time features for collaborative discussions
- Responsive design for mobile bridge players

## Common Issues & Solutions

### Slow npm run dev Performance
**Problem:** `npm run dev` takes a long time to start or has dependency issues
**Cause:** Outdated or conflicting npm dependencies, especially in workspace environments
**Solution:** Run `npm install` to fix dependency issues before starting dev server
```bash
# Fix dependencies first
npm install

# Then start development
npm run dev
```
**Prevention:** Regularly update dependencies and run `npm install` after pulling changes

### TypeScript Interface Import Error
**Problem:** `Uncaught SyntaxError: The requested module doesn't provide an export named: 'InterfaceName'`
**Cause:** TypeScript interfaces are compile-time only and get stripped out during JavaScript compilation
**Solution:** Define types locally in each component instead of importing them across modules
```typescript
// ❌ Don't do this:
import Component, { InterfaceName } from './Component';

// ✅ Do this instead:
import Component from './Component';
type InterfaceName = { /* define locally */ };
```
**Remember:** Only import runtime values (functions, classes, constants) between modules, not TypeScript types/interfaces.
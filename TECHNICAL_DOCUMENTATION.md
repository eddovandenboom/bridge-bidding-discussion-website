# Bridge Bidding Discussion Website - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Design](#database-design)
4. [API Documentation](#api-documentation)
5. [Frontend Architecture](#frontend-architecture)
6. [Features Overview](#features-overview)
7. [Authentication System](#authentication-system)
8. [Data Flow](#data-flow)
9. [Development Guide](#development-guide)
10. [Deployment](#deployment)

## System Overview

The Bridge Bidding Discussion Website is a specialized social platform designed for bridge players to analyze and discuss tournament hands. It combines bridge-specific knowledge with modern web technologies to create an interactive environment for learning and sharing bridge expertise.

### Core Purpose
- **Hand Analysis**: Display and analyze bridge hands from tournaments
- **Bidding Discussion**: Create and discuss bidding sequences with alerts and explanations  
- **Social Learning**: Enable threaded discussions and polling on bridge decisions
- **Knowledge Sharing**: Categorize and search through historical discussions

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Development**: Docker Compose for containerized development

## Architecture

### System Architecture Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express API    │    │   PostgreSQL    │
│   (Port 5173)   │◄──►│   (Port 3001)   │◄──►│   Database      │
│                 │    │                 │    │                 │
│ - Components    │    │ - Routes        │    │ - User Data     │
│ - State Mgmt    │    │ - Middleware    │    │ - Bridge Data   │
│ - API Calls     │    │ - Auth Logic    │    │ - Relationships │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Project Structure
```
bridge-bidding-discussion-website/
├── frontend/                      # React application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── contexts/             # React contexts (auth)
│   │   ├── utils/               # Utility functions & API calls
│   │   ├── main.tsx             # Application entry point
│   │   └── index.css            # Global styles
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── backend/                      # Express API server
│   ├── src/
│   │   ├── routes/              # API route handlers
│   │   ├── middleware/          # Express middleware
│   │   ├── utils/               # Backend utilities
│   │   └── index.ts             # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── migrations/          # Database migrations
│   └── package.json             # Backend dependencies
├── docker-compose.yml            # Container orchestration
├── CLAUDE.md                     # Development guide
└── README.md                     # Project overview
```

## Database Design

### Entity Relationship Diagram
```
User ──┐
       ├── Comment
       ├── Poll ──── PollOption ──── PollVote
       ├── BiddingTable ──── Bid
       └── PollVote

Tournament ──── Board ──┐
                        ├── Comment ──── Comment (threading)
                        ├── Poll
                        ├── BiddingTable
                        └── BoardLabel ──── Label
```

### Core Entities

#### User System
```prisma
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  email     String   @unique
  password  String   // bcrypt hashed
  role      Role     @default(USER) // ADMIN, USER, GUEST
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  comments      Comment[]
  polls         Poll[]
  votes         PollVote[]
  biddingTables BiddingTable[]
}
```

#### Bridge Game Data
```prisma
model Tournament {
  id     String @id @default(cuid())
  name   String
  date   DateTime
  venue  String?
  boards Board[]
}

model Board {
  id            String @id @default(cuid())
  boardNumber   Int
  dealer        String  // NORTH, SOUTH, EAST, WEST
  vulnerability String  // None, NS, EW, Both
  northHand     String  // PBN format
  southHand     String
  eastHand      String
  westHand      String
  
  // Relationships
  tournament     Tournament     @relation(fields: [tournamentId], references: [id])
  comments       Comment[]
  polls          Poll[]
  biddingTables  BiddingTable[]
  labels         BoardLabel[]
}

model BiddingTable {
  id        String @id @default(cuid())
  boardId   String
  userId    String
  createdAt DateTime @default(now())
  
  // Relationships
  board    Board @relation(fields: [boardId], references: [id])
  user     User  @relation(fields: [userId], references: [id])
  bids     Bid[]
  comments Comment[]
  polls    Poll[]
}

model Bid {
  id           String  @id @default(cuid())
  seat         String  // NORTH, SOUTH, EAST, WEST
  level        Int?    // 1-7 for suit bids
  suit         String? // C, D, H, S, NT
  call         String  // Pass, Double, Redouble, or bid
  isAlert      Boolean @default(false)
  alertText    String?
  comment      String?
  
  biddingTable BiddingTable @relation(fields: [biddingTableId], references: [id])
}
```

#### Social Features
```prisma
model Comment {
  id        String   @id @default(cuid())
  content   String
  authorId  String
  boardId   String
  parentId  String?  // For threading
  createdAt DateTime @default(now())
  
  // Relationships
  author     User      @relation(fields: [authorId], references: [id])
  board      Board     @relation(fields: [boardId], references: [id])
  parent     Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies    Comment[] @relation("CommentReplies")
  biddingTable BiddingTable? @relation(fields: [biddingTableId], references: [id])
}

model Poll {
  id          String     @id @default(cuid())
  title       String
  description String?
  pollType    PollType   // BIDDING, PLAY, GENERAL
  createdAt   DateTime   @default(now())
  isActive    Boolean    @default(true)
  
  // Relationships
  author       User         @relation(fields: [authorId], references: [id])
  board        Board        @relation(fields: [boardId], references: [id])
  options      PollOption[]
  biddingTable BiddingTable? @relation(fields: [biddingTableId], references: [id])
}

model Label {
  id          String @id @default(cuid())
  name        String @unique
  color       String // Hex color code
  description String?
  
  boards BoardLabel[]
}
```

### Key Design Decisions

1. **CUID Identifiers**: Collision-resistant unique IDs for distributed systems
2. **Soft Deletions**: Preserve data integrity by marking as deleted rather than removing
3. **Flexible Relationships**: Optional foreign keys allow features to work independently
4. **PBN Format Storage**: Standard bridge notation for hand data
5. **Hierarchical Comments**: Self-referencing for threaded discussions

## API Documentation

### Authentication Endpoints

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string",
    "role": "USER"
  }
}
```

#### `POST /api/auth/login`
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "string",
    "username": "string", 
    "email": "string",
    "role": "USER"
  }
}
```

#### `GET /api/auth/me`
Get current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": "string",
    "username": "string",
    "email": "string", 
    "role": "USER"
  }
}
```

### Tournament & Board Endpoints

#### `GET /api/tournaments`
List all tournaments with their boards.

**Query Parameters:**
- `searchTerm` (optional): Search tournaments, boards, comments
- `selectedLabels` (optional): Filter by label IDs (comma-separated)
- `vulnerability` (optional): Filter by vulnerability (None, NS, EW, Both)
- `dealer` (optional): Filter by dealer (NORTH, SOUTH, EAST, WEST)
- `boardNumberFrom` (optional): Minimum board number
- `boardNumberTo` (optional): Maximum board number  
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter

**Response:**
```json
{
  "tournaments": [
    {
      "id": "string",
      "name": "string",
      "date": "datetime",
      "venue": "string",
      "boards": [
        {
          "id": "string",
          "boardNumber": 1,
          "dealer": "NORTH",
          "vulnerability": "None",
          "northHand": "string",
          "southHand": "string", 
          "eastHand": "string",
          "westHand": "string",
          "labels": [...],
          "_count": {
            "comments": 5,
            "polls": 2
          }
        }
      ]
    }
  ]
}
```

#### `GET /api/boards/:id`
Get detailed board information.

**Response:**
```json
{
  "board": {
    "id": "string",
    "boardNumber": 1,
    "dealer": "NORTH",
    "vulnerability": "None", 
    "northHand": "string",
    "southHand": "string",
    "eastHand": "string",
    "westHand": "string",
    "tournament": {
      "id": "string",
      "name": "string",
      "date": "datetime"
    },
    "labels": [...],
    "comments": [...],
    "polls": [...]
  }
}
```

### Bidding System Endpoints

#### `POST /api/boards/:boardId/bidding`
Create a new bidding table.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bids": [
    {
      "seat": "NORTH",
      "level": 1,
      "suit": "C", 
      "call": "1C",
      "isAlert": false,
      "alertText": null,
      "comment": null
    }
  ]
}
```

**Response:**
```json
{
  "biddingTable": {
    "id": "string",
    "boardId": "string",
    "userId": "string",
    "createdAt": "datetime",
    "user": {
      "id": "string",
      "username": "string"
    },
    "bids": [...]
  }
}
```

#### `GET /api/boards/:boardId/bidding`
Get all bidding tables for a board.

**Response:**
```json
{
  "biddingTables": [
    {
      "id": "string",
      "createdAt": "datetime",
      "user": {
        "id": "string", 
        "username": "string"
      },
      "bids": [...]
    }
  ]
}
```

### Polling System Endpoints

#### `POST /api/boards/:boardId/polls`
Create a new poll.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "pollType": "BIDDING",
  "options": [
    {
      "text": "1NT",
      "description": "15-17 HCP balanced"
    }
  ],
  "biddingTableId": "string" // optional
}
```

#### `POST /api/polls/:pollId/vote`
Vote on a poll option.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "optionId": "string"
}
```

### Label Management Endpoints

#### `GET /api/labels`
Get all available labels.

**Response:**
```json
{
  "labels": [
    {
      "id": "string",
      "name": "string",
      "color": "#3B82F6",
      "description": "string"
    }
  ]
}
```

#### `POST /api/labels`
Create a new label (Admin only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "string",
  "color": "#3B82F6", 
  "description": "string"
}
```

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthModal
└── MainApp
    ├── Navigation
    ├── TournamentList
    │   ├── SearchAndFilter
    │   └── BoardPreview[]
    └── BoardDiscussion (Modal)
        ├── BoardDisplay
        ├── TabNavigation
        ├── Comments
        │   └── Comment[]
        ├── PollCreator
        ├── PollDisplay[]
        ├── BiddingEntry
        │   ├── BiddingTable
        │   ├── BidButtons
        │   └── SavedSequences[]
        └── LabelManager
```

### State Management

#### Authentication Context
```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

#### Component State Patterns
- **Local State**: React `useState` for component-specific data
- **API State**: Loading, error, and data states for API calls
- **Form State**: Controlled components with validation
- **Modal State**: Boolean flags for dialog visibility

### Key Components

#### TournamentList
Main listing component with advanced filtering capabilities.

**Features:**
- Search across tournaments, boards, and comments
- Multi-criteria filtering (labels, vulnerability, dealer, dates)
- Responsive grid layout
- Board preview with hand information

#### BoardDiscussion
Modal component for detailed board analysis.

**Features:**
- Tabbed interface (Comments, Polls, Bidding, Labels)
- Bridge hand visualization
- Interactive discussion threads
- Real-time data updates

#### BiddingEntry
Sophisticated bidding sequence creation tool.

**Features:**
- Visual bidding table with seat rotation
- Bridge rule validation (higher bids, pass counting)
- Alert and comment system
- Saved sequence management
- Proper bridge notation with symbols

#### Comments
Threaded discussion system.

**Features:**
- Nested comment replies
- Markdown-like formatting
- User attribution
- Timestamp display
- Reply threading

### Bridge-Specific Logic

#### PBN Hand Parsing
```typescript
interface Card {
  suit: 'S' | 'H' | 'D' | 'C';
  rank: string;
}

interface ParsedHand {
  spades: Card[];
  hearts: Card[];
  diamonds: Card[];
  clubs: Card[];
}

function parsePBNHand(pbnString: string): ParsedHand
```

#### Bidding Validation
```typescript
interface BidValidation {
  isValid: boolean;
  reason?: string;
}

function validateBid(
  newBid: Bid,
  previousBids: Bid[],
  currentSeat: Seat
): BidValidation
```

## Features Overview

### Current Implementation Status

#### ✅ Completed Features

**Authentication System**
- User registration and login
- JWT token management
- Role-based access control (Admin, User, Guest)
- Secure password hashing with bcrypt

**Tournament & Board Management**
- Tournament listing with board previews
- Detailed board visualization with PBN hand parsing
- Bridge hand display with proper suit symbols (♠♥♦♣)
- Vulnerability and dealer information

**Bidding System**
- Interactive bidding table creation
- Bridge rule validation (higher bids, pass counting, auction completion)
- Alert system with explanations
- Comment annotations on bids
- Saved bidding sequence management with formatted display
- Proper bridge notation with suit symbols

**Discussion System**
- Threaded comments on boards
- Real-time comment updates
- User attribution and timestamps
- Nested reply system

**Polling System**
- Create polls linked to boards or bidding sequences
- Multiple choice voting
- Poll type categorization (BIDDING, PLAY, GENERAL)
- Public voting results
- Link polls to specific bidding sequences

**Labeling & Search**
- Color-coded label system for board categorization
- Advanced search with multiple criteria
- Filter by labels, vulnerability, dealer, board numbers, dates
- Full-text search across tournaments, boards, and comments

**UI/UX Features**
- Responsive design with Tailwind CSS
- Modal-based navigation
- Tabbed interface for board details
- Loading states and error handling
- Bridge-themed color coding (NS = blue, EW = red)

#### 🚧 Partially Implemented Features

**Tournament Import**
- Database schema supports PBN import
- Manual data entry interface exists
- Automated import from external sources not implemented

**Play Sequences**
- Database models defined
- UI components not yet built
- Card play analysis features planned

#### 📋 Planned Features

**File Management**
- PBN file upload interface
- Bulk tournament import
- Export discussions and analyses

**Advanced Analytics**
- Bidding pattern analysis
- Statistical reporting on discussions
- Most discussed boards/topics

**Real-time Features**
- WebSocket integration for live updates
- Notifications for new comments/polls
- Live bidding collaboration

### How Features Work Together

#### Core User Journey
1. **Discovery**: Users browse tournaments and boards via TournamentList
2. **Analysis**: Click board to open BoardDiscussion modal
3. **Participation**: Add comments, vote in polls, create bidding sequences
4. **Organization**: Apply labels for categorization
5. **Collaboration**: Reference bidding sequences in discussions

#### Data Relationships
- **Boards** are the central entity linking all features
- **Comments** and **Polls** create discussions around boards
- **BiddingTables** provide specific bidding scenarios for analysis
- **Labels** enable organization and discovery
- **Users** own and participate in all social features

#### Bridge-Specific Integration
- **Bidding Rules**: Enforced in real-time during sequence creation
- **Terminology**: Proper bridge vocabulary throughout UI
- **Notation**: Standard symbols and formatting for bids and hands
- **Context**: Features designed around bridge-specific analysis needs

## Authentication System

### JWT Implementation

#### Token Structure
```javascript
{
  "userId": "string",
  "email": "string", 
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234567890
}
```

#### Security Features
- **bcrypt Hashing**: 12 salt rounds for password protection
- **7-day Expiration**: Automatic token invalidation
- **Role Verification**: Route-level authorization
- **XSS Protection**: HTTPOnly cookie option available

#### Middleware Implementation
```typescript
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### Frontend Integration

#### AuthContext Provider
```typescript
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Auto-verify token on app startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
  }, []);
  
  // Context value and methods...
};
```

#### Protected Routes Pattern
```typescript
const protectedEndpoint = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/protected', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (response.status === 401) {
    // Redirect to login
    logout();
  }
  
  return response.json();
};
```

## Data Flow

### Frontend to Backend Communication

```
User Action (Frontend)
        ↓
Component Event Handler
        ↓
API Utility Function
        ↓
HTTP Request + JWT Token
        ↓
Express Route Handler
        ↓
Authentication Middleware
        ↓
Authorization Check
        ↓
Prisma Database Query
        ↓
JSON Response
        ↓
Frontend State Update
        ↓
Component Re-render
```

### Example: Creating a Bidding Sequence

1. **User Input**: User clicks bid buttons in BiddingEntry component
2. **State Update**: Local state tracks current bidding sequence
3. **Validation**: Bridge rules validated in real-time
4. **Save Action**: User clicks "Save Bidding Sequence" 
5. **API Call**: POST request to `/api/boards/:id/bidding` with JWT
6. **Authentication**: Backend verifies user token
7. **Database Write**: Prisma creates BiddingTable and Bid records
8. **Response**: New bidding table data returned
9. **UI Update**: Component refreshes to show saved sequence
10. **State Sync**: Local bidding state cleared for new sequence

### Error Handling Flow

```
API Error
    ↓
HTTP Status Code Check
    ↓
Error Type Determination
    ↓
User-Friendly Message
    ↓
Component Error State
    ↓
UI Error Display
```

### Data Caching Strategy

- **No Global Cache**: Fresh data fetched on navigation
- **Component-Level Caching**: Prevent duplicate API calls during component lifecycle
- **Optimistic Updates**: Immediate UI feedback for user actions
- **Error Recovery**: Retry mechanisms for failed requests

## Development Guide

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Initial Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd bridge-bidding-discussion-website
```

2. **Environment Configuration**
```bash
# Backend .env
DATABASE_URL="postgresql://bridge_user:bridge_pass@localhost:5432/bridge_db"
JWT_SECRET="your-jwt-secret-key"
PORT=3001

# Frontend .env (if needed)
VITE_API_URL="http://localhost:3001"
```

3. **Start Development Environment**
```bash
# Start database
docker-compose up -d

# Install dependencies
cd frontend && npm install
cd ../backend && npm install

# Run database migrations
cd backend && npx prisma migrate dev

# Start development servers
cd frontend && npm run dev      # Terminal 1
cd backend && npm run dev       # Terminal 2
```

### Development Workflow

#### Database Changes
```bash
# Edit backend/prisma/schema.prisma
# Generate migration
npx prisma migrate dev --name descriptive-name

# Reset database (development only)
npx prisma migrate reset
```

#### API Development
```bash
# Test API endpoints
curl -X GET http://localhost:3001/api/health

# View database in browser
npx prisma studio
```

#### Frontend Development
```bash
# Start with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

### Code Quality Standards

#### TypeScript Configuration
- Strict mode enabled
- No implicit any types
- Consistent import/export patterns

#### Component Patterns
```typescript
// Consistent prop interface naming
interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction: (data: any) => void;
}

// Functional component with FC type
const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = defaultValue,
  onAction
}) => {
  // Component logic
};

export default ComponentName;
```

#### API Response Patterns
```typescript
// Consistent success responses
{
  "message": "Operation successful",
  "data": { /* response data */ }
}

// Consistent error responses  
{
  "error": "Error message",
  "details": "Additional context"
}
```

### Testing Strategy

#### Unit Testing (Planned)
- Component testing with React Testing Library
- API endpoint testing with Jest and Supertest
- Database query testing with Prisma test client

#### Integration Testing (Planned)
- End-to-end user flows with Playwright
- API integration tests
- Database migration testing

#### Manual Testing
- Cross-browser compatibility
- Mobile responsiveness
- Authentication flows
- Bridge-specific logic validation

## Deployment

### Production Environment Setup

#### Docker Configuration
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: bridge_production
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

#### Environment Variables
```bash
# Production .env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@db:5432/bridge_production"
JWT_SECRET="strong-production-secret"
CORS_ORIGIN="https://yourdomain.com"
```

### Deployment Steps

1. **Build Applications**
```bash
# Frontend production build
cd frontend && npm run build

# Backend compilation
cd backend && npm run build
```

2. **Database Migration**
```bash
# Run production migrations
npx prisma migrate deploy
```

3. **Container Deployment**
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoring & Maintenance

#### Health Checks
- API health endpoint: `GET /api/health`
- Database connectivity validation
- JWT token verification

#### Backup Strategy
- Daily PostgreSQL backups
- Transaction log archiving
- Point-in-time recovery capability

#### Performance Optimization
- Database query optimization
- API response caching
- Frontend bundle optimization
- CDN for static assets

---

*This documentation reflects the current state of the Bridge Bidding Discussion Website as of the last update. For the most current information, refer to the codebase and commit history.*
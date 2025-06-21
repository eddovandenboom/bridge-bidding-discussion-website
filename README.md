# Bridge Bidding Discussion Website

A comprehensive web application for bridge players to analyze and discuss bridge hands, bidding sequences, and tournament boards. Built with modern web technologies and designed for both casual and competitive bridge players.

## Features

### 🃏 Bridge Game Support
- **Tournament Management**: Import and manage bridge tournaments from PBN files
- **Visual Board Display**: Interactive bridge table layout with proper hand positioning
- **Dealer & Vulnerability**: Clear visual indicators for dealer position and vulnerability status
- **Bridge Notation**: Full support for bridge symbols (♠♥♦♣) and proper suit coloring

### 💬 Discussion & Analysis
- **Comments System**: Discuss hands and strategies with other players
- **Polls & Voting**: Create polls for bidding decisions with multiple choice options
- **Bidding Entry**: Enter and analyze bidding sequences with rule validation
- **Label Management**: Categorize boards with custom labels for easy organization

### 🔐 User Management
- **Authentication**: Secure user registration and login with JWT tokens
- **User Roles**: Different permission levels for administrators and players
- **Profile Management**: User profiles with activity tracking

### 🔍 Search & Navigation
- **Advanced Search**: Filter boards by various criteria
- **Tournament Navigation**: Easy browsing between tournaments and boards
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Context API** for state management

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL
- **JWT** for authentication
- **PBN Parser** for bridge file import

### Infrastructure
- **Docker** containers for easy deployment
- **PostgreSQL** database
- **RESTful API** design

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Docker (optional, for containerized deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/bridge-bidding-discussion-website.git
   cd bridge-bidding-discussion-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database configuration
   ```

4. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend  
   cd frontend && npm run dev
   ```

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

## Project Structure

```
bridge-bidding-discussion-website/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React context providers
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript type definitions
│   └── package.json
├── backend/                  # Express.js backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── utils/           # Backend utilities
│   │   └── index.ts         # Server entry point
│   ├── prisma/              # Database schema and migrations
│   └── package.json
├── docker-compose.yml        # Docker configuration
└── README.md
```

## API Documentation

The backend provides a RESTful API with the following main endpoints:

- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/:id` - Get tournament details
- `GET /api/boards/:id` - Get board details
- `POST /api/boards/:id/comments` - Add comment to board
- `POST /api/boards/:id/polls` - Create poll for board
- `POST /api/polls/:id/vote` - Vote on poll
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Bridge Rules Implementation

The application implements proper bridge rules including:
- **Bidding Validation**: Ensures bids follow ascending order (level and suit hierarchy)
- **Auction Completion**: Automatically detects when bidding is complete
- **Special Calls**: Support for Pass, Double, and Redouble with proper restrictions
- **Dealer Rotation**: Correct dealer assignment and turn order
- **Vulnerability**: Proper vulnerability display and tracking

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with modern web development best practices
- Follows bridge game rules and conventions
- Designed for the bridge playing community

---

🤖 *This project was developed with assistance from [Claude Code](https://claude.ai/code)*
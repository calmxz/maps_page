# Map Vite Project

A full-stack map application built with React (frontend) and Node.js/Express (backend).

## Project Structure

```
map-vite/
├── frontend/          # React application (Vite)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/           # Node.js/Express API
│   ├── server.js
│   ├── package.json
│   └── config.env
├── package.json       # Root package.json for managing both apps
└── README.md
```

## Features

- **Frontend**: React 19 with Vite for fast development
- **Backend**: Express.js API with CORS support
- **Development**: Concurrent development servers
- **Security**: Helmet middleware for security headers
- **Logging**: Morgan for HTTP request logging

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install:all
   ```

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Individual Development Servers

Start only the frontend:
```bash
npm run dev:frontend
```

Start only the backend:
```bash
npm run dev:backend
```

### Building for Production

Build both applications:
```bash
npm run build
```

### API Endpoints

- `GET /` - API status
- `GET /api/health` - Health check
- `GET /api/maps` - Sample map data

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development
- `npm run install:all` - Install dependencies for all packages
- `npm run build` - Build both applications
- `npm run lint` - Lint both frontend and backend

### Frontend (in frontend/ directory)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend (in backend/ directory)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Technologies Used

### Frontend
- React 19
- Vite
- ESLint

### Backend
- Node.js
- Express.js
- CORS
- Helmet (security)
- Morgan (logging)
- dotenv (environment variables)

## Development Workflow

1. Make changes to frontend code in `frontend/src/`
2. Make changes to backend API in `backend/server.js`
3. Both servers will hot-reload automatically
4. Frontend can make API calls to backend at `http://localhost:5000`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

ISC 
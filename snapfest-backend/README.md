# SnapFest Backend

Event management platform backend API.

## Project Structure

```
snapfest-backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Middleware functions
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── config/         # Configuration files
├── uploads/            # File uploads
├── .env               # Environment variables
├── server.js         # Main server file
└── package.json      # Dependencies
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables in `.env`

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## API Endpoints

- Health Check: `GET /api/health`

## Environment Variables

- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRE`: JWT expiration time







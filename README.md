# Roadmap App

A roadmap publishing application with public quarterly views and authenticated editing.

## Features

- **Authentication**: Email/password login for editing access
- **Public View**: Roadmaps viewable by quarters (Q1, Q2, Q3, Q4)
- **Item Management**: Add/remove roadmap items with tags and quarter assignments
- **Themes**: Dark and light mode support
- **Data Storage**: MongoDB for persistent data

## Project Structure

```
roadmap-app/
├── backend/          # Node.js API (Express + MongoDB)
├── frontend/         # React TypeScript app
├── shared/           # Shared types and utilities
└── package.json      # Root package with dev scripts
```

## Development

1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

This will start both backend API (port 5000) and React frontend (port 3000) concurrently.

## Environment Setup

Create a `.env` file in the backend directory:
```
MONGODB_URI=mongodb://localhost:27017/roadmap-app
JWT_SECRET=your_jwt_secret_here
PORT=5000
```
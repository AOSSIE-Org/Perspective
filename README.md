# opposing-perspective-ai

A web application that analyzes articles and provides opposing perspectives through AI-powered analysis.

## Project Structure

- `backend/` - FastAPI backend server
- `frontend/` - React.js frontend application
- `src/components/` - Reusable UI components
- `src/pages/` - Page components for different routes
- `public/` - Static assets

## Getting Started

### Backend
See `backend/README.md` for backend setup instructions.

### Frontend
See `frontend/README.md` for frontend setup instructions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Available Scripts

- `npm start` - Runs the development server
- `npm build` - Builds the app for production
- `npm test` - Runs tests
- `npm run eject` - Ejects from Create React App

# Opposing Perspective AI - Backend

FastAPI backend for the Opposing Perspective AI project.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run development server:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

- `POST /api/v1/article-summary`: Get article summary
- `POST /api/v1/scrape-url`: Scrape article content

## Documentation

- API docs available at `/docs` or `/redoc`
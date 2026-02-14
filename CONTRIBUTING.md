# 🌟 Contributing to Perspective

Hi there! Thank you for considering contributing to PictoPy – we’re excited to collaborate with you. Whether you're fixing a bug, improving documentation, or suggesting a new feature — you're welcome here!

NOTE: Please do not open a PR for the issue which is not yet reviewed and labelled by the maintainer. Wait for the maintainer to give a green light.


# 🛠 Setting Up the Project

Follow these steps to run Perspective locally.

Install:

- Node.js 18+
- Python 3.10+
- uv package manager → https://docs.astral.sh/uv/
- API keys:
  - OpenAI/Groq
  - Pinecone (or other Vector DB)
  - Google Custom Search

## Clone Repository

```bash
git clone https://github.com/AOSSIE-Org/Perspective.git
cd Perspective
```

## Frontend (Next.js)

1. Install dependencies
```bash 
cd frontend
npm install
```

2. Configure environment
```bash
cp .example.env .env
```

3. Start development server
```bash
npm run dev
```

Frontend runs at:
http://localhost:3000


## Backend (FastAPI + uv)

The backend uses uv for dependency management.

1. Install uv: https://docs.astral.sh/uv/

2. Install dependencies:
```bash
cd backend
uv sync
```

3. Configure environment
```bash
cp .example.env .env
```

4. Fill required keys:
```bash
GROQ_API_KEY=
PINECONE_API_KEY=
SEARCH_KEY=
PORT=8000
```

5. Run server
```bash
uv run main.py
```

Backend runs at:
http://localhost:8000



# 🚀 How to Contribute

1. Pick an issue and get it assigned  
2. Fork the repository  
3. Create a new branch  
4. Make your changes and test locally  
5. Push your branch and open a Pull Request  

Please keep PRs small, focused, and follow the existing code style.



# Perspective-AI
![Perspective banner](frontend/public/perspective_banner.jpg)

### Table of Contents
- [Perspective-AI](#perspective-ai)
    - [Table of Contents](#table-of-contents)
  - [System Overview](#system-overview)
    - [High-Level Concept](#high-level-concept)
  - [Architecture Components](#architecture-components)
    - [1. Frontend Layer](#1-frontend-layer)
    - [3. Core Backend](#3-core-backend)
    - [4. AI \& NLP Integration](#4-ai--nlp-integration)
    - [5. Data Storage](#5-data-storage)
  - [Technical Stack](#technical-stack)
    - [Frontend Technologies](#frontend-technologies)
    - [Backend Technologies](#backend-technologies)
    - [I Integration](#i-integration)
  - [Core Features](#core-features)
    - [1. Counter-Perspective Generation](#1-counter-perspective-generation)
    - [2. Reasoned Thinking](#2-reasoned-thinking)
    - [3. Updated Facts](#3-updated-facts)
    - [4. Seamless Integration](#4-seamless-integration)
    - [5. Real-Time Analysis](#5-real-time-analysis)
  - [Data Flow \& Security](#data-flow--security)
  - [Setup \& Deployment](#setup--deployment)
    - [Frontend Setup](#frontend-setup)
    - [Backend Setup](#backend-setup)
  - [Architecture Diagram](#architecture-diagram)
  - [Expected Outcomes](#expected-outcomes)
  - [Required Skills](#required-skills)

---

## System Overview

Perspective-AI is designed to combat the echo chambers created by personalized content algorithms. It actively curates counterarguments and alternative narratives from credible sources alongside the content you usually see. Whether it’s a news article, blog post, or social media update, Perspective-AI analyzes the existing narrative and presents a balanced, in-depth counter-perspective. This approach not only challenges your current viewpoints but also helps broaden your understanding of complex issues—all in real time.

### High-Level Concept
Imagine having a smart, opinionated friend who isn’t afraid to challenge your beliefs with well-articulated counterpoints—that’s Perspective-AI in a nutshell!

---

## Architecture Components

### 1. Frontend Layer
- **Next.js UI**: A sleek, responsive interface that displays content alongside counter perspectives.

### 3. Core Backend
- **FastAPI Server**: A high-performance API server handling requests, content analysis, and response delivery.
- **Content Analyzer**: Processes incoming articles or posts to identify the dominant narrative.
- **Counter-Narrative Engine**: Uses advanced AI and NLP techniques to generate alternative perspectives and reasoned analyses.

### 4. AI & NLP Integration
- **LLM Service**: Leverages large language models (e.g., OpenAI, custom models) to generate detailed counterarguments.
- **LangChain & Langgraph**: Frameworks to manage chains of reasoning and workflow orchestration for coherent narrative generation.

### 5. Data Storage
- **VectorDB**: A vector database for storing semantic embeddings to efficiently retrieve and compare content.

---

## Technical Stack

### Frontend Technologies
 - **framework**: Next.js
- **styling**: TailwindCSS

### Backend Technologies
  - **framework**: FastAPI
  - **language**: Python
  - **AI & NLP**: LangChain, Langgraph, Prompt Engineering
  - **database**: Any VectorDB


### I Integration

  - **LLM**: OpenAI, Other NLP Models
  - **processing**:Context-Aware


---

## Core Features

### 1. Counter-Perspective Generation
- **What It Does**: Instantly displays counterarguments to the main narrative.
- **How It Works**: Analyzes content to identify biases and generates alternative viewpoints.


### 2. Reasoned Thinking
- **What It Does**: Breaks down narratives into logical, connected arguments.
- **How It Works**: Uses chain-of-thought prompting and connected fact analysis.

### 3. Updated Facts
- **What It Does**: Provides real-time updates and the latest facts along with counter-narratives.
- **How It Works**: Continuously pulls data from trusted sources and updates the insights.

### 4. Seamless Integration
- **What It Does**: Integrates effortlessly with existing news, blogs, and social media platforms.
- **How It Works**: Uses custom integration modules and API endpoints.

### 5. Real-Time Analysis
- **What It Does**: Generates insights instantly as you browse.
- **How It Works**: Employs real-time processing powered by advanced AI.

---

## Data Flow & Security

```mermaid
sequenceDiagram
    %% Define Participants
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant AI as AI Service
    participant D as Data Storage

    %% Interaction Flow
    U->>F: Request/View Content
    F->>B: Forward Request
    B->>AI: Analyze Content & Generate Counter Perspective
    AI->>B: Return Counter Analysis   
    B->>F: Deliver Results
    F->>U: Display Balanced Insights

    %% Notes for Clarity
    Note over AI: AI generates counter analysis
    Note over B: Backend processes logic
    Note over F: Frontend updates UI
```
---

## Setup & Deployment

### Frontend Setup

Setup environment variables:*
  - add .env file in `/frontend`directory.
  - add following environment variable in your .env file.
```
NEXT_PUBLIC_API_URL = http://localhost:8000

```

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

*Get HuggingFace Access Token:*
- Go to HuggingFace website and create new access token.
- copy that token

*Install uv:*
- install **uv** from [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)


*Setup environment variables:*
  - add .env file in `/backend`directory.
  - add following environment variable in your .env file.
  ```
GROQ_API_KEY= <groq_api_key>
PINECONE_API_KEY = <your_pinecone_API_KEY>
PORT = 8000
SEARCH_KEY = <your_Google_custom_search_engine_API_key>
HF_TOKEN = <your_huggingface_access_token>
  ```

*Run backend:*
```bash
cd backend
uv sync # Creating virtual environment at: .venv
uv run main.py #Runs the backend server
```

---


## Architecture Diagram


```mermaid
graph TB
    %% Define Subgraphs with Colors and Text Styles
    subgraph Client Side
        style UI fill:#FFDDC1,stroke:#FF6600,stroke-width:2px,color:#000,font-weight:bold
        UI[Next.js UI]
    end

    subgraph Server Side
        style API fill:#D1E8FF,stroke:#005BBB,stroke-width:2px,color:#000,font-weight:bold
        style Analyzer fill:#D1E8FF,stroke:#005BBB,stroke-width:2px,color:#000,font-weight:bold
        style CNEngine fill:#D1E8FF,stroke:#005BBB,stroke-width:2px,color:#000,font-weight:bold
        style Context fill:#D1E8FF,stroke:#005BBB,stroke-width:2px,color:#000,font-weight:bold
        API[FastAPI Server]
        Analyzer[Content Analyzer]
        CNEngine[Counter-Narrative Engine]
        Context[Context Manager]

    end

    subgraph AI & NLP Layer
        style LLM fill:#E6FFCC,stroke:#66BB66,stroke-width:2px,color:#000,font-weight:bold
        style LangChain fill:#E6FFCC,stroke:#66BB66,stroke-width:2px,color:#000,font-weight:bold
        style Langgraph fill:#E6FFCC,stroke:#66BB66,stroke-width:2px,color:#000,font-weight:bold
        LLM[LLM Service]
        LangChain[LangChain]
        Langgraph[Langgraph]
    end

    subgraph Data Storage
        style VectorDB fill:#FFDDEE,stroke:#CC3366,stroke-width:2px,color:#000,font-weight:bold
        VectorDB[(Vector Database)]
    end

    %% Define Connections with Labels
    style Browser fill:#FFFF99,stroke:#FFAA00,stroke-width:2px,color:#000,font-weight:bold
    Browser -->|User Interaction| UI
    UI -->|Requests| API
    API -->|Process| Analyzer
    Analyzer -->|Analysis| CNEngine
    CNEngine -->|Generates| LLM
    LLM -->|Uses| LangChain
    LLM -->|Uses| Langgraph
    API -->|Manages| Context
    CNEngine -->|Stores| VectorDB
    API -->|Responses| UI

```

---

## Expected Outcomes

- **Less Bias in Narratives**: Break out of echo chambers and question prevailing narratives.
- **Wider Perspectives**: Broaden your understanding of complex issues.
- **Better Discourse**: Enable balanced, informed discussions.
- **Sharper Analysis**: Improve critical thinking by comparing connected facts and counter-facts.

---

## Required Skills

- **Frontend Development**:  Experience with Next.js and modern UI frameworks.
- **Backend Development**: Proficiency in Python and FastAPI.
- **AI & NLP**: Familiarity with LangChain, Langgraph, and prompt engineering techniques.
- **Database Management**: Knowledge of vector databases system.

---

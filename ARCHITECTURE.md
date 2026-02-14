
## Architecture Diagram


This document explains the internal design and workflow of Perspective.

Perspective follows a simple client–server architecture where:
- The frontend handles user interaction
- The backend processes content
- AI services generate counter-perspectives
- A vector database enables semantic retrieval

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



# Perspective 

Perspective-AI is an AI-powered web platform that analyzes articles and generates fact-checked counter-perspectives using LLMs to reduce bias and promote balanced understanding.

# Want to Contribute? 😄

&nbsp;&nbsp;&nbsp;<a href="https://discord.gg/hjUhu33uAn"><img src="https://github.com/user-attachments/assets/3ed93273-5055-4532-a524-87a337a4fbba" height="40" alt="Discord server invite"></a>

1. First, join the **[Discord Server](https://discord.gg/hjUhu33uAn) (Go to Projects->Perspective)** to chat with everyone.
2. For detailed setup instructions, coding guidelines, and the contribution process, please check out our [CONTRIBUTING.md](./CONTRIBUTING.md) file.

## Architecture

For detailed Architecture, please check out our [ARCHITECTURE.md](./ARCHITECTURE.md) 

### Frontend
- Next.js: Web UI framework for building the responsive client interface  
- TailwindCSS: Styling and layout system  

### Backend (Python)
- FastAPI: API server handling requests and routing  
- Content Analyzer: Extracts and processes article text  
- Counter-Narrative Engine: Generates alternative perspectives using AI  
- Context Manager: Manages request flow and reasoning state  

### AI & NLP
- LLMs (OpenAI/Groq/others): Generate counterarguments and summaries  
- LangChain: Prompt chaining and reasoning workflows  
- LangGraph: Graph-based orchestration of AI pipelines  
- Fact Checking: Web search + source verification  

### Data & Storage
- Vector Database (Pinecone/others): Stores embeddings for semantic search  
- Embeddings: Enables similarity matching and fast retrieval


  
## Features

- AI-generated counter-perspectives for articles and online content  
- Bias detection and balanced narrative analysis  
- Fact-checking with trusted sources and real-time updates  
- Structured reasoning using LLM chains and workflows  
- FastAPI + Next.js powered real-time processing  
- Vector search for semantic retrieval and exploration  
- Clean, responsive web interface for seamless reading

## Technical Stack

<table>
<tr>
<th align="left">Component</th>
<th align="left">Technology</th>
</tr>

<tr>
<td><b>Frontend Framework</b></td>
<td>Next.js</td>
</tr>

<tr>
<td><b>Styling</b></td>
<td>TailwindCSS</td>
</tr>

<tr>
<td><b>Backend API</b></td>
<td>FastAPI</td>
</tr>

<tr>
<td><b>Programming Language</b></td>
<td>Python</td>
</tr>

<tr>
<td><b>LLM Provider</b></td>
<td>OpenAI / Groq</td>
</tr>

<tr>
<td><b>AI Orchestration</b></td>
<td>LangChain</td>
</tr>

<tr>
<td><b>Workflow Engine</b></td>
<td>LangGraph</td>
</tr>

<tr>
<td><b>Vector Database</b></td>
<td>Pinecone (or any VectorDB)</td>
</tr>

<tr>
<td><b>Fact Checking</b></td>
<td>Google Custom Search API</td>
</tr>

<tr>
<td><b>Package Manager (Frontend)</b></td>
<td>npm</td>
</tr>

<tr>
<td><b>Package Manager (Backend)</b></td>
<td>uv</td>
</tr>

<tr>
<td><b>Deployment</b></td>
<td>Vercel</td>
</tr>

<tr>
<td><b>Containerization</b></td>
<td>Docker (optional)</td>
</tr>

</table>

---

Our Code of Conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)



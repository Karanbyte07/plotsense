# PlotSense 🎬

> **Hybrid Movie Discovery Engine** — BM25+ lexical retrieval fused with dense semantic search, FAISS indexing, cross-encoder reranking, and grounded explanations. Tuned for Gotham nights.

---

## 🌟 Overview

PlotSense is a search-first movie discovery platform built to overcome the limitations of traditional keyword search and pure semantic vector search.

- **Keyword search alone** fails on queries like *"movies that feel like a fever dream"* because none of those words appear in the script or plot synopsis.
- **Semantic search alone** struggles with precise titles and exact names like *"The Dark Knight"* or handling explicit negations (*"not horror"*).

PlotSense uses a **hybrid retrieve-and-rerank architecture**: running both lexical and semantic retrieval in parallel, fusing their rankings, applying intent-aware metadata boosts, and reranking top candidates with a cross-encoder model for maximum relevance and zero hallucination.

---

## 🏛️ System Architecture

```text
Your Sentence / Query
      │
      ▼
[1] UNDERSTAND   →  Extract genres, moods, decades, "like X", "not Y", ratings
      │
      ├───────────────────────┬───────────────────────┐
      ▼                       ▼                       │
[2a] BM25+ (Words)       [2b] BGE Embeddings (Meaning)│  Each retrieves top-80
     Rank by term freq        Dense vector search     │
     & inverse doc freq       via FAISS index         │
      └───────────┬───────────┘                       │
                  ▼                                   │
[3] FUSION        →  Reciprocal Rank Fusion (RRF)     │
                     or Weighted Min-Max blend        │
                  ▼                                   │
[4] BOOSTS        →  Nudge by genre/decade/rating,    │
                     strictly penalize negations      │
                  ▼
[5] RERANK        →  Cross-Encoder (ms-marco-MiniLM)
                     jointly scores (query, candidate)
                  ▼
[6] EXPLAIN       →  Grounded one-line "why this matched"
                  ▼
          Ranked Results + Telemetry
```

---

## 🔍 Retrieval & ML Pipeline

### 1. The Corpus
- **9,500+ curated films** compiled from public movie databases.
- Each document contains structured fields (`title`, `year`, `genres`, `overview`, `keywords`, `director`, `vote_average`, `poster_url`).
- Two specialized representations are generated for indexing:
  - `semantic_text`: Natural, descriptive text paragraph fed to vector embeddings.
  - `lexical_text`: Keyword-dense token bag fed to BM25+.

### 2. Lexical Engine (BM25+)
- Normalized, tokenized, and lemmatized NLP pipeline with stopword removal.
- **BM25+** penalizes document length bias and term saturation while guaranteeing a small score floor ($\delta = 1.0$) so longer documents aren't unfairly suppressed.
- Captures exact titles, actors, directors, and specific vocabulary.

### 3. Semantic Engine (Embeddings + FAISS)
- Model: `BAAI/bge-small-en-v1.5` (384-dimensional dense vectors).
- **FAISS Inner-Product Index**: Flat exact cosine similarity search over all 9,500 embeddings in < 10 ms.
- Asymmetric query instruction prefixing for enhanced passage retrieval.

### 4. Fusion Strategies
- **Reciprocal Rank Fusion (RRF)** *(Default)*:
  $$\text{Score}(d) = \sum_{m \in \{\text{lex}, \text{sem}\}} \frac{1}{k + \text{rank}_m(d)} \quad (k = 60)$$
  Scale-free and robust against outlier scores.
- **Weighted Min-Max Blend**: Real-time adjustable balance between lexical weight and semantic weight via UI slider.

### 5. Cross-Encoder Reranking
- Model: `cross-encoder/ms-marco-MiniLM-L-6-v2`.
- Performs full cross-attention over `(query, movie_summary)` pairs for the top-40 shortlist.
- Resolves subtle semantic nuances and word interactions that bi-encoders miss.

### 6. Grounded Explanations
- Generates natural, human-readable match justifications based **strictly on verified metadata** (genre matches, director, year, matched terms, rating). Zero LLM hallucinations.

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS (custom *Gotham Noir* palette)
- **Animations**: Framer Motion
- **Typography**: Fraunces (Display), Inter Tight (UI), JetBrains Mono (Telemetry)
- **Features**: Interactive search console, debounced autocomplete, animated score meters (Lexical vs Semantic), dynamic engine controls, and accessible movie detail dialog.

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Vector Search**: FAISS (CPU-optimized)
- **Embedding Models**: Hugging Face `sentence-transformers` (`BAAI/bge-small-en-v1.5`)
- **Reranker**: `cross-encoder/ms-marco-MiniLM-L-6-v2`
- **NLP**: `rank-bm25`, NLTK (WordNet lemmatization, stopwords)
- **Server**: Uvicorn ASGI

---

## 📂 Project Structure

```text
PlotSense/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application, CORS, and lifespans
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── config.py            # Global settings & model configurations
│   │   └── engine/
│   │       ├── search.py        # End-to-end retrieval orchestrator
│   │       ├── lexical.py       # BM25+ search implementation
│   │       ├── semantic.py      # BGE embedding + FAISS vector search
│   │       ├── fusion.py        # RRF and weighted rank fusion
│   │       ├── rerank.py        # Cross-encoder reranker wrapper
│   │       ├── slm.py           # Query parsing & grounded explanations
│   │       └── preprocess.py    # NLP cleaning, lemmatizing & tokenization
│   ├── data/                    # Corpus JSON, precomputed embeddings & indexes
│   ├── scripts/
│   │   ├── build_corpus.py      # Build unified corpus dataset
│   │   └── build_index.py       # Generate FAISS embeddings & lexical tokens
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchConsole.jsx    # Combobox search, suggestions & engine controls
│   │   │   ├── ResultsGrid.jsx      # Responsive 2-to-5 column movie card grid
│   │   │   ├── MovieCard.jsx        # Film card with hover sweep & score meters
│   │   │   ├── ScoreMeter.jsx       # Circular score ring + lexical/semantic breakdown
│   │   │   ├── QueryInsight.jsx     # Visual display of query understanding
│   │   │   ├── MovieDetail.jsx      # Modal with full overview & "More like this"
│   │   │   ├── EmptyState.jsx       # Landing screen with poster marquee & sample chips
│   │   │   ├── Wordmark.jsx         # Animated logo
│   │   │   └── Atmosphere.jsx       # Background vignette, film grain & bat-signal glow
│   │   ├── lib/
│   │   │   ├── api.js               # Backend fetch client
│   │   │   └── format.js            # Formatters (runtime, rating, language)
│   │   ├── styles/globals.css       # Design tokens, custom scrollbar & base styles
│   │   ├── App.jsx                  # Root state machine
│   │   └── main.jsx
│   ├── vite.config.js               # Dev proxy & path aliases
│   └── tailwind.config.js
│
├── README.md
```

---

## 🚀 Getting Started

### 1. Run the Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# (On Linux / macOS)
# python3 -m venv .venv && source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

> **API Documentation**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser for the interactive Swagger UI.

---

### 2. Run the Frontend

In a separate terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

> **Web App**: Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser to start searching!

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service health status, corpus count, and loaded models |
| `GET` | `/api/stats` | Catalog statistics, sample queries, and top-rated films |
| `GET` | `/api/suggest?q={query}&limit=8` | Fast title autocomplete suggestions |
| `POST` | `/api/search` | Execute hybrid retrieval with custom fusion & reranking |
| `GET` | `/api/movie/{id}` | Full metadata for a specific film |
| `GET` | `/api/movie/{id}/similar?limit=8` | "More like this" recommendations using film embeddings |

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

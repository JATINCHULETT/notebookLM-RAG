# NotebookLM Clone (RAG Pipeline)

A full-stack Retrieval-Augmented Generation (RAG) application inspired by Google's NotebookLM. This project allows users to upload custom documents (PDFs or plain text) and ask natural language questions. The system grounds its answers exclusively in the content of the uploaded documents.

**Live Project Link:** [Insert your Vercel Link here]

## Architecture & Data Flow

This application implements a complete end-to-end RAG pipeline:

1. **Ingestion:** 
   Users upload a document via the premium Next.js frontend. The file is temporarily buffered in memory to respect serverless architecture constraints (bypassing the need for long-term cloud blob storage during initial parsing).

2. **Parsing & Chunking:**
   The `PDFLoader` extracts raw text from the document. The text is then processed using a **Recursive Character Text Splitter**.
   - **Chunking Strategy:** The document is recursively split using semantic delimiters (paragraphs `\n\n`, then sentences `\n`, then words) to keep related ideas together.
   - **Parameters:** `chunkSize` is set to 1,000 characters, and `chunkOverlap` is set to 200 characters. This overlap ensures that context isn't severed abruptly at the chunk boundaries, maintaining logical continuity for the LLM.

3. **Embedding:**
   The textual chunks are transformed into high-dimensional vector representations using Google's `gemini-embedding-2` model via the LangChain Google GenAI integration.

4. **Storage:**
   The embedded vectors and their corresponding metadata (the original text chunks and source file names) are indexed into **Qdrant Cloud**, a highly scalable vector database. Each upload dynamically generates a unique collection name to prevent context bleeding between different documents.

5. **Retrieval:**
   When a user submits a query, the query itself is embedded using the same Gemini model. The system queries Qdrant using vector similarity search to retrieve the top 3 (`k=3`) most semantically relevant chunks.

6. **Generation:**
   The retrieved chunks are injected into a strict Prompt Template. This prompt is passed to Google's **Gemini 2.5 Flash** LLM. The prompt explicitly instructs the LLM to answer *only* based on the retrieved context, preventing hallucination or reliance on the model's pre-trained knowledge.

## Tech Stack

* **Frontend:** Next.js (App Router), React, Vanilla CSS (Glassmorphism design, zero external UI libraries)
* **Backend:** Next.js API Routes (Serverless)
* **LLM & Embeddings:** Google Gemini (`gemini-2.5-flash`, `gemini-embedding-2`)
* **Vector Database:** Qdrant Cloud
* **Orchestration:** LangChain (`@langchain/core`, LCEL runnables)
* **Document Parsing:** `pdf-parse` / `PDFLoader`

## Local Setup

If you wish to run this application locally:

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Duplicate `.env.example` to `.env.local` and configure your API keys:
   ```env
   GOOGLE_API_KEY="your_google_gemini_key"
   QDRANT_URL="your_qdrant_cloud_url"
   QDRANT_API_KEY="your_qdrant_api_key"
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Navigate to `http://localhost:3000` in your browser.

## Evaluation Criteria Addressed

* **RAG Pipeline:** Fully implemented from chunking to generation.
* **Answer Quality:** Grounded exclusively in the document via prompt engineering and LCEL Retrieval Chains.
* **Chunking Strategy:** Explicitly defined and documented (Recursive Character with overlaps).
* **Vector DB:** Qdrant used for scalable vector storage and cosine similarity retrieval.
* **UI/UX:** Built a premium interface with smooth transitions, gradients, and custom scrollbars without relying on Tailwind.

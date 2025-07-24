<<<<<<< HEAD
# 📘 Engineering Tutor AI: Agentic Research Assistant for Engineering Education
=======
# Engineering Tutor AI: Agentic Research Assistant for Engineering Education
>>>>>>> upstream/main

A smart, interactive platform to revolutionize engineering education using Retrieval-Augmented Generation (RAG), AI voice tools, and visual learning enhancements.

---

<<<<<<< HEAD
## 🎬 Demo Videos
- 🧪 [Product Walkthrough](https://github.com/user-attachments/assets/b2d8fa7f-f7df-431d-b1f5-64173e8b7944)
- 🛠️ [Code Explanation](https://github.com/user-attachments/assets/a4dc6e7f-1783-41e5-b5c7-9b1cc3810da2)

---

## ⚙️ Setup & Installation Guide

### 🔧 Prerequisites

- Node.js (v18 or later)
- MongoDB
- FFmpeg
- eSpeak (for enhanced TTS)


---

### 🧪 Step-by-Step Installation

#### 1. Clone the Repo

```bash
git clone https://github.com/AswanthAllu/intern_project.git
cd intern_project
```

#### 2. Install System Dependencies

**FFmpeg Installation:**
- **Windows**: Download from [FFmpeg Official](https://ffmpeg.org/download.html#build-windows)
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg` or `sudo yum install ffmpeg`

**eSpeak Installation:**
- **Windows**: Download from [eSpeak Windows](http://espeak.sourceforge.net/download.html)
- **macOS**: `brew install espeak`
- **Linux**: `sudo apt-get install espeak` or `sudo yum install espeak`

#### 3. Terminal 1: Start MongoDB

Make sure MongoDB is running locally:

```bash
mongod
```

#### 4. Terminal 2: Start Node.js Backend

```bash
cd server
npm install
```

Create `.env` in `/server`:

```
PORT=5005
MONGO_URI=mongodb://localhost:27017/chatbotGeminiDB4
GEMINI_API_KEY=your_key
JWT_SECRET=random_secret1234
HF_API_KEY=your_huggingface_api_key
```

Start backend:

```bash
npm start
```

#### 5. Terminal 3: Start React Frontend

```bash
cd client
npm install
npm start
```

---
=======
## 🎮 Demo Videos

* 🧪 [Product Walkthrough](https://github.com/user-attachments/assets/b2d8fa7f-f7df-431d-b1f5-64173e8b7944)
* 🛠️ [Code Explanation](https://github.com/user-attachments/assets/a4dc6e7f-1783-41e5-b5c7-9b1cc3810da2)

---

>>>>>>> upstream/main
## 🧠 Key Features

### 1. 🗣️ Conversational Podcast Generator

<<<<<<< HEAD
- Converts technical documents into a two-person dialogue script.
- Uses TTS (Text-to-Speech) to generate natural MP3 audio.
- FFmpeg integration for professional audio processing and export.
- **eSpeak** integration for high-quality speech synthesis.

> **Required Software**:
- [FFmpeg](https://ffmpeg.org/download.html) - Audio/video processing
- [eSpeak](http://espeak.sourceforge.net/download.html) - Text-to-speech synthesis

> **Packages**:
=======
* Converts technical documents into dialogue scripts.
* Uses TTS to generate MP3 audio.
* FFmpeg + eSpeak for high-quality synthesis.

**Requirements:**

* [FFmpeg](https://ffmpeg.org/download.html)
* [eSpeak](http://espeak.sourceforge.net/download.html)

**Packages:**
>>>>>>> upstream/main

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/core @ffmpeg-installer/ffmpeg fluent-ffmpeg say
```

<<<<<<< HEAD
> **System Setup**: 
- Install FFmpeg and add to system PATH
- Install eSpeak for enhanced TTS quality
- Windows: Download from [eSpeak Windows](http://espeak.sourceforge.net/download.html)
- macOS: `brew install espeak`
- Linux: `sudo apt-get install espeak` or `sudo yum install espeak`

---

### 2. 🧠 Interactive Mind Map Generator

- Automatically creates clean, readable mindmaps from document hierarchy.
- Styled and arranged using Dagre graph layout for intuitive structure.
- Interactive fullscreen view with zoom, pan, and drag options.

> **Packages**:
=======
### 2. 🧠 Interactive Mind Map Generator

* Creates readable mind maps with Dagre layout.
* Interactive fullscreen view.

**Packages:**
>>>>>>> upstream/main

```bash
npm install dagre reactflow react-icons react-tiny-popover
```

<<<<<<< HEAD
---

### 3. 📂 Multi-File Upload Support

- Upload and manage multiple documents (PDF, DOCX, PPTX, TXT).
- Real-time upload progress and organized action menus for each file.
- Rename, delete, convert to podcast, or generate mind map on the go.

---

### 4. 🔗 Chain-of-Thought Reasoning with RAG

- AI answers are context-aware, pulling knowledge directly from uploaded files.
- Falls back to general Gemini model only when document data is insufficient.
- Vector-based document search using FAISS for efficient retrieval.

> **Packages**:
=======
### 3. 📂 Multi-File Upload Support

* Upload PDFs, DOCX, PPTX, TXT with real-time progress.
* Action menu: rename, delete, convert to podcast, generate mind map.

### 4. 🔗 Chain-of-Thought Reasoning with RAG

* Answers pulled directly from uploaded docs.
* Uses FAISS for vector search.

**Packages:**
>>>>>>> upstream/main

```bash
npm install @langchain/community @langchain/core @langchain/google-genai faiss-node
```

<<<<<<< HEAD
---

### 5. 💾 Persistent Chat History

- User chat sessions are stored in MongoDB.
- Auto-saved and reloadable even after browser restarts.
- Modal interface for easy loading, deleting, and managing chats.

---

### 6. 🎤 STT & TTS Interaction

- STT: Convert voice queries to text using browser APIs.
- TTS: Read AI replies aloud using real-time speech engines.

> **Packages**:
=======
### 5. 💾 Persistent Chat History

* MongoDB for storing user sessions.
* Load, delete, manage chats via modal interface.

### 6. 🎤 STT & TTS Interaction

* STT: Voice-to-text using browser APIs.
* TTS: Replies spoken using real-time engines.

**Packages:**
>>>>>>> upstream/main

```bash
npm install @google-cloud/text-to-speech say
```

<<<<<<< HEAD
---

### 7. 🔍 Deep Search Integration

- **Intelligent Web Search**: Advanced search capabilities using DuckDuckGo API with intelligent query decomposition.
- **Query Optimization**: Automatically breaks down complex queries into sub-questions for better results.
- **Result Synthesis**: AI-powered synthesis of multiple search results into comprehensive answers.
- **Smart Caching**: Intelligent caching system with user-specific search result storage.
- **Educational Content**: Enhanced with educational knowledge base for academic queries.
- **Fallback Mechanisms**: Graceful degradation when external APIs are unavailable.

> **Packages**:
=======
### 7. 🔍 Deep Search Integration

* Uses DuckDuckGo API for advanced search.
* Decomposes queries, aggregates and caches results.

**Packages:**
>>>>>>> upstream/main

```bash
npm install duck-duck-scrape axios node-cache
```

<<<<<<< HEAD
> **Features**:
- Query decomposition and optimization
- Multi-source result aggregation
- Intelligent result scoring and ranking
- User-specific search history caching
- Educational content enhancement
- Rate limiting and error handling

---


=======
---

## ⚙️ Setup & Installation Guide

### Prerequisites

* Node.js (v18+)
* MongoDB
* FFmpeg
* eSpeak

### Installation Steps

1. **Clone the Repository**

```bash
git clone -b Team-4 https://github.com/spkkarri/iMentor.git
```

2. **Install System Dependencies**

**FFmpeg:**

* Windows: [FFmpeg for Windows](https://ffmpeg.org/download.html#build-windows)
* macOS: `brew install ffmpeg`
* Linux: `sudo apt-get install ffmpeg`

**eSpeak:**

* Windows: [eSpeak Windows](http://espeak.sourceforge.net/download.html)
* macOS: `brew install espeak`
* Linux: `sudo apt-get install espeak`

3. **Terminal 1: Backend Setup**

```bash
cd server
npm install
```

Create `.env` file in `/server`:

```env
PORT=5007
MONGO_URI=mongodb://localhost:27017/chatbotGeminiDB4
GEMINI_API_KEY=your_key
JWT_SECRET=random_secret1234
HF_API_KEY=your_huggingface_api_key
```

Start Backend:

```bash
npm start
```

4. **Terminal 2: Frontend Setup**

```bash
cd client
npm install
PORT=3004 npm start
```

---
>>>>>>> upstream/main

## 🏗️ Architecture

### Backend (Node.js/Express)
<<<<<<< HEAD
- **RAG Pipeline**: Document processing with vector embeddings
- **AI Services**: Gemini AI integration for chat and content generation
- **File Management**: Multi-format document upload and processing
- **Audio Processing**: Podcast generation with FFmpeg + eSpeak
- **Search Services**: Deep search with DuckDuckGo integration and intelligent caching
- **Deep Search Engine**: Query decomposition, result synthesis, and educational content enhancement

### Frontend (React)
- **Chat Interface**: Real-time messaging with RAG support
- **File Manager**: Drag-and-drop upload with progress tracking
- **Mind Map Viewer**: Interactive graph visualization
- **Audio Player**: Podcast playback with controls
- **Deep Search Interface**: Advanced search with query suggestions
- **Responsive Design**: Mobile-friendly interface

### Database (MongoDB)
- **User Management**: Authentication and session storage
- **Chat History**: Persistent conversation storage
- **File Metadata**: Document information and processing status
- **Vector Store**: FAISS indices for document search
- **Search Cache**: User-specific search result caching

---

## 🔧 Environment Variables

### Server (.env)
```
=======

* RAG pipeline with vector embeddings
* Gemini AI integration
* Multi-format file processing
* Podcast generation with FFmpeg + eSpeak
* Deep search engine with DuckDuckGo

### Frontend (React)

* Chat UI with RAG support
* File upload manager
* Mind map visualizer
* Audio player
* Deep search interface
* Mobile-friendly design

### Database (MongoDB)

* Auth & session management
* Persistent chats
* File metadata
* FAISS vector store
* Search cache

---

## 📦 Environment Variables

`.env` for `/server`:

```env
>>>>>>> upstream/main
PORT=5005
MONGO_URI=mongodb://localhost:27017/chatbotGeminiDB4
GEMINI_API_KEY=your_key
JWT_SECRET=random_secret1234
HF_API_KEY=your_huggingface_api_key
```

<<<<<<< HEAD

=======
>>>>>>> upstream/main
---

## 📦 Key Dependencies

<<<<<<< HEAD
### Backend Dependencies
- `@google/generative-ai`: Gemini AI integration
- `@langchain/community`: LangChain for RAG
- `faiss-node`: Vector similarity search
- `mongoose`: MongoDB ODM
- `express`: Web framework
- `multer`: File upload handling
- `fluent-ffmpeg`: Audio processing
- `duck-duck-scrape`: Web search integration
- `node-cache`: Intelligent caching system
- `say`: TTS integration with eSpeak

### Frontend Dependencies
- `react`: UI framework
- `reactflow`: Mind map visualization
- `dagre`: Graph layout algorithms
- `axios`: HTTP client
- `react-markdown`: Markdown rendering
=======
### Backend

* `@google/generative-ai`
* `@langchain/community`
* `faiss-node`
* `mongoose`
* `express`
* `multer`
* `fluent-ffmpeg`
* `duck-duck-scrape`
* `node-cache`
* `say`

### Frontend

* `react`
* `reactflow`
* `dagre`
* `axios`
* `react-markdown`
>>>>>>> upstream/main

---

## 🚀 Development

<<<<<<< HEAD
### Running in Development Mode
```bash
# Backend
cd server
npm run dev

# Frontend
=======
### Dev Mode

```bash
cd server
npm run dev

>>>>>>> upstream/main
cd client
npm start
```

### Testing
<<<<<<< HEAD
```bash
# Backend tests
cd server
npm test

# Frontend tests
=======

```bash
cd server
npm test

>>>>>>> upstream/main
cd client
npm test
```

---

<<<<<<< HEAD
## 👥 My Contribution

| Name     | GitHub Username | Contribution Areas                                                                 |
|----------|------------------|------------------------------------------------------------------------------------|
| Jaya Aswanth Allu | [AswanthAllu](https://github.com/AswanthAllu) | Chain of Thought, Persistent Chat History (MongoDB), STT/TTS, Podcast Generation, Mind Map Generation, RAG Pipeline, Deep Search Engine, Chat & File Deletion Features, Multiple File Upload, UI/UX Design |
| Solomon Matthews | [7nos](https://github.com/7nos) | Deep Search |

---



=======
## 👥 Team Contributions

| Name              | GitHub Username                               | Contributions                                                                                             |
| ----------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Jaya Aswanth Allu | [AswanthAllu](https://github.com/AswanthAllu) | Chain of Thought, Persistent Chat History, STT/TTS, Podcast Generator, Mind Maps, RAG, Deep Search, UI/UX |
| Solomon Matthews  | [7nos](https://github.com/7nos)               | Deep Search Engine                                                                                        |
>>>>>>> upstream/main

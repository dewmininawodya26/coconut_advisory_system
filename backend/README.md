# Backend - FastAPI Server

FastAPI backend service for CocoCastAI, providing REST API endpoints for mobile and web clients.

## Setup

### Prerequisites

- Python 3.9+
- FAISS index built (from `step1_build_index.py`)
- Knowledge base documents in `knowledge_base/` folder
- Groq API key

### Installation

1. **Create a Python virtual environment:**

```bash
cd backend
python -m venv venv

# Activate it
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Configure environment variables:**

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Edit `.env`:

```env
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False

# Required: Get from https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Paths to your index and knowledge base
KNOWLEDGE_BASE_DIR=../knowledge_base
FAISS_INDEX_DIR=../faiss_index

# Optional: For production, specify exact origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

## Running the Server

### Development

```bash
cd backend
python -m app.main

# or with auto-reload
DEBUG=True python -m app.main
```

### Production

```bash
# Using Gunicorn (recommended for production)
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app

# or with Uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

The server will be available at: `http://localhost:8000`

## API Documentation

### Interactive API Docs

Once running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Endpoints

#### Health Check

```
GET /health

Response:
{
  "status": "healthy",
  "rag_chain_loaded": true,
  "retriever_loaded": true
}
```

#### System Info

```
GET /info

Response:
{
  "service": "CocoCastAI",
  "version": "1.0.0",
  "description": "RAG-based advisory...",
  "endpoints": {
    "ask": "/ask (POST)",
    "health": "/health (GET)"
  }
}
```

#### Ask Question

```
POST /ask

Request:
{
  "question": "How do I care for young coconut palms?",
  "context": "optional context"
}

Response:
{
  "success": true,
  "question": "How do I care for young coconut palms?",
  "answer": "Based on the knowledge base...",
  "sources": [
    {
      "title": "coconut_care.pdf",
      "content": "Preview of the source document...",
      "metadata": {
        "source": "coconut_care.pdf"
      }
    }
  ],
  "confidence": 0.85
}
```

## Environment Setup

### Required Environment Variables

- **GROQ_API_KEY**: API key from Groq console (required)
- **API_HOST**: Host to bind to (default: 0.0.0.0)
- **API_PORT**: Port to bind to (default: 8000)
- **DEBUG**: Enable debug mode (default: False)

### Optional Variables

- **ALLOWED_ORIGINS**: CORS origins (default: *)
- **KNOWLEDGE_BASE_DIR**: Path to knowledge base (default: knowledge_base)
- **FAISS_INDEX_DIR**: Path to FAISS index (default: faiss_index)

## Architecture

```
backend/
├── app/
│   ├── __init__.py
│   └── main.py           # FastAPI app and endpoints
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
└── README.md            # This file
```

## Integration with Frontend

The mobile app connects to the backend using the API client:

```typescript
import { apiClient } from './src/services/ApiClient';

// Set the API endpoint
apiClient.setBaseURL('http://backend-server:8000');

// Ask a question
const response = await apiClient.askQuestion('Your question here');
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": "Question cannot be empty",
  "code": "INVALID_INPUT"
}
```

Common HTTP Status Codes:

- **200 OK**: Request successful
- **400 Bad Request**: Invalid input (empty question, etc.)
- **503 Service Unavailable**: RAG chain not loaded
- **500 Internal Server Error**: Processing error

## Performance Optimization

### For Production

1. **Use multiple workers:**
   ```bash
   gunicorn -w 4 app.main:app
   ```

2. **Enable caching** for common questions

3. **Use a reverse proxy** (Nginx):
   ```nginx
   location /api/ {
     proxy_pass http://localhost:8000;
     proxy_cache_valid 200 10m;
   }
   ```

4. **Monitor performance:**
   - Check RAG chain load time
   - Monitor API response times
   - Track error rates

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
COPY ../faiss_index ./faiss_index
COPY ../knowledge_base ./knowledge_base

ENV GROQ_API_KEY=your_key_here

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment

- **AWS**: Deploy on EC2, Lambda, or ECS
- **Google Cloud**: Use Cloud Run or App Engine
- **Azure**: Use App Service or Container Instances
- **Heroku**: Supported with configuration

## Troubleshooting

### RAG Chain Not Loading

```
Error: Failed to load RAG chain
```

- Check FAISS index exists in `faiss_index/`
- Verify GROQ_API_KEY is set
- Check knowledge base files exist

### Connection Refused

- Verify API_HOST and API_PORT in .env
- Check firewall rules
- Ensure port is not in use

### High Response Times

- Monitor model inference time
- Check system memory
- Consider using GPU
- Optimize retriever search parameters

## License

MIT

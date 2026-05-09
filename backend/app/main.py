"""
FastAPI Backend for Coconut Advisory System
Provides REST API endpoints for mobile and web clients
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging

# Import RAG engine
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from step2_rag_engine import load_rag_chain, get_answer, get_plain_answer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ Globals for RAG Chain ============

rag_chain = None
retriever = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load RAG chain when server starts"""
    global rag_chain, retriever
    try:
        logger.info("Loading RAG chain...")
        rag_chain, retriever = load_rag_chain()
        logger.info("RAG chain loaded successfully!")
    except Exception as e:
        logger.error(f"Failed to load RAG chain: {str(e)}")
        raise
    yield


# Initialize FastAPI app
app = FastAPI(
    title="Coconut Advisory API",
    description="RAG-based advisory system for coconut farming in Sri Lanka",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware for mobile and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ Request/Response Models ============

class QuestionRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "question": "What are the best practices for coconut tree maintenance?",
                "context": "Optional context"
            }
        }
    )
    question: str
    context: Optional[str] = None


class SourceDocument(BaseModel):
    title: str
    content: str
    metadata: Optional[dict] = None


class AnswerResponse(BaseModel):
    success: bool
    question: str
    answer: str
    sources: List[SourceDocument]
    confidence: Optional[float] = None
    context_used: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: Optional[str] = None


# ============ API Endpoints ============

@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Coconut Advisory System",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "rag_chain_loaded": rag_chain is not None,
        "retriever_loaded": retriever is not None
    }


@app.post("/ask", response_model=AnswerResponse, tags=["Advisory"])
async def ask_question(request: QuestionRequest):
    """
    Ask a question to the coconut advisory system
    
    Returns:
        - question: The question asked
        - answer: The AI-generated answer
        - sources: Source documents used for the answer
    """
    if not rag_chain or not retriever:
        raise HTTPException(
            status_code=503,
            detail="RAG chain not loaded. Please try again later."
        )
    
    question = request.question.strip()
    
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )
    
    try:
        logger.info(f"Processing question: {question}")
        result = get_answer(question, rag_chain, retriever, user_context=request.context)
        
        # Format sources
        sources = [
            SourceDocument(
                title=source.get("title", "Document"),
                content=source.get("content", ""),
                metadata=source.get("metadata")
            )
            for source in result.get("sources", [])
        ]
        
        return AnswerResponse(
            success=True,
            question=result["question"],
            answer=result["answer"],
            sources=sources,
            confidence=result.get("confidence"),
            context_used=result.get("context_used")
        )
        
    except Exception as e:
        logger.error(f"Error processing question: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}"
        )


@app.post("/compare", tags=["Advisory"])
async def compare_answers(request: QuestionRequest):
    """
    Compare Plain LLM vs RAG system
    """
    if not rag_chain or not retriever:
        raise HTTPException(
            status_code=503,
            detail="RAG chain not loaded. Please try again later."
        )
    
    question = request.question.strip()
    
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )
    
    try:
        logger.info(f"Comparing question: {question}")
        
        # Get Plain LLM Answer
        plain_result = get_plain_answer(question, user_context=request.context)
        
        # Get RAG Answer
        rag_result = get_answer(question, rag_chain, retriever, user_context=request.context)
        
        # Format sources
        sources = [
            SourceDocument(
                title=source.get("title", "Document"),
                content=source.get("content", ""),
                metadata=source.get("metadata")
            )
            for source in rag_result.get("sources", [])
        ]
        
        return {
            "success": True,
            "question": question,
            "plain_llm": {
                "answer": plain_result["answer"]
            },
            "rag_system": {
                "answer": rag_result["answer"],
                "sources": sources,
                "confidence": rag_result.get("confidence"),
                "context_used": rag_result.get("context_used")
            }
        }
        
    except Exception as e:
        logger.error(f"Error comparing answers: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error comparing answers: {str(e)}"
        )


@app.get("/info", tags=["Info"])
async def get_info():
    """Get system information"""
    return {
        "service": "Coconut Advisory System",
        "version": "1.0.0",
        "description": "RAG-based advisory system for coconut farming in Sri Lanka",
        "endpoints": {
            "ask": "/ask (POST)",
            "health": "/health (GET)"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "success": False,
        "error": "Internal server error",
        "code": "INTERNAL_ERROR"
    }


if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment or use defaults
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "False").lower() == "true"
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )

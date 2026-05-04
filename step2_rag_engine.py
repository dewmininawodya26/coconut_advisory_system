# step2_rag_engine.py

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv
import os

load_dotenv()

def load_rag_chain():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"}
    )
    vector_store = FAISS.load_local(
        "faiss_index",
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )

    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.2
    )

    prompt = PromptTemplate.from_template("""You are an expert agricultural advisor for coconut farming in Sri Lanka.
Use ONLY the information from the context below to answer the question.
If the answer is not found in the context, say: "I don't have information about that in my knowledge base."
Give practical advice a farmer can understand and apply immediately.

Context:
{context}

Question: {question}

Answer:""")

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return rag_chain, retriever


def get_answer(question, rag_chain, retriever):
    answer = rag_chain.invoke(question)

    source_docs = retriever.invoke(question)
    sources = []
    for doc in source_docs:
        source = os.path.basename(doc.metadata.get("source", "Unknown"))
        if source not in sources:
            sources.append(source)

    return {
        "question": question,
        "answer": answer,
        "sources": sources
    }


if __name__ == "__main__":
    print("Loading RAG system...")
    chain, retriever = load_rag_chain()
    print("Ready!\n")

    test_questions = [
    "How should I fertilize young coconut palms?",
    "How do I select a good mother palm?",
    "What is the recommended planting density for coconut?",
    "How do I control termites in coconut nursery?",
    "What fertilizer mixture is recommended for coconut seedlings?"
]

    for q in test_questions:
        print(f"Q: {q}")
        result = get_answer(q, chain, retriever)
        print(f"A: {result['answer']}")
        print(f"Sources: {result['sources']}")
        print("-" * 50)
from flask import Flask, request, jsonify, send_from_directory
from step2_rag_engine import load_rag_chain, get_answer, get_plain_answer

app = Flask(__name__)

# Load the RAG chain once when the server starts
print("Starting server and loading RAG chain...")
rag_chain, retriever = load_rag_chain()
print("Server ready!")


@app.route("/")
def home():
    # Serves the chat UI
    return send_from_directory(".", "chat.html")


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Please send a question"}), 400

    question = data["question"].strip()

    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        result = get_answer(question, rag_chain, retriever)
        return jsonify({
            "success": True,
            "question": result["question"],
            "answer": result["answer"],
            "sources": result["sources"]
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/compare", methods=["POST"])
def compare():
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Please send a question"}), 400

    question = data["question"].strip()

    if not question:
        return jsonify({"error": "Question cannot be empty"}), 400

    try:
        plain_result = get_plain_answer(question)
        rag_result = get_answer(question, rag_chain, retriever)
        
        return jsonify({
            "success": True,
            "question": question,
            "plain_llm": {
                "answer": plain_result["answer"]
            },
            "rag_system": {
                "answer": rag_result["answer"],
                "sources": rag_result["sources"]
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
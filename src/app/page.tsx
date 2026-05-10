"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, FileText, Send, Loader2, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      setCollectionName(data.collectionName);
      setMessages([
        {
          role: "ai",
          content: `Document "${file.name}" has been successfully ingested and indexed! You can now ask me questions about it.`,
        },
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !collectionName || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, collectionName }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to get response");

      setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
    } catch (err: any) {
      setError(err.message);
      setMessages((prev) => [...prev, { role: "ai", content: "Error: Could not retrieve answer." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <BookOpen className="logo-icon" />
        <h1>NotebookLM RAG</h1>
        <p>Upload a document and interact directly with its contents</p>
      </header>

      <main className="main-content">
        {!collectionName ? (
          <div className="upload-panel">
            <div className="upload-card">
              <div className="upload-icon-wrapper">
                <UploadCloud className="upload-icon" />
              </div>
              <h2>Upload Source Document</h2>
              <p>Upload a PDF or TXT file to begin chatting with your data.</p>
              
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <label htmlFor="file-upload" className="file-label">
                  {file ? (
                    <span className="file-name">
                      <FileText size={18} /> {file.name}
                    </span>
                  ) : (
                    "Choose File"
                  )}
                </label>
              </div>

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <button
                className={`primary-btn ${isUploading ? "loading" : ""} ${!file ? "disabled" : ""}`}
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="spin" size={18} /> Processing Document...
                  </>
                ) : (
                  "Ingest Document"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-panel">
            <div className="chat-header">
              <FileText size={18} />
              <span>{file?.name}</span>
            </div>
            
            <div className="messages-container">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message-wrapper ${msg.role}`}>
                  <div className={`message ${msg.role}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="message-wrapper ai">
                  <div className="message ai typing-indicator">
                    <Loader2 className="spin" size={18} /> Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about the document..."
                disabled={isTyping}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="send-btn"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

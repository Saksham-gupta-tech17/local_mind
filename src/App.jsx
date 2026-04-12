import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus({ type: '', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploadStatus({ type: 'info', message: 'Uploading and processing document...' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (response.ok) {
        setUploadStatus({ type: 'success', message: `Upload successful! Ready to answer questions.` });
      } else {
        setUploadStatus({ type: 'error', message: `Upload failed: ${data.error}` });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', message: `Connection error: ${error.message}` });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMsg,
          sessionId: sessionId,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: `Error: ${data.error}` }]);
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: Could not reach the server.` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar for Upload & Context */}
      <aside className="sidebar">
        <div className="brand">
          <h1>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            LocalMind
          </h1>
          <p>Your intelligent document assistant</p>
        </div>

        <div className="upload-section">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-color)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
          
          <div className="file-input-wrapper">
            <button className="btn-secondary">Choose PDF File</button>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
          </div>
          
          {file && (
            <div className="file-name">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}

          <button 
            className="btn-primary" 
            onClick={handleUpload} 
            disabled={!file || uploadStatus.type === 'info'}
          >
            {uploadStatus.type === 'info' ? 'Processing...' : 'Upload & Index'}
          </button>
        </div>

        {uploadStatus.message && (
          <div className={`status-message status-${uploadStatus.type}`}>
            {uploadStatus.message}
          </div>
        )}
      </aside>

      {/* Main Chat Interface */}
      <main className="chat-container">
        <header className="chat-header">
          <h2>Chat Session</h2>
        </header>

        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <h3>Welcome to LocalMind</h3>
              <p>Upload a PDF document from the sidebar and start asking questions about its contents.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message-wrapper ${msg.role}`}>
                <div className="message-bubble">
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i !== msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="message-wrapper assistant">
              <div className="message-bubble">
                <div className="loading-indicator">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <input 
              type="text" 
              className="chat-input"
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question about your document..."
              disabled={loading}
            />
            <button 
              className="send-button"
              onClick={handleSendMessage} 
              disabled={loading || !input.trim()} 
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

import { useState, useRef, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
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
    <div className="flex w-full h-full text-gray-200 font-sans relative">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="glow-blob w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 mix-blend-screen"></div>
        <div className="glow-blob w-[400px] h-[400px] top-[-10%] right-[-10%] opacity-40 bg-brand-purple-dark/30"></div>
        <div className="glow-blob w-[500px] h-[500px] bottom-[-20%] left-[-10%] opacity-30 bg-blue-900/20"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-80 flex flex-col glass-panel m-4 rounded-3xl z-10 shrink-0 shadow-2xl overflow-hidden">
        <div className="p-8 pb-6 border-b border-border-gloss">
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white mb-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#purpleGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            LocalMind
          </h1>
          <p className="font-mono text-xs text-brand-purple-light/80 tracking-wide uppercase">
            Your intelligent document assistant
          </p>
        </div>

        <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
          <div 
            className={`drop-zone p-8 text-center relative overflow-hidden group ${isDragging ? 'drop-zone-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Drag & Drop or click to choose PDF"
            />
            
            <div className="flex flex-col items-center gap-3 relative z-0 transition-transform duration-300 group-hover:scale-105">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple-light shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300 mb-1 group-hover:text-brand-purple-light transition-colors">Drag & drop PDF here</p>
                <p className="text-xs text-gray-500">or click to browse</p>
              </div>
            </div>
          </div>
          
          {file && (
            <div className="bg-[rgba(255,255,255,0.03)] border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-purple/20 text-brand-purple-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-200 truncate" title={file.name}>{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          <button 
            className={`gradient-btn mt-2 py-3.5 px-6 rounded-xl w-full flex items-center justify-center gap-2 ${file ? 'btn-pulse' : 'opacity-50 cursor-not-allowed'} ${uploadStatus.type === 'info' ? 'opacity-80' : ''}`}
            onClick={handleUpload} 
            disabled={!file || uploadStatus.type === 'info'}
          >
            {uploadStatus.type === 'info' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Upload & Index
              </>
            )}
          </button>

          {uploadStatus.message && (
            <div className={`p-4 rounded-xl text-sm border backdrop-blur-sm ${
              uploadStatus.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 
              uploadStatus.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-200' : 
              'bg-blue-500/10 border-blue-500/30 text-blue-200'
            }`}>
              {uploadStatus.message}
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full relative z-10 p-4 pl-0">
        <div className="flex-1 glass-panel rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
          
          <header className="p-6 border-b border-border-gloss bg-white/[0.02]">
            <h2 className="text-lg font-medium text-white/90 tracking-wide">Session</h2>
          </header>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scroll-smooth">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 h-full">
                {/* 3D Glass Document Stack Icon */}
                <div className="relative w-32 h-32 mb-8 group">
                  <div className="absolute inset-0 bg-brand-purple blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 rounded-full"></div>
                  
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]">
                    <defs>
                      <linearGradient id="glassDoc1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                      </linearGradient>
                      <linearGradient id="glassDoc2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(167, 139, 250, 0.8)" />
                        <stop offset="100%" stopColor="rgba(109, 40, 217, 0.8)" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* Back document */}
                    <path d="M25,20 L65,20 A5,5 0 0,1 70,25 L70,75 A5,5 0 0,1 65,80 L25,80 A5,5 0 0,1 20,75 L20,25 A5,5 0 0,1 25,20 Z" 
                          fill="url(#glassDoc1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" transform="rotate(15 50 50) translate(5, -5)" />
                    
                    {/* Middle document */}
                    <path d="M30,15 L70,15 A5,5 0 0,1 75,20 L75,70 A5,5 0 0,1 70,75 L30,75 A5,5 0 0,1 25,70 L25,20 A5,5 0 0,1 30,15 Z" 
                          fill="url(#glassDoc1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" transform="rotate(5 50 50)" />
                    
                    {/* Front document (purple) */}
                    <path d="M35,10 L75,10 A5,5 0 0,1 80,15 L80,65 A5,5 0 0,1 75,70 L35,70 A5,5 0 0,1 30,65 L30,15 A5,5 0 0,1 35,10 Z" 
                          fill="url(#glassDoc2)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" filter="url(#glow)" transform="rotate(-5 50 50) translate(-5, 5)" />
                    
                    {/* Lines on front doc */}
                    <line x1="42" y1="28" x2="68" y2="28" stroke="rgba(255,255,255,0.8)" strokeWidth="3" strokeLinecap="round" transform="rotate(-5 50 50) translate(-5, 5)" />
                    <line x1="42" y1="40" x2="60" y2="40" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round" transform="rotate(-5 50 50) translate(-5, 5)" />
                    <line x1="42" y1="52" x2="65" y2="52" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" transform="rotate(-5 50 50) translate(-5, 5)" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Welcome to LocalMind</h3>
                <p className="text-gray-400 max-w-md text-sm leading-relaxed">
                  Upload a PDF document from the sidebar and start exploring its contents. I'm ready to summarize, extract data, and answer your questions.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-6 py-4 text-sm leading-relaxed shadow-lg backdrop-blur-md border ${
                    msg.role === 'user' 
                      ? 'bg-brand-purple/90 text-white rounded-tr-sm border-brand-purple-light/20' 
                      : 'bg-white/5 text-gray-200 rounded-tl-sm border-white/10'
                  }`}>
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
              <div className="flex w-full justify-start">
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-6 py-5 shadow-lg backdrop-blur-md">
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-brand-purple-light/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-purple-light/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-brand-purple-light/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 pt-2 bg-gradient-to-t from-bg-panel to-transparent">
            <div className="relative max-w-4xl mx-auto">
              <input 
                type="text" 
                className="glass-input w-full rounded-2xl py-4 pl-6 pr-14 text-white placeholder-gray-500 outline-none"
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question about your document..."
                disabled={loading || messages.length === 0 && !file}
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-brand-purple-light hover:bg-white/5 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed group"
                onClick={handleSendMessage} 
                disabled={loading || !input.trim()} 
                aria-label="Send message"
              >
                <div className="send-icon-animate">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </div>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-500 mt-3 font-mono">
              LocalMind can make mistakes. Consider verifying important information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

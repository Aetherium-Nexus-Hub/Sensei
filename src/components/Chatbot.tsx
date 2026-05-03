import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { Send, Image as ImageIcon, Video, Map, Search, Brain, Zap, Loader2, X, Trash2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { auth, db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: any;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'pro' | 'flash-lite' | 'thinking' | 'search' | 'maps'>('pro');
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'chats', auth.currentUser.uid, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${auth.currentUser?.uid}/messages`);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearChat = async () => {
    if (!auth.currentUser) return;
    
    try {
      const q = query(collection(db, 'chats', auth.currentUser.uid, 'messages'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(document => 
        deleteDoc(doc(db, 'chats', auth.currentUser!.uid, 'messages', document.id))
      );
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${auth.currentUser?.uid}/messages`);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !file) return;
    if (!auth.currentUser) return;

    const userText = input;
    setInput('');
    const currentFile = file;
    setFile(null);
    setLoading(true);

    try {
      // Save user message
      await addDoc(collection(db, 'chats', auth.currentUser.uid, 'messages'), {
        sessionId: 'default',
        uid: auth.currentUser.uid,
        role: 'user',
        text: userText + (currentFile ? ` [Attached: ${currentFile.name}]` : ''),
        createdAt: new Date().toISOString()
      }).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `chats/${auth.currentUser?.uid}/messages`);
      });

      let modelName = 'gemini-3.1-pro-preview';
      let config: any = {};

      if (mode === 'flash-lite') modelName = 'gemini-3.1-flash-lite-preview';
      if (mode === 'thinking') {
        modelName = 'gemini-3.1-pro-preview';
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }
      if (mode === 'search') {
        modelName = 'gemini-3-flash-preview';
        config.tools = [{ googleSearch: {} }];
      }
      if (mode === 'maps') {
        modelName = 'gemini-2.5-flash';
        config.tools = [{ googleMaps: {} }];
      }

      const parts: any[] = [];
      if (userText) parts.push({ text: userText });
      
      if (currentFile) {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(currentFile);
        });
        parts.push({
          inlineData: {
            data: base64,
            mimeType: currentFile.type
          }
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config
      });

      let responseText = response.text || '';
      
      // Extract grounding chunks if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && chunks.length > 0) {
        responseText += '\n\n**Sources:**\n';
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            responseText += `- [${chunk.web.title}](${chunk.web.uri})\n`;
          }
          if (chunk.maps?.uri) {
            responseText += `- [${chunk.maps.title || 'Map Link'}](${chunk.maps.uri})\n`;
          }
        });
      }

      // Save model message
      await addDoc(collection(db, 'chats', auth.currentUser.uid, 'messages'), {
        sessionId: 'default',
        uid: auth.currentUser.uid,
        role: 'model',
        text: responseText,
        createdAt: new Date().toISOString()
      }).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, `chats/${auth.currentUser?.uid}/messages`);
      });

    } catch (error) {
      console.error("Error generating content:", error);
      await addDoc(collection(db, 'chats', auth.currentUser!.uid, 'messages'), {
        sessionId: 'default',
        uid: auth.currentUser!.uid,
        role: 'model',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        createdAt: new Date().toISOString()
      }).catch(e => {
        handleFirestoreError(e, OperationType.CREATE, `chats/${auth.currentUser?.uid}/messages`);
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] cp-border bg-cp-darker/80">
      {/* Mode Selector */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-cp-cyan/30 bg-black/40">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode('pro')} className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 ${mode === 'pro' ? 'bg-cp-cyan text-black' : 'text-cp-cyan border border-cp-cyan'}`}>
            <Brain className="w-4 h-4" /> Pro
          </button>
          <button onClick={() => setMode('flash-lite')} className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 ${mode === 'flash-lite' ? 'bg-cp-cyan text-black' : 'text-cp-cyan border border-cp-cyan'}`}>
            <Zap className="w-4 h-4" /> Flash Lite
          </button>
          <button onClick={() => setMode('thinking')} className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 ${mode === 'thinking' ? 'bg-cp-cyan text-black' : 'text-cp-cyan border border-cp-cyan'}`}>
            <Brain className="w-4 h-4" /> Thinking
          </button>
          <button onClick={() => setMode('search')} className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 ${mode === 'search' ? 'bg-cp-cyan text-black' : 'text-cp-cyan border border-cp-cyan'}`}>
            <Search className="w-4 h-4" /> Search
          </button>
          <button onClick={() => setMode('maps')} className={`px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 ${mode === 'maps' ? 'bg-cp-cyan text-black' : 'text-cp-cyan border border-cp-cyan'}`}>
            <Map className="w-4 h-4" /> Maps
          </button>
        </div>
        <button onClick={clearChat} className="px-3 py-1 text-xs font-bold uppercase flex items-center gap-1 text-cp-red border border-cp-red hover:bg-cp-red/20 transition-colors ml-auto mt-2 sm:mt-0">
          <Trash2 className="w-4 h-4" /> Purge
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 ${msg.role === 'user' ? 'bg-cp-cyan/20 border border-cp-cyan text-cp-cyan' : 'bg-black/60 border border-cp-yellow/50 text-cp-yellow'}`}>
              <div className="text-xs opacity-50 mb-1 uppercase tracking-widest">{msg.role === 'user' ? 'Operator' : 'Sensei AI'}</div>
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 bg-black/60 border border-cp-yellow/50 text-cp-yellow flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing Data...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-cp-cyan/30 bg-black/40 flex items-center gap-2">
        <label className="cursor-pointer p-2 text-cp-cyan hover:bg-cp-cyan/20 transition-colors">
          <ImageIcon className="w-5 h-5" />
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
        <label className="cursor-pointer p-2 text-cp-cyan hover:bg-cp-cyan/20 transition-colors">
          <Video className="w-5 h-5" />
          <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
        </label>
        
        <div className="flex-1 relative">
          {file && (
            <div className="absolute -top-10 left-0 text-xs text-cp-yellow bg-black px-2 py-1 border border-cp-yellow flex items-center gap-2">
              <span>Attached: {file.name}</span>
              <button onClick={() => setFile(null)} className="text-cp-red hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Enter command or query..."
            className="w-full bg-transparent border-b border-cp-cyan text-white p-2 font-mono focus:outline-none focus:border-cp-yellow transition-colors"
          />
        </div>
        
        <button onClick={sendMessage} disabled={loading || (!input.trim() && !file)} className="cp-button p-3 disabled:opacity-50">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

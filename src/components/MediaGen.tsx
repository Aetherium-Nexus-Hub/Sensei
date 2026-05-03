import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Image as ImageIcon, Video, Loader2, Download, ShieldAlert, X, History } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface Generation {
  id: string;
  uid: string;
  type: 'image' | 'video';
  prompt: string;
  url: string;
  createdAt: string;
}

export default function MediaGen() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'image-pro' | 'video'>('image-pro');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'generations'),
      where('uid', '==', auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gens: Generation[] = [];
      snapshot.forEach((doc) => {
        gens.push({ id: doc.id, ...doc.data() } as Generation);
      });
      gens.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistory(gens);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'generations');
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const generateMedia = async () => {
    if (!prompt.trim() && !file) return;
    if (!auth.currentUser) return;

    setLoading(true);
    setResultUrl(null);
    setErrorMsg(null);

    try {
      // Check for API key selection for Pro image and Video models
      if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      let url = '';

      if (mode === 'image-pro') {
        const modelName = 'gemini-3-pro-image-preview';
        
        const parts: any[] = [];
        if (prompt) parts.push({ text: prompt });
        if (file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          parts.push({
            inlineData: {
              data: base64,
              mimeType: file.type
            }
          });
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
              imageSize: imageSize
            }
          }
        });

        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          for (const part of candidates[0].content.parts) {
            if (part.inlineData) {
              url = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } else if (mode === 'video') {
        let operationArgs: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt,
          config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: aspectRatio === '16:9' || aspectRatio === '9:16' ? aspectRatio : '16:9'
          }
        };

        if (file) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          operationArgs.image = {
            imageBytes: base64,
            mimeType: file.type
          };
        }

        let operation = await ai.models.generateVideos(operationArgs);

        while (!operation.done) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY!,
            },
          });
          const blob = await response.blob();
          url = URL.createObjectURL(blob);
        }
      }

      setResultUrl(url);

      // Save to history
      await addDoc(collection(db, 'generations'), {
        uid: auth.currentUser.uid,
        type: mode.includes('image') ? 'image' : 'video',
        prompt: prompt,
        url: url,
        createdAt: new Date().toISOString()
      }).catch(error => {
        handleFirestoreError(error, OperationType.CREATE, 'generations');
      });

    } catch (error) {
      console.error("Error generating media:", error);
      setErrorMsg(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] cp-border bg-cp-darker/80 p-6 overflow-y-auto">
      <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-cp-cyan mb-6 flex items-center gap-3">
        <ImageIcon className="w-6 h-6" /> Media Forge
      </h2>

      {errorMsg && (
        <div className="bg-cp-red/20 border border-cp-red text-cp-red p-3 mb-6 font-mono text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Generation Engine</label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setMode('image-pro')} 
                className={`px-4 py-2 text-xs font-bold uppercase border transition-colors ${mode === 'image-pro' ? 'bg-cp-cyan text-black border-cp-cyan' : 'text-cp-cyan border-cp-cyan/50 hover:border-cp-cyan shadow-[0_0_10px_rgba(0,255,255,0.1)]'}`}
              >
                SENSEI Pro (Image)
              </button>
              <button 
                onClick={() => setMode('video')} 
                className={`px-4 py-2 text-xs font-bold uppercase border transition-colors ${mode === 'video' ? 'bg-cp-red text-white border-cp-red' : 'text-cp-red border-cp-red/50 hover:border-cp-red shadow-[0_0_10px_rgba(255,0,0,0.1)]'}`}
              >
                VEO Neural (Video)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 text-[10px] font-bold border transition-all ${aspectRatio === ratio ? 'bg-cp-cyan text-black border-cp-cyan' : 'bg-black text-cp-cyan border-cp-cyan/30 hover:border-cp-cyan'}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {mode === 'image-pro' && (
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Resolution</label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setImageSize(size)}
                    className={`py-2 text-[10px] font-bold border transition-all ${imageSize === size ? 'bg-cp-yellow text-black border-cp-yellow' : 'bg-black text-cp-yellow border-cp-yellow/30 hover:border-cp-yellow'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Source Image (Optional)</label>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-bold file:bg-cp-cyan file:text-black hover:file:bg-cp-yellow transition-colors"
              />
              {file && (
                <button 
                  onClick={() => setFile(null)}
                  className="p-2 text-cp-red border border-cp-red hover:bg-cp-red/20 transition-colors"
                  title="Remove File"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Prompt Directive</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the visual output..."
              className="w-full h-32 bg-black border border-cp-cyan text-white p-3 font-mono focus:outline-none focus:border-cp-yellow resize-none"
            />
          </div>

          <button 
            onClick={generateMedia} 
            disabled={loading || (!prompt.trim() && !file)} 
            className="cp-button w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Rendering...</> : <><ImageIcon className="w-6 h-6" /> Execute Render</>}
          </button>
        </div>

        {/* Output */}
        <div className="flex flex-col items-center justify-center border border-dashed border-cp-cyan/30 bg-black/50 min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
              <div className="w-16 h-16 border-4 border-cp-cyan border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-cp-cyan font-mono uppercase tracking-widest animate-pulse">Processing Neural Net...</p>
            </div>
          )}
          
          {resultUrl ? (
            mode === 'video' ? (
              <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
            ) : (
              <img src={resultUrl} alt="Generated" className="max-w-full max-h-full object-contain" />
            )
          ) : (
            <div className="text-gray-500 font-mono text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Awaiting Render Directives</p>
            </div>
          )}

          {resultUrl && (
            <a 
              href={resultUrl} 
              download={`sensei_render_${Date.now()}`}
              className="absolute bottom-4 right-4 bg-cp-yellow text-black px-4 py-2 font-bold uppercase text-xs flex items-center gap-2 hover:bg-white transition-colors"
            >
              <Download className="w-4 h-4" /> Save Asset
            </a>
          )}
        </div>
      </div>

      {/* History Gallery */}
      {history.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-display font-bold uppercase tracking-wider text-cp-cyan mb-6 flex items-center gap-3 border-b border-cp-cyan/30 pb-2">
            <History className="w-5 h-5" /> Render History
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {history.map((item) => (
              <div key={item.id} className="relative group border border-cp-cyan/30 bg-black/50 aspect-square overflow-hidden cursor-pointer" onClick={() => setResultUrl(item.url)}>
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <img src={item.url} alt={item.prompt} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                  <p className="text-xs text-cp-cyan font-mono line-clamp-3">{item.prompt}</p>
                </div>
                {item.type === 'video' && (
                  <div className="absolute top-2 right-2 bg-cp-red text-white p-1 rounded-full">
                    <Video className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Image as ImageIcon, Video, Loader2, Download } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function MediaGen() {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'image-flash' | 'image-pro' | 'video'>('image-pro');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const generateMedia = async () => {
    if (!prompt.trim() && !file) return;
    if (!auth.currentUser) return;

    setLoading(true);
    setResultUrl(null);

    try {
      // Check for API key selection if using Pro models
      if (mode === 'image-pro' || mode === 'video') {
        if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
          await window.aistudio.openSelectKey();
        }
      }

      // Re-initialize AI to pick up the selected API key
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      let url = '';

      if (mode === 'image-pro' || mode === 'image-flash') {
        const modelName = mode === 'image-pro' ? 'gemini-3-pro-image-preview' : 'gemini-3.1-flash-image-preview';
        
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

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            url = `data:image/png;base64,${part.inlineData.data}`;
            break;
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
      });

    } catch (error) {
      console.error("Error generating media:", error);
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] cp-border bg-cp-darker/80 p-6 overflow-y-auto">
      <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-cp-cyan mb-6 flex items-center gap-3">
        <ImageIcon className="w-6 h-6" /> Media Forge
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Generation Engine</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setMode('image-pro')} className={`px-4 py-2 text-xs font-bold uppercase border ${mode === 'image-pro' ? 'bg-cp-cyan text-black border-cp-cyan' : 'text-cp-cyan border-cp-cyan/50'}`}>
                Nano Banana Pro (Image)
              </button>
              <button onClick={() => setMode('image-flash')} className={`px-4 py-2 text-xs font-bold uppercase border ${mode === 'image-flash' ? 'bg-cp-cyan text-black border-cp-cyan' : 'text-cp-cyan border-cp-cyan/50'}`}>
                Nano Banana 2 (Image)
              </button>
              <button onClick={() => setMode('video')} className={`px-4 py-2 text-xs font-bold uppercase border ${mode === 'video' ? 'bg-cp-red text-white border-cp-red' : 'text-cp-red border-cp-red/50'}`}>
                Veo (Video)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Aspect Ratio</label>
            <select 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full bg-black border border-cp-cyan text-white p-2 font-mono focus:outline-none focus:border-cp-yellow"
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
              {mode !== 'video' && (
                <>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                  <option value="3:2">3:2</option>
                  <option value="2:3">2:3</option>
                  <option value="21:9">21:9 (Ultrawide)</option>
                </>
              )}
            </select>
          </div>

          {mode === 'image-pro' && (
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Resolution</label>
              <select 
                value={imageSize} 
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full bg-black border border-cp-cyan text-white p-2 font-mono focus:outline-none focus:border-cp-yellow"
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Source Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-bold file:bg-cp-cyan file:text-black hover:file:bg-cp-yellow transition-colors"
            />
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
    </div>
  );
}

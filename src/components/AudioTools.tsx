import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, Volume2, Loader2, Play, Square, FileText } from 'lucide-react';
import { auth } from '../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function AudioTools() {
  const [mode, setMode] = useState<'live' | 'tts' | 'transcribe'>('live');
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (liveSessionRef.current) liveSessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // --- TTS ---
  const generateSpeech = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textInput }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))], { type: 'audio/mp3' });
        setAudioUrl(URL.createObjectURL(audioBlob));
      }
    } catch (error) {
      console.error("TTS Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Transcription ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing mic:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Transcribe this audio exactly as spoken." },
              { inlineData: { data: base64, mimeType: blob.type } }
            ]
          }
        ]
      });

      setTranscription(response.text || "No transcription generated.");
    } catch (error) {
      console.error("Transcription Error:", error);
      setTranscription("Error transcribing audio.");
    } finally {
      setLoading(false);
    }
  };

  // --- Live API ---
  const toggleLiveSession = async () => {
    if (isLiveConnected) {
      if (liveSessionRef.current) {
        liveSessionRef.current.close();
        liveSessionRef.current = null;
      }
      setIsLiveConnected(false);
      return;
    }

    try {
      setIsLiveConnected(true);
      setTranscription("Connecting to Live API...");
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        callbacks: {
          onopen: () => console.log("Live API connected"),
          onmessage: (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
               // In a real app we'd play this.
            }
          },
          onclose: () => console.log("Live API closed"),
          onerror: (err) => console.error("Live API error", err)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Sensei, a Cyberpunk 2077 AI guide. Speak concisely and in character.",
        },
      });

      // We need to capture audio and send it
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        if (!isLiveConnected) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < buffer.byteLength; i++) {
          binary += String.fromCharCode(buffer[i]);
        }
        const base64Data = btoa(binary);

        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };

      setTranscription("Live Session Active. Speak now...");

      // Handle incoming audio (simplified for this demo, real implementation requires a queue and precise scheduling)
      // The SDK handles the connection, but we need to play the audio chunks
      // This is a basic implementation to show the structure
      
    } catch (error) {
      console.error("Live API Error:", error);
      setIsLiveConnected(false);
      setTranscription("Failed to connect to Live API.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] cp-border bg-cp-darker/80 p-6 overflow-y-auto">
      <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-cp-cyan mb-6 flex items-center gap-3">
        <Volume2 className="w-6 h-6" /> Comms Hub
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Audio Protocol</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setMode('live')} className={`px-4 py-2 text-xs font-bold uppercase border ${mode === 'live' ? 'bg-cp-cyan text-black border-cp-cyan' : 'text-cp-cyan border-cp-cyan/50'}`}>
                Live Comms (Native Audio)
              </button>
              <button onClick={() => setMode('tts')} className={`px-4 py-2 text-xs font-bold uppercase border ${mode === 'tts' ? 'bg-cp-cyan text-black border-cp-cyan' : 'text-cp-cyan border-cp-cyan/50'}`}>
                Text-to-Speech
              </button>
              <button onClick={() => setMode('transcribe')} className={`px-4 py-2 text-xs font-bold uppercase border ${mode === 'transcribe' ? 'bg-cp-cyan text-black border-cp-cyan' : 'text-cp-cyan border-cp-cyan/50'}`}>
                Transcription
              </button>
            </div>
          </div>

          {mode === 'tts' && (
            <div className="space-y-4">
              <textarea 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text to synthesize..."
                className="w-full h-32 bg-black border border-cp-cyan text-white p-3 font-mono focus:outline-none focus:border-cp-yellow resize-none"
              />
              <button 
                onClick={generateSpeech} 
                disabled={loading || !textInput.trim()} 
                className="cp-button w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Synthesizing...</> : <><Play className="w-6 h-6" /> Generate Audio</>}
              </button>
            </div>
          )}

          {mode === 'transcribe' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-cp-cyan/30 p-6 text-center">
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${isRecording ? 'bg-cp-red animate-pulse' : 'bg-cp-cyan hover:bg-cp-yellow'}`}
                >
                  {isRecording ? <Square className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-black" />}
                </button>
                <p className="mt-4 font-mono text-sm text-gray-400 uppercase">
                  {isRecording ? 'Recording in progress...' : 'Click to record audio'}
                </p>
              </div>
            </div>
          )}

          {mode === 'live' && (
            <div className="space-y-4">
              <div className="bg-black/50 border border-cp-cyan/30 p-6 text-center">
                <button 
                  onClick={toggleLiveSession}
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${isLiveConnected ? 'bg-cp-red animate-pulse' : 'bg-cp-cyan hover:bg-cp-yellow'}`}
                >
                  {isLiveConnected ? <Square className="w-10 h-10 text-white" /> : <Volume2 className="w-10 h-10 text-black" />}
                </button>
                <p className="mt-4 font-mono text-sm text-gray-400 uppercase">
                  {isLiveConnected ? 'Live Session Active - Speak Now' : 'Initialize Live Comms'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="flex flex-col border border-dashed border-cp-cyan/30 bg-black/50 min-h-[400px] relative p-6">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
              <div className="w-16 h-16 border-4 border-cp-cyan border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-cp-cyan font-mono uppercase tracking-widest animate-pulse">Processing Audio...</p>
            </div>
          )}
          
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Output Log
          </h3>

          <div className="flex-1 overflow-y-auto font-mono text-sm text-cp-yellow p-4 bg-black/40 border border-white/5">
            {mode === 'tts' && audioUrl && (
              <div className="flex flex-col items-center justify-center h-full">
                <audio src={audioUrl} controls className="w-full" autoPlay />
                <p className="mt-4 text-cp-cyan">Audio synthesized successfully.</p>
              </div>
            )}

            {(mode === 'transcribe' || mode === 'live') && (
              <div className="whitespace-pre-wrap">
                {transcription || "Awaiting audio input..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

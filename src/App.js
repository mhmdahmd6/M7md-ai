import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Loader2, Sparkles, Image as ImageIcon, Terminal, Save } from 'lucide-react';

const GeminiVisionBoard = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [userPrompt, setUserPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState({ enhancedPrompt: '', imageUrl: '', logs: [] });

  const addLog = (msg) => {
    setOutput(prev => ({ ...prev, logs: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.logs] }));
  };

  const generateVision = async () => {
    if (!apiKey) return alert("Please enter your Gemini API Key");
    setIsGenerating(true);
    addLog("Initializing Gemini 3 Flash for reasoning...");

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // 1. PHASE: PROMPT ENGINEERING (Using Gemini 3 Flash)
      // Optimized for PhD-level instruction following
      const flashModel = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview" 
      });

      const engineerPrompt = `Act as a Visionary Prompt Architect. 
      Transform this basic idea into a high-fidelity 'Vibe-Coding' visual prompt: "${userPrompt}".
      Focus on lighting, PBR textures, and emotional resonance. 
      Output ONLY the enhanced prompt text.`;

      const result = await flashModel.generateContent(engineerPrompt);
      const enhancedText = result.response.text();
      addLog("Reasoning complete. Prompt engineered.");

      // 2. PHASE: IMAGE GENERATION (Using Gemini 3 Pro Image / Nano Banana Pro)
      addLog("Invoking Nano Banana Pro for high-fidelity generation...");
      
      const imageModel = genAI.getGenerativeModel({ 
        model: "gemini-3-pro-image-preview" 
      });

      // Note: In the v1alpha/v1beta API, the Image models return base64 in the parts
      const imageResult = await imageModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedText }] }],
        generationConfig: {
          // New Gen 3 Thinking Level
          // thinkingLevel: "high" // Use for complex compositions
        }
      });

      // Extracting the native image from response parts
      const response = await imageResult.response;
      const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
      
      let finalImageUrl = '';
      if (imagePart) {
        finalImageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        addLog("Vision materialized successfully.");
      } else {
        // Fallback for demo if API access differs
        addLog("No direct image part found. Check API permissions for Image generation.");
      }

      setOutput(prev => ({ 
        ...prev, 
        enhancedPrompt: enhancedText, 
        imageUrl: finalImageUrl 
      }));

    } catch (error) {
      addLog(`ERROR: ${error.message}`);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Input & Control Column */}
        <div className="space-y-6">
          <header className="border-b border-slate-800 pb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Gemini 3 Vision Studio
            </h1>
            <p className="text-slate-400 text-sm mt-1">Powered by Nano Banana Pro reasoning</p>
          </header>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">API Configuration</label>
            <input 
              type="password" 
              placeholder="Enter Gemini API Key..." 
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('gemini_api_key', e.target.value);
              }}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Concept Input</label>
            <textarea 
              rows="4"
              placeholder="e.g. A cybernetic garden growing inside a glass heart..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
            <button 
              onClick={generateVision}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? "Reasoning & Materializing..." : "Generate Vision"}
            </button>
          </div>

          {/* Console Output */}
          <div className="bg-black/40 rounded-xl border border-slate-800 p-4 h-48 overflow-y-auto font-mono text-xs">
            <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
              <Terminal size={14} /> SYSTEM LOGS
            </div>
            {output.logs.map((log, i) => (
              <div key={i} className="py-1 text-blue-400/80">{log}</div>
            ))}
          </div>
        </div>

        {/* Vision Display Column */}
        <div className="space-y-6">
          <div className="aspect-square bg-slate-900 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden relative shadow-2xl">
            {output.imageUrl ? (
              <img src={output.imageUrl} alt="AI Vision" className="w-full h-full object-cover animate-in fade-in zoom-in duration-700" />
            ) : (
              <div className="text-center space-y-2 opacity-20">
                <ImageIcon size={64} className="mx-auto" />
                <p>Output Display Area</p>
              </div>
            )}
            {isGenerating && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 size={48} className="animate-spin text-blue-400" />
              </div>
            )}
          </div>

          {output.enhancedPrompt && (
            <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Engineered Prompt</h3>
                <button className="text-slate-400 hover:text-white transition-colors"><Save size={16}/></button>
              </div>
              <p className="text-sm italic text-slate-300 leading-relaxed">
                "{output.enhancedPrompt}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiVisionBoard;
import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Monitor, Smartphone, Square, Layout, Plus, 
  Cpu, Loader2, X, Copy, Download, Zap, Sparkles 
} from 'lucide-react';

// تأكد من استخدام موديلات 2026 الجديدة
const API_KEY = process.env.REACT_APP_GEMINI_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

const M7mdAIInterface = () => {
  const [activeTool, setActiveTool] = useState('image'); 
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [userInput, setUserInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(""); 
  const [resultContent, setResultContent] = useState(""); 
  const fileInputRef = useRef(null);

  // تحويل الصور لنظام Gemini 3
  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        rawFile: file,
        preview: URL.createObjectURL(file)
      }));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const handleGenerate = async () => {
    if (!userInput && files.length === 0) return alert("يا فنان، نحتاج وصفاً أو صورة لنبدأ!");

    setIsLoading(true);
    setShowResult(false);
    
    try {
      // إعدادات الأبعاد لعام 2026
      let width = 1024, height = 1024;
      if (selectedRatio === '16:9') { width = 1280; height = 720; }
      if (selectedRatio === '9:16') { width = 720; height = 1280; }
      if (selectedRatio === '4:5')  { width = 1080; height = 1350; }

      // استخدام الموديل الأحدث Gemini 3 Flash
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      if (activeTool === 'image') {
        let finalPrompt = userInput;

        if (files.length > 0) {
          const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
          const visionResult = await model.generateContent([
            "Analyze these images and the user prompt. Create a highly detailed, professional English artistic prompt for an AI generator. User Intent: " + userInput,
            ...imageParts
          ]);
          finalPrompt = visionResult.response.text();
        }

        const seed = Math.floor(Math.random() * 999999);
        // استخدام محرك Flux المتطور
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
        
        setGeneratedImageUrl(imageUrl);
        setShowResult(true);
      } else {
        // هندسة البرومبت بنظام التفكير (Thinking) في Gemini 3
        let promptParts = [`Write a state-of-the-art AI prompt for: "${userInput}". Aspect Ratio: ${selectedRatio}. Style: Cinematic & Hyper-realistic.`];
        if (files.length > 0) {
          const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
          promptParts = ["Reverse engineer this image style and create a master prompt:", ...imageParts, ...promptParts];
        }
        
        const result = await model.generateContent(promptParts);
        setResultContent(result.response.text());
        setShowResult(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setResultContent("حدث خطأ في الاتصال بخوادم Gemini 3. تأكد من مفتاح API الخاص بك.");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-10 text-right selection:bg-blue-500/30" dir="rtl">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-2xl transition-all duration-500 ${activeTool === 'image' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-purple-600 shadow-lg shadow-purple-600/20'}`}>
            <Cpu size={22} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter italic uppercase">M7MD AI <span className="text-blue-500 not-italic">G3</span></span>
        </div>
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <button onClick={() => {setActiveTool('image'); setShowResult(false);}} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>توليد الصور</button>
          <button onClick={() => {setActiveTool('prompt'); setShowResult(false);}} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'prompt' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}>هندسة برومبت</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Inputs Section */}
          <div className="w-full lg:flex-[2.5] space-y-6">
            <div className={`bg-[#0f172a]/50 backdrop-blur-md p-6 rounded-[2.5rem] border-2 transition-all duration-500 ${activeTool === 'image' ? 'border-blue-500/20' : 'border-purple-500/20'}`}>
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={activeTool === 'image' ? "ماذا يدور في خيالك اليوم؟" : "أدخل فكرتك لنحولها إلى برومبت احترافي..."}
                className="w-full h-32 bg-transparent text-white text-lg focus:outline-none resize-none placeholder:text-slate-500 font-medium"
              />
              <div className="mt-4 flex flex-wrap gap-3 border-t border-white/5 pt-5">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                {files.map(f => (
                  <div key={f.id} className="relative w-16 h-16 group">
                    <img src={f.preview} className="w-full h-full object-cover rounded-2xl border border-white/10 shadow-lg" alt="preview" />
                    <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="absolute -top-2 -left-2 bg-red-500 rounded-full p-1.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><X size={10}/></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current.click()} className="w-16 h-16 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white transition-all"><Plus size={20} /></button>
              </div>
            </div>

            {/* Results Display */}
            {showResult && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                {activeTool === 'image' ? (
                  <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-slate-900 group">
                    <img 
                      src={generatedImageUrl} 
                      className="w-full h-auto min-h-[300px] object-contain transition-transform duration-700 group-hover:scale-[1.02]" 
                      alt="Gemini 3 Result"
                      loading="lazy"
                    />
                    <div className="p-5 flex justify-center bg-black/40 backdrop-blur-md">
                      <a href={generatedImageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-3 bg-blue-600 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        <Download size={18} /> حفظ الصورة بجودة G3
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f172a]/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 relative group">
                    <button onClick={() => {navigator.clipboard.writeText(resultContent); alert('تم النسخ في الحافظة ✅');}} className="absolute top-6 left-6 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5"><Copy size={18} /></button>
                    <p className="text-left font-mono text-sm leading-relaxed text-blue-100/80 whitespace-pre-wrap" dir="ltr">{resultContent}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls Section */}
          <div className="w-full lg:flex-[1] space-y-6">
            <div className="bg-[#0f172a]/40 backdrop-blur-sm p-6 rounded-[2rem] border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 block">تنسيق الأبعاد</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: '1:1', label: 'مربع', icon: <Square size={14} /> },
                  { id: '16:9', label: 'عريض', icon: <Monitor size={14} /> },
                  { id: '9:16', label: 'طولي', icon: <Smartphone size={14} /> },
                  { id: '4:5', label: 'انستقرام', icon: <Layout size={14} /> }
                ].map(r => (
                  <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 ${selectedRatio === r.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-black/20 text-slate-500 hover:border-white/10'}`}>
                    {r.icon} <span className="text-[10px] font-bold">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-6 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'} shadow-2xl ${activeTool === 'image' ? 'bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 shadow-blue-500/20' : 'bg-gradient-to-tr from-purple-700 via-purple-600 to-pink-500 shadow-purple-500/20'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} fill="white" />}
              <span className="text-sm uppercase tracking-widest">{isLoading ? 'جاري الاستدلال...' : activeTool === 'image' ? 'توليد الصورة' : 'هندسة البرومبت'}</span>
            </button>
            
            <div className="p-4 rounded-2xl border border-white/5 bg-slate-900/30 text-center">
              <p className="text-[10px] text-slate-500 font-medium">نظام التشغيل: <span className="text-blue-400">Gemini 3 Flash</span></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
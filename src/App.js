import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Monitor, Smartphone, Square, Layout, Plus, 
  Cpu, Loader2, X, Copy, Download, Zap, Sparkles 
} from 'lucide-react';

const API_KEY = process.env.REACT_APP_GEMINI_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

const M7mdAI_G3_Final = () => {
  const [activeTool, setActiveTool] = useState('image'); 
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [userInput, setUserInput] = useState("");
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(""); 
  const [resultContent, setResultContent] = useState(""); 
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef(null);

  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  }

  const handleGenerate = async () => {
    if (!userInput && files.length === 0) return alert("اكتب وصفك الأول يا بطل!");

    setIsLoading(true);
    setShowResult(false);
    setImageLoaded(false);
    
    try {
      let width = 1024, height = 1024;
      if (selectedRatio === '16:9') { width = 1280; height = 720; }
      if (selectedRatio === '9:16') { width = 720; height = 1280; }
      if (selectedRatio === '4:5')  { width = 1080; height = 1350; }

      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      // البرومبت الموجه لـ نانا بنانه (Nano Banana System Prompt)
      const bananaInstructions = `
        Role: Expert AI Image Architect.
        Task: 
        1. If I ask for an image: Create a masterpiece prompt in English only. Use keywords like (8k resolution, cinematic lighting, hyper-realistic, unreal engine 5, masterpiece).
        2. If I ask for prompt engineering: Explain your improvements in Arabic, then provide the final English prompt inside a code block.
        Current Request: ${userInput}
      `;

      const imageParts = files.length > 0 ? await Promise.all(files.map(f => fileToGenerativePart(f.rawFile))) : [];
      const result = await model.generateContent([bananaInstructions, ...imageParts]);
      const responseText = result.response.text();

      if (activeTool === 'image') {
        // تنظيف النص المستخرج لضمان عدم وجود أحرف غريبة تفسد الرابط
        const cleanPrompt = responseText.replace(/['"«»]/g, '').trim();
        const seed = Math.floor(Math.random() * 1000000);
        
        // حل الخطأ 1033: استخدام encodeURIComponent لضمان سلامة الرابط
        const finalUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
        
        setGeneratedImageUrl(finalUrl);
        setResultContent("تم تجهيز الصورة بناءً على وصفك.. جاري التحميل بصيغة نانا بنانه.");
        setShowResult(true);
      } else {
        setResultContent(responseText);
        setShowResult(true);
      }
    } catch (error) {
      console.error(error);
      setResultContent("عذراً، حدث خطأ في النظام. تأكد من اتصال الإنترنت.");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-10 text-right" dir="rtl">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
            <Sparkles size={22} className="text-white" />
          </div>
          <span className="text-xl font-black italic">NANA BANANA <span className="text-blue-500">G3</span></span>
        </div>
        <div className="flex bg-slate-900 rounded-2xl p-1 border border-white/10">
          <button onClick={() => setActiveTool('image')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600' : 'text-gray-400'}`}>توليد صور</button>
          <button onClick={() => setActiveTool('prompt')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'prompt' ? 'bg-purple-600' : 'text-gray-400'}`}>هندسة برومبت</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:flex-[2.5] space-y-6">
            <div className="bg-[#0f172a] p-6 rounded-[2.5rem] border-2 border-white/5">
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="اوصف خيالك بالعربي وجمناي هيقوم بالباقي..."
                className="w-full h-32 bg-transparent text-white text-lg focus:outline-none resize-none"
              />
              <div className="mt-4 flex gap-3">
                <input type="file" ref={fileInputRef} hidden onChange={(e) => setFiles([{rawFile: e.target.files[0], preview: URL.createObjectURL(e.target.files[0])}])} />
                <button onClick={() => fileInputRef.current.click()} className="w-16 h-16 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-white/5 transition-all">
                  <Plus size={24} />
                </button>
                {files.map(f => (
                   <div key={f.preview} className="relative w-16 h-16">
                      <img src={f.preview} className="w-full h-full object-cover rounded-2xl" alt="p" />
                      <button onClick={() => setFiles([])} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"><X size={12}/></button>
                   </div>
                ))}
              </div>
            </div>

            {showResult && (
              <div className="animate-in fade-in slide-in-from-bottom-5">
                {activeTool === 'image' ? (
                  <div className="rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#0f172a] relative">
                    {!imageLoaded && (
                       <div className="h-[400px] w-full flex flex-col items-center justify-center gap-4 bg-slate-900">
                          <Loader2 className="animate-spin text-blue-500" size={40} />
                          <p className="text-sm font-mono text-slate-400">NANA BANANA IS PAINTING...</p>
                       </div>
                    )}
                    <img 
                      src={generatedImageUrl} 
                      className={`w-full h-auto min-h-[300px] object-contain transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`} 
                      alt="AI Result"
                      onLoad={() => setImageLoaded(true)}
                    />
                    <div className="p-4 flex justify-between items-center bg-black/40">
                      <p className="text-xs text-blue-400 font-mono">Engine: Gemini G3 + Flux</p>
                      <a href={generatedImageUrl} target="_blank" rel="noreferrer" className="p-3 bg-blue-600 rounded-2xl hover:scale-110 transition-transform">
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/10">
                    <button onClick={() => navigator.clipboard.writeText(resultContent)} className="mb-4 p-2 bg-white/5 rounded-lg flex items-center gap-2 text-xs hover:bg-white/10">
                       <Copy size={14} /> نسخ النص
                    </button>
                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{resultContent}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-full lg:flex-[1] space-y-6">
            <div className="bg-[#0f172a]/40 p-6 rounded-[2rem] border border-white/5">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">المقاس المطلوب</span>
              <div className="grid grid-cols-2 gap-3">
                {['1:1', '16:9', '9:16', '4:5'].map(r => (
                  <button key={r} onClick={() => setSelectedRatio(r)} className={`p-4 rounded-2xl border-2 transition-all ${selectedRatio === r ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-black/20 text-gray-500'}`}>
                    <span className="text-[10px] font-bold">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-6 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-50' : 'hover:scale-[1.02] shadow-2xl shadow-blue-500/20'} ${activeTool === 'image' ? 'bg-blue-600' : 'bg-purple-600'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={20} fill="white" />}
              <span>{isLoading ? 'جاري التفكير...' : 'توليد السحر'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAI_G3_Final;
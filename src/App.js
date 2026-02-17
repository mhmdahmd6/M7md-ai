import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, ImageIcon, Cpu, Loader2, X, Copy, Download, Palette, Zap
} from 'lucide-react';

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
  const [isError, setIsError] = useState(false); 
  const fileInputRef = useRef(null);

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
    if (!userInput && files.length === 0) return alert("أدخل وصفاً أو صورة!");

    setIsLoading(true);
    setShowResult(false);
    setIsError(false);
    
    try {
      // تحديد الأبعاد بدقة
      let width = 1024, height = 1024;
      if (selectedRatio === '16:9') { width = 1280; height = 720; }
      if (selectedRatio === '9:16') { width = 720; height = 1280; }
      if (selectedRatio === '4:5')  { width = 1080; height = 1350; }

      if (activeTool === 'image') {
        let finalPrompt = userInput;

        // إذا كان هناك صور، نحتاج Gemini للتحليل
        if (files.length > 0) {
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
            const visionResult = await model.generateContent([
              "Describe this image briefly in English for an AI art generator, based on this idea: " + userInput,
              ...imageParts
            ]);
            finalPrompt = visionResult.response.text();
          } catch (geminiErr) {
            console.warn("Gemini Quota full, using text prompt only.");
            // إذا فشل Gemini بسبب الكوتا، نكمل بالوصف النصي فقط ولا نتوقف
          }
        }

        // توليد الصورة مباشرة بدون انتظار التحميل المسبق لتجنب الـ Timeout
        const seed = Math.floor(Math.random() * 1000000);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
        
        setGeneratedImageUrl(imageUrl);
        setShowResult(true);
      } else {
        // هندسة البرومبت - هنا لا بد من Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let promptParts = [`Expert MJ v6 prompt for: "${userInput}". Ratio: ${selectedRatio}. English only.`];
        if (files.length > 0) {
          const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
          promptParts = ["Analyze image style and write a prompt:", ...imageParts, ...promptParts];
        }
        const result = await model.generateContent(promptParts);
        setResultContent(result.response.text());
        setShowResult(true);
      }
    } catch (error) {
      setIsError(true);
      setResultContent("الخدمة مشغولة حالياً (Quota 429). انتظر دقيقة وجرب مجدداً.");
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
          <div className={`p-2 rounded-xl ${activeTool === 'image' ? 'bg-blue-600' : 'bg-purple-600'}`}>
            <Cpu size={22} />
          </div>
          <span className="text-xl font-black italic">M7MD AI <span className="text-[10px] opacity-50">2026</span></span>
        </div>
        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
          <button onClick={() => setActiveTool('image')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600' : 'text-gray-400'}`}>توليد الصور</button>
          <button onClick={() => setActiveTool('prompt')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'prompt' ? 'bg-purple-600' : 'text-gray-400'}`}>هندسة برومبت</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Inputs */}
          <div className="w-full lg:flex-[2.5] space-y-6">
            <div className={`bg-[#0f172a] p-6 rounded-[2.5rem] border-2 ${activeTool === 'image' ? 'border-blue-500/20' : 'border-purple-500/20 shadow-purple-500/5'}`}>
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={activeTool === 'image' ? "اوصف الصورة التي تتخيلها..." : "حول فكرتك إلى برومبت احترافي..."}
                className="w-full h-32 bg-transparent text-white text-lg focus:outline-none resize-none"
              />
              <div className="mt-4 flex flex-wrap gap-3 border-t border-white/5 pt-5">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                {files.map(f => (
                  <div key={f.id} className="relative w-16 h-16 group">
                    <img src={f.preview} className="w-full h-full object-cover rounded-xl border border-white/10" alt="p" />
                    <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} className="absolute -top-2 -left-2 bg-red-500 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X size={10}/></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current.click()} className="w-16 h-16 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-white/5"><Plus size={20} /></button>
              </div>
            </div>

            {/* Results Display */}
            {showResult && (
              <div className="animate-in fade-in slide-in-from-bottom-5">
                {activeTool === 'image' ? (
                  <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a]">
                    <img 
                      src={generatedImageUrl} 
                      className="w-full h-auto min-h-[300px] object-contain" 
                      alt="AI Result"
                      loading="lazy"
                    />
                    <div className="p-4 flex justify-center bg-black/20">
                      <a href={generatedImageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-2 bg-blue-600 rounded-full text-xs font-bold hover:bg-blue-700 transition-all">
                        <Download size={14} /> حفظ الصورة بجودة عالية
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/10 relative group">
                    <button onClick={() => {navigator.clipboard.writeText(resultContent); alert('تم النسخ ✅');}} className="absolute top-4 left-4 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><Copy size={18} /></button>
                    <p className="text-left font-mono text-sm leading-relaxed text-purple-200" dir="ltr">{resultContent}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full lg:flex-[1] space-y-6">
            <div className="bg-[#0f172a]/40 p-6 rounded-[2rem] border border-white/5">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 block">اختر المقاس</span>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: '1:1', icon: <Square size={14} /> },
                  { id: '16:9', icon: <Monitor size={14} /> },
                  { id: '9:16', icon: <Smartphone size={14} /> },
                  { id: '4:5', icon: <Layout size={14} /> }
                ].map(r => (
                  <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedRatio === r.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-black/20 text-gray-500'}`}>
                    {r.icon} <span className="text-[10px] font-bold">{r.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-6 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'} shadow-2xl ${activeTool === 'image' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/20' : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/20'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} fill="white" />}
              <span className="text-sm uppercase tracking-widest">{isLoading ? 'جاري السحر...' : activeTool === 'image' ? 'توليد الصورة' : 'هندسة البرومبت'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
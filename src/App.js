import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, Image as ImageIcon, Cpu, Loader2,
  X, Copy, Download, Palette
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

  // تحويل الصورة لـ Base64 لـ Gemini
  async function fileToGenerativePart(file) {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
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

  const removeFile = (id) => setFiles(prev => prev.filter(item => item.id !== id));

  const handleGenerate = async () => {
    if (!userInput && files.length === 0) {
      alert("أدخل وصفاً أو ارفع صورة للبدء!");
      return;
    }

    setIsLoading(true);
    setShowResult(false);
    setIsError(false);
    
    try {
      if (activeTool === 'image') {
        // --- محرك توليد الصور (Flux) ---
        let width = 1024; let height = 1024;
        if (selectedRatio === '16:9') { width = 1280; height = 720; }
        if (selectedRatio === '9:16') { width = 720; height = 1280; }
        if (selectedRatio === '4:5')  { width = 800; height = 1000; }

        const seed = Math.floor(Math.random() * 999999);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(userInput)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
        
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve) => { img.onload = resolve; });
        
        setGeneratedImageUrl(imageUrl);
        setShowResult(true);
      } else {
        // --- محرك هندسة البرومبت (Gemini 2.5 Flash) ---
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        let promptParts = [
          `Role: Master Prompt Engineer. Create a Midjourney v6 prompt for: "${userInput}". Aspect Ratio: ${selectedRatio}. Output only the prompt.`
        ];

        if (files.length > 0) {
          const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
          promptParts = ["Analyze this image and create a professional prompt to recreate it:", ...imageParts, ...promptParts];
        }

        const result = await model.generateContent(promptParts);
        setResultContent(result.response.text());
        setShowResult(true);
      }
    } catch (error) {
      setIsError(true);
      setResultContent("Quota Full: يرجى الانتظار دقيقة أو تغيير الموديل.");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  const ratios = [
    { id: '9:16', icon: <Smartphone size={16} /> },
    { id: '16:9', icon: <Monitor size={16} /> },
    { id: '1:1', icon: <Square size={16} /> },
    { id: '4:5', icon: <Layout size={16} /> },
  ];

  const isImgMode = activeTool === 'image';

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-20" dir="rtl">
      <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${isImgMode ? 'bg-blue-600' : 'bg-purple-600'} p-2 rounded-xl transition-colors`}>
            <Cpu size={24} />
          </div>
          <span className="text-xl font-black italic uppercase">M7MD AI</span>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTool('image')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${isImgMode ? 'bg-blue-600' : 'text-gray-400'}`}>
            <ImageIcon size={16} /> توليد صور
          </button>
          <button onClick={() => setActiveTool('prompt')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${!isImgMode ? 'bg-purple-600' : 'text-gray-400'}`}>
            <Wand2 size={16} /> هندسة برومبت
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:flex-[2] space-y-6">
            <div className={`bg-[#0f172a]/80 p-1 rounded-[2rem] border transition-all ${isImgMode ? 'border-blue-500' : 'border-purple-500'} shadow-2xl`}>
              <div className="bg-[#0f172a] rounded-[1.9rem] p-6 text-right">
                <textarea 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={isImgMode ? "صف الصورة التي تريد توليدها..." : "اكتب فكرتك أو ارفع صورة لتحويلها لبرومبت..."}
                  className="w-full h-40 bg-transparent text-white text-lg focus:outline-none resize-none text-right font-medium"
                />
                
                {/* قسم رفع الصور - يظهر فقط في وضع البرومبت أو التحليل */}
                {!isImgMode && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                    {files.map(f => (
                      <div key={f.id} className="relative w-16 h-16 group">
                        <img src={f.preview} className="w-full h-full object-cover rounded-lg" alt="preview" />
                        <button onClick={() => removeFile(f.id)} className="absolute -top-1 -left-1 bg-red-600 rounded-full p-0.5"><X size={10}/></button>
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current.click()} className="w-16 h-16 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5"><Plus /></button>
                  </div>
                )}
              </div>
            </div>

            {showResult && (
              <div className="rounded-[2rem] overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                <div className={`px-6 py-4 flex justify-between ${isImgMode ? 'bg-blue-900/20' : 'bg-purple-900/20'}`}>
                  <span className="font-bold text-xs uppercase">{isImgMode ? 'Image Ready' : 'Prompt Ready'}</span>
                  {!isError && (
                    isImgMode ? <a href={generatedImageUrl} target="_blank" rel="noreferrer" className="text-[10px] bg-white/10 px-3 py-1 rounded-lg">تحميل</a>
                    : <button onClick={() => navigator.clipboard.writeText(resultContent)} className="text-[10px] bg-white/10 px-3 py-1 rounded-lg">نسخ</button>
                  )}
                </div>
                <div className="bg-black/40 p-6 flex justify-center min-h-[200px]">
                  {isError ? <p className="text-red-400">{resultContent}</p> : 
                   isImgMode ? <img src={generatedImageUrl} className="w-full rounded-xl" alt="result" /> :
                   <p className="text-left font-mono text-sm w-full whitespace-pre-wrap">{resultContent}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:flex-[1] space-y-4">
            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">الأبعاد</label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map(r => (
                  <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selectedRatio === r.id ? 'border-white bg-white/10' : 'border-white/5 text-gray-400'}`}>
                    {r.icon} <span className="text-[10px] font-bold">{r.id}</span>
                  </button>
                ))}
              </div>
            </div>
            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-40' : 'hover:scale-[1.02]'} ${isImgMode ? 'bg-blue-600 shadow-blue-500/20' : 'bg-purple-600 shadow-purple-500/20'} shadow-2xl`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />}
              <span className="uppercase tracking-widest">{isLoading ? 'جاري العمل...' : isImgMode ? 'توليد الصورة' : 'هندسة البرومبت'}</span>
            </button>
            <div className="text-center opacity-30 text-[9px] font-mono tracking-widest uppercase">M7MD AI • 2026 Edition</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
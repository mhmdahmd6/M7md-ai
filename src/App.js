import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, Image as ImageIcon, Cpu, Loader2,
  X, Copy, Download, Palette, Zap
} from 'lucide-react';

// --- إعداد Gemini ---
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

  // تحويل الصور لـ Base64
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

  // --- الدالة الأساسية للتوليد ---
  const handleGenerate = async () => {
    if (!userInput && files.length === 0) {
      alert("يا بطل، أضف وصفاً أو صورة أولاً!");
      return;
    }

    setIsLoading(true);
    setShowResult(false);
    setIsError(false);
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      if (activeTool === 'image') {
        // 1. تحضير الوصف النهائي (إذا كان هناك صور، نطلب من Gemini وصفها)
        let finalPrompt = userInput;
        
        if (files.length > 0) {
          const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
          const visionResult = await model.generateContent([
            "Describe this image in detail for an AI image generator, merging it with this user request: " + userInput + ". Provide only the English descriptive prompt.",
            ...imageParts
          ]);
          finalPrompt = visionResult.response.text();
        }

        // 2. تحديد الأبعاد بناءً على الاختيار
        let width = 1024, height = 1024;
        if (selectedRatio === '16:9') { width = 1280; height = 720; }
        if (selectedRatio === '9:16') { width = 720; height = 1280; }
        if (selectedRatio === '4:5')  { width = 1080; height = 1350; }

        // 3. إنشاء رابط الصورة (استخدام Pollinations مع Flux)
        const seed = Math.floor(Math.random() * 9999999);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
        
        // التحقق من تحميل الصورة
        const img = new Image();
        img.src = imageUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        setGeneratedImageUrl(imageUrl);
        setShowResult(true);

      } else {
        // --- هندسة البرومبت النصي ---
        let promptParts = [
          `Role: Master Prompt Engineer for Midjourney. Create a cinematic v6 prompt for: "${userInput}". Aspect Ratio: ${selectedRatio}. Output only the prompt.`
        ];

        if (files.length > 0) {
          const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
          promptParts = ["Analyze these reference images and write a professional prompt to recreate their style/content:", ...imageParts, ...promptParts];
        }

        const result = await model.generateContent(promptParts);
        setResultContent(result.response.text());
        setShowResult(true);
      }
    } catch (error) {
      console.error(error);
      setIsError(true);
      setResultContent("حدث ضغط على النظام، حاول مرة أخرى بعد قليل.");
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  const ratios = [
    { id: '1:1', label: 'مربع', icon: <Square size={14} /> },
    { id: '16:9', label: 'سينمائي', icon: <Monitor size={14} /> },
    { id: '9:16', label: 'ستوري', icon: <Smartphone size={14} /> },
    { id: '4:5', label: 'بوست', icon: <Layout size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-10" dir="rtl">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${activeTool === 'image' ? 'from-blue-600 to-cyan-500' : 'from-purple-600 to-pink-500'}`}>
            <Cpu size={22} />
          </div>
          <span className="text-xl font-black italic tracking-tighter">M7MD AI <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full not-italic">V5</span></span>
        </div>

        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
          <button onClick={() => {setActiveTool('image'); setShowResult(false);}} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600' : 'text-gray-400'}`}>
            <ImageIcon size={14} /> توليد الصور
          </button>
          <button onClick={() => {setActiveTool('prompt'); setShowResult(false);}} className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTool === 'prompt' ? 'bg-purple-600' : 'text-gray-400'}`}>
            <Wand2 size={14} /> هندسة برومبت
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Side: Input & Result */}
          <div className="w-full lg:flex-[2.5] space-y-6">
            <div className={`bg-[#0f172a]/80 p-6 rounded-[2.5rem] border-2 transition-all ${activeTool === 'image' ? 'border-blue-500/20' : 'border-purple-500/20'}`}>
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={activeTool === 'image' ? "أوصف الصورة الخرافية اللي في خيالك..." : "اكتب فكرتك وسأحولها لبرومبت احترافي..."}
                className="w-full h-32 bg-transparent text-white text-lg focus:outline-none resize-none text-right placeholder:text-gray-600"
              />
              
              {/* Image Upload Area (Visible for both now) */}
              <div className="mt-4 flex flex-wrap gap-3 border-t border-white/5 pt-5">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                {files.map(f => (
                  <div key={f.id} className="relative w-20 h-20 group">
                    <img src={f.preview} className="w-full h-full object-cover rounded-2xl border border-white/10" alt="preview" />
                    <button onClick={() => removeFile(f.id)} className="absolute -top-2 -left-2 bg-red-500 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current.click()} className="w-20 h-20 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 transition-all text-gray-500">
                  <Plus size={24} />
                  <span className="text-[9px] mt-1 font-bold">إضافة مرجع</span>
                </button>
              </div>
            </div>

            {/* Result Area */}
            {showResult && (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                {activeTool === 'image' ? (
                  <div className="relative group rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                    <img src={generatedImageUrl} className="w-full h-auto" alt="AI Generated" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <a href={generatedImageUrl} target="_blank" rel="noreferrer" className="p-3 bg-black/60 backdrop-blur-md rounded-2xl hover:bg-blue-600 transition-all">
                        <Download size={20} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 relative group">
                    <button onClick={() => {navigator.clipboard.writeText(resultContent); alert('تم النسخ ✅');}} className="absolute top-4 left-4 p-2 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Copy size={18} />
                    </button>
                    <p className="text-left font-mono text-sm leading-relaxed text-blue-200" dir="ltr">{resultContent}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Controls */}
          <div className="w-full lg:flex-[1] space-y-6">
            <div className="bg-[#0f172a]/40 p-6 rounded-[2rem] border border-white/5">
              <div className="flex items-center gap-2 mb-6 text-gray-400">
                <Palette size={16} />
                <span className="text-[11px] font-bold uppercase tracking-tighter">تنسيق المقاس</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ratios.map(r => (
                  <button key={r.id} onClick={() => setSelectedRatio(r.id)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${selectedRatio === r.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-black/20 hover:border-white/20'}`}>
                    {r.icon}
                    <span className="text-[10px] font-bold">{r.label}</span>
                    <span className="text-[9px] opacity-40 font-mono">{r.id}</span>
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
              <span className="uppercase tracking-widest text-sm">
                {isLoading ? 'جاري السحر...' : activeTool === 'image' ? 'توليد اللوحة' : 'صناعة البرومبت'}
              </span>
            </button>

            <div className="text-center">
               <p className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">M7MD AI Engine v5.0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
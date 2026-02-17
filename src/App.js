import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, Image as ImageIcon, Cpu, Loader2,
  X, Copy, Download, Palette
} from 'lucide-react';

// --- إعداد الاتصال بـ Gemini API ---
const API_KEY = process.env.REACT_APP_GEMINI_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

const M7mdAIInterface = () => {
  // States
  const [activeTool, setActiveTool] = useState('image'); // 'image' (توليد صورة) or 'prompt' (نص)
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  
  // النتائج
  const [generatedImageUrl, setGeneratedImageUrl] = useState(""); // للصورة المولدة
  const [resultContent, setResultContent] = useState(""); // للنص المولد
  
  const [isError, setIsError] = useState(false); 

  // --- دالة توليد الصورة (Text to Image) ---
  const generateImage = async (prompt, ratioId) => {
    // تحديد الأبعاد بناءً على النسبة المختارة
    let width = 1024;
    let height = 1024;
    if (ratioId === '16:9') { width = 1280; height = 720; }
    if (ratioId === '9:16') { width = 720; height = 1280; }
    if (ratioId === '4:5')  { width = 800; height = 1000; }

    // استخدام Pollinations API لتوليد الصورة (سريع ومجاني ولا يحتاج مفتاح)
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
    
    // خدعة لتحميل الصورة قبل عرضها
    const img = new Image();
    img.src = imageUrl;
    await new Promise((resolve) => {
        img.onload = resolve;
    });
    
    return imageUrl;
  };

  // --- المحرك الرئيسي ---
  const handleGenerate = async () => {
    if (!userInput) {
      alert("أدخل وصفاً أو برومبت للبدء!");
      return;
    }

    setIsLoading(true);
    setShowResult(false);
    setIsError(false);
    
    try {
      // ---------------------------------------------------------
      // المسار الأول: توليد صورة حقيقية (Image Generator)
      // ---------------------------------------------------------
      if (activeTool === 'image') {
        // نستخدم البرومبت الذي أدخله المستخدم مباشرة لتوليد الصورة
        const url = await generateImage(userInput, selectedRatio);
        setGeneratedImageUrl(url);
        setShowResult(true);
      } 
      
      // ---------------------------------------------------------
      // المسار الثاني: هندسة برومبت نصي (Prompt Engineering)
      // ---------------------------------------------------------
      else {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
          Role: Expert AI Art Prompt Engineer.
          Target Model: Midjourney v6.
          User Concept: "${userInput}".
          Aspect Ratio: ${selectedRatio}.
          
          Task: Write a highly detailed, cinematic English prompt describing this concept. 
          Include details about lighting, camera angle, texture, and style.
          End with parameters like --ar ${selectedRatio.replace(':','-')} --v 6.0
          Output ONLY the prompt text.
        `;
        
        const result = await model.generateContent(prompt);
        setResultContent(result.response.text());
        setShowResult(true);
      }

    } catch (error) {
      console.error("Error:", error);
      setIsError(true);
      setResultContent("حدث خطأ أثناء المعالجة: " + error.message);
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  // بيانات الواجهة
  const ratios = [
    { id: '9:16', label: 'Story', icon: <Smartphone size={16} /> },
    { id: '16:9', label: 'Cinema', icon: <Monitor size={16} /> },
    { id: '1:1', label: 'Square', icon: <Square size={16} /> },
    { id: '4:5', label: 'Post', icon: <Layout size={16} /> },
  ];

  // ألوان الثيم (أزرق للصور - بنفسجي للنصوص)
  const isImgMode = activeTool === 'image';
  const themeColor = isImgMode ? 'blue' : 'purple';
  const bgColor = isImgMode ? 'bg-blue-600' : 'bg-purple-600';
  const borderColor = isImgMode ? 'border-blue-500' : 'border-purple-500';

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-white/20 pb-20" dir="rtl">
      
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${bgColor} p-2 rounded-xl`}>
            <Cpu size={24} className="text-white" />
          </div>
          <span className="text-xl font-black italic tracking-tighter uppercase">M7MD AI</span>
        </div>

        <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTool('image')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>
            <ImageIcon size={16} /> توليد صور
          </button>
          <button onClick={() => setActiveTool('prompt')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'prompt' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>
            <Wand2 size={16} /> هندسة برومبت
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10 text-right">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Input/Output Area */}
          <div className="w-full lg:flex-[2] space-y-6">
            
            {/* Input Box */}
            <div className={`bg-[#0f172a]/80 p-1 rounded-[2rem] border transition-all duration-500 ${borderColor} shadow-2xl`}>
              <div className="bg-[#0f172a] rounded-[1.9rem] p-6">
                 <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isImgMode ? 'text-blue-400' : 'text-purple-400'}`}>
                      {isImgMode ? 'أدخل وصف الصورة (Prompt)' : 'أدخل فكرة البرومبت'}
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 font-mono border border-white/5">
                       Model: {isImgMode ? 'Flux Gen v1' : 'Gemini 1.5 Pro'}
                    </span>
                 </div>
                <textarea 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={isImgMode ? "اكتب وصف الصورة هنا... (مثال: Cinematic shot of an Egyptian family...)" : "اكتب فكرتك وسأحولها لبرومبت احترافي..."}
                  className="w-full h-40 bg-transparent text-white text-lg focus:outline-none resize-none placeholder:text-gray-600 leading-relaxed text-right font-medium"
                />
              </div>
            </div>

            {/* Result Display */}
            {showResult && (
              <div className={`rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-bottom-4 border ${isError ? 'border-red-500/30' : 'border-white/10'}`}>
                
                {/* Header of Result */}
                <div className={`px-6 py-4 flex items-center justify-between ${isError ? 'bg-red-900/20' : isImgMode ? 'bg-blue-900/20' : 'bg-purple-900/20'}`}>
                  <span className={`font-bold text-xs uppercase ${isError ? 'text-red-400' : 'text-white'}`}>
                    {isError ? 'فشل العملية' : isImgMode ? 'الصورة جاهزة ✨' : 'البرومبت جاهز ✨'}
                  </span>
                  
                  {!isError && (
                    <div className="flex gap-2">
                      {isImgMode ? (
                        <a href={generatedImageUrl} download="m7md-ai-image.jpg" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] transition-all">
                          <Download size={14} /> تحميل
                        </a>
                      ) : (
                        <button onClick={() => {navigator.clipboard.writeText(resultContent); alert('تم النسخ');}} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] transition-all">
                          <Copy size={14} /> نسخ
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content of Result */}
                <div className="bg-black/40 p-6 min-h-[200px] flex items-center justify-center">
                  {isError ? (
                     <p className="text-red-400 text-sm">{resultContent}</p>
                  ) : isImgMode ? (
                    // عرض الصورة المولدة
                    <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                      <img src={generatedImageUrl} alt="Generated" className="w-full h-auto object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-6">
                        <p className="text-white text-sm font-medium line-clamp-2" dir="ltr">{userInput}</p>
                      </div>
                    </div>
                  ) : (
                    // عرض النص المولد
                    <div className="w-full text-left text-gray-200 font-mono text-sm leading-8 whitespace-pre-wrap" dir="ltr">
                      {resultContent}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Controls */}
          <div className="w-full lg:flex-[1] space-y-4">
            
            {/* Dimensions */}
            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">
                <Palette size={12} className="inline ml-1"/> أبعاد الصورة
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map((ratio) => (
                  <button key={ratio.id} onClick={() => setSelectedRatio(ratio.id)} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${selectedRatio === ratio.id ? `border-${themeColor}-500 bg-${themeColor}-500/10 text-${themeColor}-400` : 'border-white/5 bg-black/20 text-gray-400 hover:border-white/20'}`}>
                    {ratio.icon} <span className="text-[10px] font-bold italic">{ratio.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-5 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 shadow-xl'} ${bgColor}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={22} fill="white" />}
              <span className="text-sm font-black uppercase tracking-widest">
                {isLoading ? 'جاري التنفيذ...' : isImgMode ? 'توليد الصورة الآن' : 'كتابة البرومبت'}
              </span>
            </button>

            <div className="text-center opacity-30 mt-4">
               <p className="text-[9px] font-mono">M7MD AI • POWERED BY GEMINI & FLUX</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
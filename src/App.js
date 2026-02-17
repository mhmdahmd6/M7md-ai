import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, Image as ImageIcon, Cpu, Loader2, CheckCircle2, 
  X, Copy, AlertTriangle, RefreshCcw
} from 'lucide-react';

// --- إعداد الاتصال بـ Gemini API ---
// تأكد من وضع المفتاح في ملف .env تحت اسم REACT_APP_GEMINI_KEY
const API_KEY = process.env.REACT_APP_GEMINI_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

const M7mdAIInterface = () => {
  const [activeTool, setActiveTool] = useState('image');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [files, setFiles] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [resultContent, setResultContent] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const fileInputRef = useRef(null);

  // وظيفة تحويل الملف لـ Base64 لضمان التوافق مع الوسائط
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

  // --- المحرك الذكي للتعامل مع Gemini API ---
  const handleGenerate = async () => {
    if (!userInput && files.length === 0) {
      alert("أدخل وصفاً أو ارفع صورة أولاً");
      return;
    }

    if (!API_KEY || API_KEY === "undefined") {
      alert("خطأ: مفتاح الـ API غير موجود. تحقق من ملف .env");
      return;
    }

    setIsLoading(true);
    setProgress(15);
    setShowResult(false);
    setStatusMessage("جاري تهيئة خوارزميات M7MD AI...");

    const executeAiCall = async (modelName) => {
      // نستخدم الموديل المستقر لتجنب خطأ 404
      const model = genAI.getGenerativeModel({ model: modelName });
      
      let promptText = "";
      if (activeTool === 'prompt') {
        promptText = `Role: Professional AI Prompt Engineer. Task: Convert the following user idea into a very detailed English prompt for high-end AI image generators (Midjourney/DALL-E): "${userInput}". Focus on lighting, style, and camera settings.`;
      } else {
        promptText = `Task: Act as a visual analyzer. Analyze the attached images and this description: "${userInput}". Generate a professional English prompt to create a similar image but optimized for ${selectedRatio} aspect ratio.`;
      }

      if (files.length > 0) {
        const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
        // هيكل المصفوفة الصحيح لتجنب خطأ 400
        return await model.generateContent([promptText, ...imageParts]);
      } else {
        return await model.generateContent(promptText);
      }
    };

    try {
      // المحاولة الأساسية: استخدام Flash لأنه الأسرع والأكثر توافقاً مع الفئة المجانية
      setStatusMessage("جاري معالجة البيانات عبر الخادم السريع...");
      let result = await executeAiCall("gemini-1.5-flash"); 
      
      setProgress(85);
      const response = await result.response;
      const text = response.text();
      
      setResultContent(text);
      setProgress(100);
      setIsLoading(false);
      setShowResult(true);

    } catch (error) {
      console.error("Critical System Error:", error);
      
      // نظام التعافي التلقائي (Auto-Fallback)
      if (error.message.includes("404") || error.message.includes("503") || error.message.includes("400")) {
        setStatusMessage("تبديل المسار للموديل الاحتياطي المستقر...");
        try {
          let fallbackResult = await executeAiCall("gemini-1.5-pro");
          const response = await fallbackResult.response;
          setResultContent(response.text());
          setShowResult(true);
        } catch (fallbackError) {
          alert("الضغط مرتفع جداً حالياً على خوادم جوجل. يرجى المحاولة بعد 30 ثانية.");
        }
      } else if (error.message.includes("429")) {
        alert("تنبيه: تجاوزت حد الطلبات المسموح به في الدقيقة. يرجى الانتظار قليلاً.");
      } else {
        alert("فشل الاتصال: " + error.message);
      }
      setIsLoading(false);
      setProgress(0);
    }
  };

  const ratios = [
    { id: '9:16', label: 'موبايل', icon: <Smartphone size={16} /> },
    { id: '16:9', label: 'كمبيوتر', icon: <Monitor size={16} /> },
    { id: '1:1', label: 'مربع', icon: <Square size={16} /> },
    { id: '4:5', label: 'سوشيال', icon: <Layout size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 pb-20" dir="rtl">
      
      {/* Header Section */}
      <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-blue-900/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Cpu size={22} className="text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-l from-blue-400 to-white bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">M7MD AI</span>
        </div>

        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => {setActiveTool('image'); setShowResult(false);}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-blue-400'}`}>
            <ImageIcon size={16} /> تحليل الصور
          </button>
          <button onClick={() => {setActiveTool('prompt'); setShowResult(false);}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'prompt' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-gray-400 hover:text-indigo-400'}`}>
            <Wand2 size={16} /> هندسة النصوص
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10 text-right">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Input & Output Area */}
          <div className="w-full lg:flex-[2] space-y-6">
            <div className={`p-0.5 rounded-[2rem] bg-gradient-to-br ${activeTool === 'image' ? 'from-blue-500/20 to-transparent' : 'from-indigo-500/20 to-transparent'}`}>
              <div className="bg-[#0f172a]/80 backdrop-blur-md p-5 rounded-[1.9rem] border border-white/5 shadow-2xl">
                <textarea 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={activeTool === 'image' ? "صف فكرتك أو ارفع صوراً للتحليل وتوليد برومبت مشابه..." : "اكتب فكرتك وسأقوم بتحويلها لبرومبت احترافي لـ Midjourney..."}
                  className="w-full h-40 bg-transparent text-white text-base focus:outline-none transition-all resize-none placeholder:opacity-30 text-right leading-relaxed"
                />
              </div>
            </div>

            {isLoading && (
              <div className="px-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] text-blue-400 font-black tracking-widest">
                  <div className="flex items-center gap-2">
                    <RefreshCcw size={12} className="animate-spin" />
                    <span>{statusMessage}</span>
                  </div>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_#3b82f6]" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {showResult && (
              <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2rem] shadow-inner animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-[11px] uppercase tracking-tighter">
                    <CheckCircle2 size={16} /> النتيجة من M7MD AI
                  </div>
                  <button 
                    onClick={() => {navigator.clipboard.writeText(resultContent); alert('تم النسخ! ✅');}} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-black transition-all hover:scale-105"
                  >
                    <Copy size={14} /> نسخ البرومبت
                  </button>
                </div>
                <div className="p-5 bg-black/40 rounded-xl border border-white/5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {resultContent}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Settings Area */}
          <div className="w-full lg:flex-[1] space-y-4">
            
            {/* Ratio Selection */}
            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">الأبعاد المفضلة</label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map((ratio) => (
                  <button key={ratio.id} onClick={() => setSelectedRatio(ratio.id)} className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${selectedRatio === ratio.id ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'border-white/5 bg-black/20 text-gray-400 hover:border-blue-900'}`}>
                    {ratio.icon} <span className="text-[10px] font-bold italic">{ratio.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">الصور المرجعية (Reference)</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              <div className="flex flex-wrap gap-2">
                {files.map((item) => (
                  <div key={item.id} className="relative w-14 h-14 group">
                    <img src={item.preview} className="w-full h-full object-cover rounded-lg border border-blue-500/30" alt="preview" />
                    <button onClick={() => removeFile(item.id)} className="absolute -top-1 -left-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all text-white shadow-lg">
                      <X size={10}/>
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current.click()} className="w-14 h-14 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center bg-black/20 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group">
                  <Plus size={20} className="text-gray-600 group-hover:text-blue-500" />
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 shadow-2xl'} ${activeTool === 'image' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} fill="white" />}
              <span className="text-sm font-black uppercase tracking-widest leading-none">{isLoading ? 'جاري التحليل...' : 'توليد النتيجة'}</span>
            </button>

            {/* Branding Tag */}
            <div className="flex items-center justify-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
               <AlertTriangle size={10} />
               <span className="text-[8px] font-bold tracking-tight">M7MD AI Framework v4.0 | Feb 2026 Engine</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
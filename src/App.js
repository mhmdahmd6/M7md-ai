import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, Image as ImageIcon, Cpu, Loader2,
  X, Copy, RefreshCcw
} from 'lucide-react';

// --- إعداد الاتصال بـ Gemini API ---
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

  // وظيفة تحويل الملف لـ Base64 لضمان التوافق
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

  // --- المحرك الذكي المحدث لعام 2026 ---
  const handleGenerate = async () => {
    if (!userInput && files.length === 0) {
      alert("أدخل وصفاً أو ارفع صورة أولاً");
      return;
    }

    setIsLoading(true);
    setProgress(10);
    setShowResult(false);
    
    try {
      let finalResponse = "";

      // الحالة الأولى: تحليل الصور باستخدام Gemini 2.5 Flash
      if (activeTool === 'image' && files.length > 0) {
        setStatusMessage("جاري تحليل الصور عبر M7MD AI...");
        setProgress(30);
        
        const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const imageParts = await Promise.all(files.map(f => fileToGenerativePart(f.rawFile)));
        
        const visionPrompt = `Analyze these images in detail. List the subject, art style, lighting, and colors. Context: ${userInput}`;
        const visionResult = await visionModel.generateContent([visionPrompt, ...imageParts]);
        const visionAnalysis = visionResult.response.text();

        // المرحلة الثانية: إرسال التحليل لـ Gemini 3 Pro لصياغة البرومبت النهائي
        setStatusMessage("جاري صياغة البرومبت الاحترافي عبر M7MD AI...");
        setProgress(70);
        
        const proModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const proPrompt = `Based on this visual analysis: "${visionAnalysis}", create a high-end Midjourney prompt with aspect ratio ${selectedRatio}. Style should be professional and cinematic.`;
        const finalResult = await proModel.generateContent(proPrompt);
        finalResponse = finalResult.response.text();
      } 
      
      // الحالة الثانية: هندسة النصوص مباشرة عبر Gemini 3 Pro
      else {
        setStatusMessage("جاري التفكير عبر M7MD AI...");
        setProgress(50);
        
        const proModel = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const textPrompt = `Role: Professional Prompt Engineer. Convert this idea into a detailed English prompt for AI generators: "${userInput}". Aspect ratio: ${selectedRatio}. Include technical camera settings and lighting.`;
        const result = await proModel.generateContent(textPrompt);
        finalResponse = result.response.text();
      }

      setResultContent(finalResponse);
      setProgress(100);
      setShowResult(true);
    } catch (error) {
      console.error("API Error:", error);
      if (error.message.includes("429")) {
        alert("انتهت حصة الاستخدام (Quota). يرجى الانتظار دقيقة أو تغيير المفتاح.");
      } else {
        alert("فشل النظام: " + error.message);
      }
    } finally {
      setIsLoading(false);
      setStatusMessage("");
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
      
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-blue-900/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Cpu size={22} className="text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-l from-blue-400 to-white bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">M7MD AI</span>
        </div>

        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTool('image')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-400'}`}>
            <ImageIcon size={16} /> الموديل المزدوج
          </button>
          <button onClick={() => setActiveTool('prompt')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'prompt' ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-gray-400'}`}>
            <Wand2 size={16} /> Gemini 3 Pro
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10 text-right">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="w-full lg:flex-[2] space-y-6">
            <div className="bg-[#0f172a]/80 p-5 rounded-[1.9rem] border border-white/5 shadow-2xl">
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={activeTool === 'image' ? "صف ما تريد تعديله في الصورة..." : "اكتب فكرتك لتحويلها لبرومبت..."}
                className="w-full h-40 bg-transparent text-white text-base focus:outline-none resize-none placeholder:opacity-30 leading-relaxed"
              />
            </div>

            {isLoading && (
              <div className="px-4 space-y-3">
                <div className="flex justify-between text-[10px] text-blue-400 font-black">
                  <div className="flex items-center gap-2">
                    <RefreshCcw size={12} className="animate-spin" />
                    <span>{statusMessage}</span>
                  </div>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {showResult && (
              <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2rem] animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                  <span className="text-blue-400 font-bold text-[11px] uppercase tracking-tighter">النتيجة النهائية (Prompt Engineered)</span>
                  <button onClick={() => navigator.clipboard.writeText(resultContent)} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-[11px] font-black hover:bg-white/10 transition-all">
                    <Copy size={14} /> نسخ
                  </button>
                </div>
                <div className="p-5 bg-black/40 rounded-xl text-gray-200 text-sm leading-relaxed">
                  {resultContent}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:flex-[1] space-y-4">
            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">الأبعاد</label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map((ratio) => (
                  <button key={ratio.id} onClick={() => setSelectedRatio(ratio.id)} className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${selectedRatio === ratio.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-black/20 text-gray-400'}`}>
                    {ratio.icon} <span className="text-[10px] font-bold italic">{ratio.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">التحليل البصري (Flash)</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              <div className="flex flex-wrap gap-2">
                {files.map((item) => (
                  <div key={item.id} className="relative w-14 h-14 group">
                    <img src={item.preview} className="w-full h-full object-cover rounded-lg border border-blue-500/30" alt="preview" />
                    <button onClick={() => removeFile(item.id)} className="absolute -top-1 -left-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all text-white"><X size={10}/></button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current.click()} className="w-14 h-14 border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500/10 transition-all"><Plus size={20}/></button>
              </div>
            </div>

            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-40' : 'hover:scale-[1.02] active:scale-95 shadow-2xl'} bg-gradient-to-r from-blue-600 to-indigo-600`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} fill="white" />}
              <span className="text-sm font-black uppercase tracking-widest">{isLoading ? 'جاري المعالجة المزدوجة...' : 'توليد السحر'}</span>
            </button>
            
            <div className="text-center opacity-20">
              <span className="text-[8px] font-bold tracking-tight">M7MD AI v4.0 | Next-Gen Architecture</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
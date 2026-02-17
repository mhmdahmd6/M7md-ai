import React, { useState, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  Sparkles, Monitor, Smartphone, Square, Layout, Plus, 
  Wand2, Image as ImageIcon, Cpu, Loader2, CheckCircle2, 
  X, Copy 
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
  const fileInputRef = useRef(null);

  // وظيفة تحويل الملف لـ Base64
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

  // --- محرك التعامل مع Gemini API ---
  const handleGenerate = async () => {
    if (!userInput && files.length === 0) {
      alert("أدخل وصفاً أو ارفع صورة أولاً");
      return;
    }

    if (!API_KEY || API_KEY === "undefined") {
      alert("خطأ: مفتاح الـ API غير معرف في إعدادات Vercel (REACT_APP_GEMINI_KEY)");
      return;
    }

    setIsLoading(true);
    setProgress(20);
    setShowResult(false);

    try {
      // استخدام النسخة المستقرة من الموديل
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      let result;
      if (activeTool === 'prompt') {
        const prompt = `بصفتك خبير Prompt Engineering، حول هذه الفكرة لبرومبت إنجليزي دقيق لمولدات الصور مثل Midjourney: ${userInput}`;
        result = await model.generateContent(prompt);
      } else {
        setProgress(40);
        const imageParts = await Promise.all(
          files.map(f => fileToGenerativePart(f.rawFile))
        );
        const prompt = `حلل الصور المرفقة والوصف: "${userInput}". اقترح برومبت إنجليزي احترافي لإنشاء صورة مشابهة بنسبة أبعاد ${selectedRatio}.`;
        result = await model.generateContent([prompt, ...imageParts]);
      }

      setProgress(80);
      const response = await result.response;
      const text = response.text();
      
      setResultContent(text);
      setProgress(100);
      setIsLoading(false);
      setShowResult(true);

    } catch (error) {
      console.error("Debug Error:", error);
      let msg = error.message;
      if (msg.includes("404")) msg = "خطأ 404: تأكد من تحديث مكتبة جوجل أو تغيير اسم الموديل.";
      alert("فشل الاتصال بـ M7MD AI: " + msg);
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
      
      {/* الشريط العلوي */}
      <nav className="sticky top-0 z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-blue-900/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <Cpu size={22} className="text-white" />
          </div>
          <span className="text-xl font-black bg-gradient-to-l from-blue-400 to-white bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">M7MD AI</span>
        </div>

        <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button onClick={() => {setActiveTool('image'); setShowResult(false);}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'image' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-blue-400'}`}>
            <ImageIcon size={16} /> مولد الصور
          </button>
          <button onClick={() => {setActiveTool('prompt'); setShowResult(false);}} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTool === 'prompt' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-gray-400 hover:text-indigo-400'}`}>
            <Wand2 size={16} /> هندسة النصوص
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-10 text-right">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          <div className="w-full lg:flex-[2] space-y-6">
            <div className={`p-0.5 rounded-[2rem] bg-gradient-to-br ${activeTool === 'image' ? 'from-blue-500/20 to-transparent' : 'from-indigo-500/20 to-transparent'}`}>
              <div className="bg-[#0f172a]/80 backdrop-blur-md p-5 rounded-[1.9rem] border border-white/5 shadow-2xl">
                <textarea 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={activeTool === 'image' ? "صف ما تتخيله أو ارفع صوراً للتحليل..." : "اكتب فكرتك وسأجعلها برومبت احترافي..."}
                  className="w-full h-40 bg-transparent text-white text-base focus:outline-none transition-all resize-none placeholder:opacity-30 text-right leading-relaxed"
                />
              </div>
            </div>

            {isLoading && (
              <div className="px-4">
                <div className="flex justify-between text-[10px] mb-2 text-blue-400 font-black tracking-widest">
                  <span>جاري المعالجة عبر Gemini API...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-900/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {showResult && (
              <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[2rem] shadow-inner">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-[11px] uppercase tracking-tighter">
                    <CheckCircle2 size={16} /> النتيجة النهائية
                  </div>
                  <button 
                    onClick={() => {navigator.clipboard.writeText(resultContent); alert('تم النسخ! ✅');}} 
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[11px] font-black transition-all"
                  >
                    <Copy size={14} /> نسخ النص
                  </button>
                </div>
                <div className="p-5 bg-black/40 rounded-xl border border-white/5 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {resultContent}
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:flex-[1] space-y-4">
            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">الأبعاد المطلوبة</label>
              <div className="grid grid-cols-2 gap-2">
                {ratios.map((ratio) => (
                  <button key={ratio.id} onClick={() => setSelectedRatio(ratio.id)} className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border transition-all ${selectedRatio === ratio.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-black/20 text-gray-400 hover:border-blue-900'}`}>
                    {ratio.icon} <span className="text-[10px] font-bold italic">{ratio.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0f172a]/40 p-5 rounded-[1.5rem] border border-white/5">
              <label className="text-[10px] font-bold text-gray-500 mb-4 block text-center uppercase tracking-widest">الصور المرجعية</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple />
              <div className="flex flex-wrap gap-2">
                {files.map((item) => (
                  <div key={item.id} className="relative w-14 h-14 group">
                    <img src={item.preview} className="w-full h-full object-cover rounded-lg border border-blue-500/30" alt="preview" />
                    <button onClick={() => removeFile(item.id)} className="absolute -top-1 -left-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all text-white">
                      <X size={10}/>
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current.click()} className="w-14 h-14 border-2 border-dashed border-white/5 rounded-lg flex items-center justify-center bg-black/20 hover:bg-blue-500/10 transition-all group">
                  <Plus size={20} className="text-gray-600 group-hover:text-blue-500" />
                </button>
              </div>
            </div>

            <button 
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all ${isLoading ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 shadow-2xl'} ${activeTool === 'image' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-indigo-600 shadow-indigo-500/20'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={18} fill="white" />}
              <span className="text-sm font-black uppercase tracking-widest">{isLoading ? 'جاري التحليل...' : 'توليد النتيجة'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default M7mdAIInterface;
"use client";

import { useEffect, useState } from "react";
import { fetchSheetData, updateFlashcardReview, addSheetRow, translateText, Flashcard } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { playAudio } from "@/lib/audio";
import { Volume2, Plus, Sparkles, Search, Settings2, Play, CheckCircle2 } from "lucide-react";
import { pinyin, match } from "pinyin-pro";
import HanziAnimator from "@/components/HanziAnimator";

export default function VocabPage() {
  const [data, setData] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Session State
  const [sessionLevel, setSessionLevel] = useState("Tất cả");
  const [sessionLimit, setSessionLimit] = useState(10);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [sessionTotalCount, setSessionTotalCount] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechResult, setSpeechResult] = useState<{text: string, isCorrect: boolean | null}>({text: "", isCorrect: null});

  const startListening = (targetWord: string) => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ chức năng này. Hãy thử dùng Google Chrome nhé!");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
      setSpeechResult({text: "", isCorrect: null});
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const cleanTranscript = transcript.replace(/[.,!?。，！？]/g, '').trim();
      const cleanTarget = targetWord.replace(/[.,!?。，！？]/g, '').trim();
      
      setSpeechResult({
        text: cleanTranscript,
        isCorrect: cleanTranscript === cleanTarget
      });
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };
  const [updating, setUpdating] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [newVocab, setNewVocab] = useState({ Hanzi: "", Pinyin: "", Meaning: "", Level: "HSK 1" });

  const levels = ["Tất cả", "HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5", "HSK 6"];
  const limits = [10, 20, 50, 0]; // 0 means 'Tất cả'

  const loadData = async () => {
    setLoading(true);
    const result = await fetchSheetData<Flashcard>("Vocab");
    setData(result);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = result.filter(card => {
      if (!card.Next_Review_Date) return true;
      const reviewDate = new Date(card.Next_Review_Date);
      return reviewDate <= today;
    });
    
    setDueCards(due);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const startSession = () => {
    let filtered = dueCards;
    if (sessionLevel !== "Tất cả") {
       filtered = filtered.filter(c => c.Level === sessionLevel);
    }
    const limit = sessionLimit === 0 ? filtered.length : sessionLimit;
    const selected = filtered.slice(0, limit);
    
    if (selected.length === 0) {
      alert("Không có từ nào cần ôn cho thiết lập này.");
      return;
    }
    
    setSessionCards(selected);
    setSessionTotalCount(selected.length);
    setIsSessionActive(true);
    setIsFlipped(false);
  };

  const handleFlip = () => {
    if (!isFlipped && sessionCards.length > 0) {
      setIsFlipped(true);
      playAudio(sessionCards[0].Hanzi);
    }
  };

  const handleReview = async (quality: "again" | "hard" | "easy") => {
    if (updating || sessionCards.length === 0) return;
    setUpdating(true);
    
    const card = sessionCards[0];
    let interval = Number(card.Interval_Days) || 0;
    
    if (quality === "again") {
      interval = 0; // Học lại liền
    } else if (quality === "hard") {
      interval = interval === 0 ? 1 : Math.max(1, Math.floor(interval * 0.5)); // Rút ngắn một nửa thời gian nếu khó
    } else if (quality === "easy") {
      // Spaced Repetition tăng dần
      if (interval === 0) interval = 3; // Lần đầu mà thấy dễ thì 3 ngày sau mới gặp lại
      else if (interval === 1) interval = 3;
      else if (interval === 3) interval = 7;
      else if (interval === 7) interval = 14;
      else if (interval === 14) interval = 30;
      else interval = Math.floor(interval * 1.5); 
    }
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    
    await updateFlashcardReview(card.ID, nextDateStr, interval);
    
    const nextQueue = [...sessionCards];
    const processedCard = nextQueue.shift()!;
    
    if (quality === "again") {
      nextQueue.push(processedCard); // Đẩy xuống cuối hàng đợi để học lại
    } else {
      // Xoá hẳn khỏi danh sách dueCards của ngày hôm nay
      setDueCards(prev => prev.filter(c => c.ID !== processedCard.ID));
    }
    
    setSessionCards(nextQueue);
    setIsFlipped(false);
    setUpdating(false);
  };

  const handleAddVocab = async () => {
    if (!newVocab.Hanzi || !newVocab.Meaning) return;
    setAdding(true);
    const success = await addSheetRow("Vocab", newVocab);
    if (success) {
      setShowAddModal(false);
      setNewVocab({ Hanzi: "", Pinyin: "", Meaning: "", Level: "HSK 1" });
      await loadData();
    } else {
      alert("Lỗi khi thêm từ vựng.");
    }
    setAdding(false);
  };

  const handleAutoTranslate = async () => {
    if (!newVocab.Meaning) return;
    setTranslating(true);
    try {
      const result = await translateText(newVocab.Meaning);
      if (result && result.zhCN) {
        const generatedPinyin = pinyin(result.zhCN);
        setNewVocab({
          ...newVocab,
          Hanzi: result.zhCN,
          Pinyin: generatedPinyin
        });
      }
    } catch (error: any) {
      alert("Lỗi dịch thuật: " + error.message);
    }
    setTranslating(false);
  };

  if (loading) {
    return <div className="flex justify-center mt-20"><Spinner /></div>;
  }

  const searchResults = searchQuery
    ? data.filter(card => {
        if (card.Hanzi.includes(searchQuery) || card.Meaning.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        const matched = match(card.Hanzi, searchQuery);
        return matched !== null && matched.length > 0;
      })
    : [];

  // If searching, render list mode
  if (searchQuery) {
    return (
      <div className="p-4 max-w-md mx-auto pt-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={20} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm (nhập nh để tìm 你好)..."
              className="w-full pl-10 pr-4 py-2.5 bg-default-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-[17px]"
            />
          </div>
          <button 
            onClick={() => setSearchQuery("")}
            className="px-3 text-[#007AFF] text-[17px]"
          >
            Hủy
          </button>
        </div>
        
        <div className="space-y-3 pb-12">
          {searchResults.map(card => (
            <div key={card.ID} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-default-200 dark:border-default-50/10 flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold mb-1">{card.Hanzi}</p>
                <p className="text-sm text-[#007AFF] font-medium">{card.Pinyin}</p>
                <p className="text-sm text-default-500 mt-1">{card.Meaning}</p>
              </div>
              <button 
                className="w-10 h-10 bg-default-100 hover:bg-default-200 rounded-full flex items-center justify-center text-[#007AFF] transition-colors flex-shrink-0"
                onClick={() => playAudio(card.Hanzi)}
              >
                <Volume2 size={20} />
              </button>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div className="text-center text-default-500 mt-10">
              Không tìm thấy từ nào.
            </div>
          )}
        </div>
        
        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // Session Config Mode
  if (!isSessionActive) {
    return (
      <div className="p-4 max-w-md mx-auto flex flex-col h-[calc(100vh-84px)] pt-8">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={18} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nhanh..."
              className="w-full pl-10 pr-4 py-2 bg-default-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors flex-shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex-1">
          <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-sm border border-default-200 dark:border-default-50/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
                <Settings2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Thiết lập Ôn tập</h2>
                <p className="text-default-500 text-sm">{dueCards.length} từ vựng đang chờ bạn.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Bộ lọc Cấp độ</label>
                <div className="relative">
                  <select 
                    value={sessionLevel}
                    onChange={(e) => setSessionLevel(e.target.value)}
                    className="w-full bg-default-100 dark:bg-default-50/5 text-foreground font-medium p-3 rounded-xl focus:outline-none appearance-none"
                  >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-default-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Giới hạn số lượng (Daily Limit)</label>
                <div className="grid grid-cols-4 gap-2">
                  {limits.map(limit => (
                    <button
                      key={limit}
                      onClick={() => setSessionLimit(limit)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-colors ${
                        sessionLimit === limit 
                          ? "bg-foreground text-background" 
                          : "bg-default-100 text-default-600 hover:bg-default-200"
                      }`}
                    >
                      {limit === 0 ? "Tất cả" : limit}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={startSession}
                className="w-full bg-[#007AFF] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-md mt-6"
              >
                <Play size={20} className="fill-white" />
                Bắt đầu ôn tập
              </button>
            </div>
          </div>
        </div>

        {showAddModal && renderAddModal()}
      </div>
    );
  }

  // Active Session Complete
  if (sessionCards.length === 0) {
    return (
      <div className="p-4 max-w-md mx-auto h-[calc(100vh-84px)] flex flex-col justify-center text-center">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Hoàn thành!</h2>
        <p className="text-default-500 mb-8">Bạn đã xuất sắc hoàn thành phiên học {sessionTotalCount} từ vựng.</p>
        <button 
          onClick={() => setIsSessionActive(false)}
          className="bg-default-200 hover:bg-default-300 text-foreground font-bold py-4 px-8 rounded-2xl transition-colors mx-auto"
        >
          Trở về Cài đặt Ôn tập
        </button>
      </div>
    );
  }

  const card = sessionCards[0];

  return (
    <div className="p-4 max-w-md mx-auto flex flex-col h-[calc(100vh-84px)] pt-8">
      <div className="flex justify-between items-center mb-6 px-2">
        <button 
          onClick={() => setIsSessionActive(false)}
          className="text-default-500 hover:text-foreground text-sm font-medium transition-colors"
        >
          Tạm dừng
        </button>
        <div className="bg-default-100 text-default-600 px-3 py-1 rounded-full text-sm font-medium">
          Còn lại: {sessionCards.length} từ
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center pb-12">
        <div 
          className="relative w-full aspect-[3/4] max-h-[460px] mx-auto cursor-pointer group"
          style={{ perspective: "1000px" }}
          onClick={handleFlip}
        >
          <div 
            className="w-full h-full relative transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ 
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
            }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 w-full h-full bg-white dark:bg-[#1C1C1E] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none dark:border dark:border-white/10 flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: "hidden" }}
            >
              <p className="text-7xl font-bold mb-8 text-foreground">{card.Hanzi}</p>
              {!isFlipped && (
                <div className="absolute bottom-10 flex flex-col items-center opacity-60">
                  <p className="text-sm tracking-wide text-default-400">Chạm để lật thẻ</p>
                </div>
              )}
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 w-full h-full bg-white dark:bg-[#1C1C1E] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none dark:border dark:border-white/10 flex flex-col items-center justify-center p-8"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <button 
                className="absolute top-6 right-6 w-10 h-10 bg-default-100 hover:bg-default-200 rounded-full flex items-center justify-center text-[#007AFF] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudio(card.Hanzi);
                }}
              >
                <Volume2 size={20} />
              </button>
              
              <div className="mb-6 h-[60px] flex items-center justify-center">
                {isFlipped ? (
                  <HanziAnimator text={card.Hanzi} isVisible={isFlipped} />
                ) : (
                  <p className="text-6xl font-bold text-foreground">{card.Hanzi}</p>
                )}
              </div>
              
              <p className="text-3xl text-[#007AFF] mb-4 font-medium tracking-wide">{card.Pinyin}</p>
              <div className="w-12 h-[2px] bg-default-200 rounded-full my-4"></div>
              <p className="text-xl text-default-600 font-medium text-center">{card.Meaning}</p>
              
              <div className="flex gap-4 mt-8 pt-4 border-t border-default-200 dark:border-default-50/10 w-full justify-center">
                <div className="text-center">
                  <p className="text-[10px] text-default-400 uppercase tracking-wider mb-1 font-semibold">Thanh mẫu</p>
                  <p className="font-medium text-lg text-foreground">{pinyin(card.Hanzi, { pattern: 'initial' }) || '-'}</p>
                </div>
                <div className="w-[1px] bg-default-200 dark:bg-default-50/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-default-400 uppercase tracking-wider mb-1 font-semibold">Vận mẫu</p>
                  <p className="font-medium text-lg text-foreground">{pinyin(card.Hanzi, { pattern: 'final' }) || '-'}</p>
                </div>
                <div className="w-[1px] bg-default-200 dark:bg-default-50/10"></div>
                <div className="text-center">
                  <p className="text-[10px] text-default-400 uppercase tracking-wider mb-1 font-semibold">Thanh</p>
                  <p className="font-medium text-lg text-foreground">{pinyin(card.Hanzi, { pattern: 'num' }) || '-'}</p>
                </div>
              </div>

              {/* Luyện Phát Âm (Speech Recognition) */}
              <div className="mt-4 w-full flex flex-col items-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startListening(card.Hanzi);
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isListening ? "bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20"
                  }`}
                  title="Kiểm tra phát âm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </button>
                {speechResult.text && (
                  <div className={`mt-2 text-sm font-medium px-3 py-1 rounded-full ${speechResult.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {speechResult.isCorrect ? "✅ " : "❌ "}{speechResult.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={`mt-10 flex gap-4 px-2 justify-center transition-all duration-500 ${isFlipped ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <button 
            disabled={updating}
            className="flex-1 bg-[#FF3B30] hover:bg-[#FF3B30]/90 text-white py-4 rounded-2xl font-semibold tracking-wide transition-transform active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
            onClick={() => handleReview("again")}
          >
            <span>Quên (Lại)</span>
            <span className="text-xs opacity-70 font-normal">&lt; 1 ngày</span>
          </button>
          <button 
            disabled={updating}
            className="flex-1 bg-[#FF9500] hover:bg-[#FF9500]/90 text-white py-4 rounded-2xl font-semibold tracking-wide transition-transform active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
            onClick={() => handleReview("hard")}
          >
            <span>Khó</span>
            <span className="text-xs opacity-70 font-normal">
              {Number(card.Interval_Days) === 0 ? "1 ngày" : `${Math.max(1, Math.floor(Number(card.Interval_Days) * 0.5))} ngày`}
            </span>
          </button>
          <button 
            disabled={updating}
            className="flex-1 bg-[#34C759] hover:bg-[#34C759]/90 text-white py-4 rounded-2xl font-semibold tracking-wide transition-transform active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
            onClick={() => handleReview("easy")}
          >
            <span>Dễ</span>
            <span className="text-xs opacity-70 font-normal">
              {Number(card.Interval_Days) === 0 ? "3 ngày" : 
               Number(card.Interval_Days) === 1 ? "3 ngày" : 
               Number(card.Interval_Days) === 3 ? "7 ngày" : 
               Number(card.Interval_Days) === 7 ? "14 ngày" :
               Number(card.Interval_Days) === 14 ? "1 tháng" :
               `${Math.floor(Number(card.Interval_Days) * 1.5)} ngày`}
            </span>
          </button>
        </div>
      </div>
      
    </div>
  );

  function renderAddModal() {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-appearance-in">
        <div className="flex justify-between items-center p-4 border-b border-default-200 dark:border-default-50/10">
          <button onClick={() => setShowAddModal(false)} className="text-[#007AFF] text-[17px]">Hủy</button>
          <h2 className="text-[17px] font-semibold">Thêm Từ Mới</h2>
          <button onClick={handleAddVocab} disabled={adding || !newVocab.Hanzi} className="text-[#007AFF] text-[17px] font-semibold disabled:opacity-50">
            {adding ? "..." : "Lưu"}
          </button>
        </div>
        <div className="p-4 flex-1 bg-default-50/50">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-default-200 dark:border-default-50/10 shadow-sm">
            <div className="flex border-b border-default-200 dark:border-default-50/10">
              <input 
                value={newVocab.Meaning} onChange={e => setNewVocab({...newVocab, Meaning: e.target.value})} 
                placeholder="Ý nghĩa (Tiếng Việt)" 
                className="w-full p-4 bg-transparent focus:outline-none text-[17px]" 
              />
              <button 
                onClick={handleAutoTranslate} 
                disabled={translating || !newVocab.Meaning}
                className="px-4 text-[#007AFF] flex items-center gap-1 font-medium bg-default-100/50 border-l border-default-200 dark:border-default-50/10 disabled:opacity-50"
              >
                {translating ? <Spinner size="sm" /> : <Sparkles size={16} />}
                Dịch
              </button>
            </div>
            <input 
              value={newVocab.Hanzi} onChange={e => setNewVocab({...newVocab, Hanzi: e.target.value})} 
              placeholder="Chữ Hán" 
              className="w-full p-4 border-b border-default-200 dark:border-default-50/10 bg-transparent focus:outline-none text-[17px]" 
            />
            <input 
              value={newVocab.Pinyin} onChange={e => setNewVocab({...newVocab, Pinyin: e.target.value})} 
              placeholder="Pinyin" 
              className="w-full p-4 border-b border-default-200 dark:border-default-50/10 bg-transparent focus:outline-none text-[17px]" 
            />
            <div className="flex justify-between items-center w-full p-4 bg-transparent border-t-0">
              <span className="text-[17px] text-default-500 mr-4 whitespace-nowrap">Cấp độ</span>
              <div className="relative">
                <select 
                  value={newVocab.Level} 
                  onChange={e => setNewVocab({...newVocab, Level: e.target.value})}
                  className="bg-default-100 dark:bg-default-50/10 text-[15px] font-medium px-3 py-1.5 rounded-lg focus:outline-none appearance-none pr-8 cursor-pointer text-foreground"
                >
                  <option value="HSK 1">HSK 1</option>
                  <option value="HSK 2">HSK 2</option>
                  <option value="HSK 3">HSK 3</option>
                  <option value="HSK 4">HSK 4</option>
                  <option value="HSK 5">HSK 5</option>
                  <option value="HSK 6">HSK 6</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-default-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

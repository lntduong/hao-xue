"use client";

import { useEffect, useState } from "react";
import { fetchSheetData, addSheetRow, translateText, translateBatchText, Dialogue } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { playAudio } from "@/lib/audio";
import { Volume2, Plus, Sparkles, Search, X } from "lucide-react";
import { pinyin, html, match } from "pinyin-pro";

export default function DialoguesPage() {
  const [data, setData] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [newDialog, setNewDialog] = useState({ Topic: "", Speaker: "A", Hanzi: "", Pinyin: "", Meaning: "" });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Segment state
  const [segmentData, setSegmentData] = useState<Dialogue | null>(null);
  const [segmentedWords, setSegmentedWords] = useState<{ word: string, pinyin: string, meaning: string }[]>([]);
  const [isSegmenting, setIsSegmenting] = useState(false);

  // Speech Recognition state
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [speechResult, setSpeechResult] = useState<{id: string, text: string, isCorrect: boolean | null} | null>(null);

  const startListening = (targetWord: string, id: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ chức năng này. Hãy thử dùng Google Chrome nhé!");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setActiveSpeechId(id);
      setSpeechResult(null);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const cleanTranscript = transcript.replace(/[.,!?。，！？]/g, '').trim();
      const cleanTarget = targetWord.replace(/[.,!?。，！？]/g, '').trim();
      
      setSpeechResult({
        id,
        text: cleanTranscript,
        isCorrect: cleanTranscript === cleanTarget
      });
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setActiveSpeechId(null);
    };
    
    recognition.onend = () => {
      setActiveSpeechId(null);
    };
    
    recognition.start();
  };

  const loadData = async () => {
    setLoading(true);
    const result = await fetchSheetData<Dialogue>("Dialogues");
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = data.filter(dlg => {
    if (!searchQuery) return true;
    if (dlg.Hanzi.includes(searchQuery) || dlg.Meaning.toLowerCase().includes(searchQuery.toLowerCase()) || dlg.Topic.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    const matched = match(dlg.Hanzi, searchQuery);
    return matched !== null && matched.length > 0;
  });

  // Group by Topic
  const topics = Array.from(new Set(filteredData.map((d) => d.Topic)));
  
  const handleAdd = async () => {
    if (!newDialog.Topic || !newDialog.Hanzi) return;
    setAdding(true);
    const success = await addSheetRow("Dialogues", newDialog);
    if (success) {
      setShowAddModal(false);
      setNewDialog({ Topic: "", Speaker: "A", Hanzi: "", Pinyin: "", Meaning: "" });
      await loadData();
    } else {
      alert("Lỗi khi thêm hội thoại.");
    }
    setAdding(false);
  };

  const handleAutoTranslate = async () => {
    if (!newDialog.Meaning) return;
    setTranslating(true);
    try {
      const result = await translateText(newDialog.Meaning);
      if (result && result.zhCN) {
        const generatedPinyin = pinyin(result.zhCN);
        setNewDialog({
          ...newDialog,
          Hanzi: result.zhCN,
          Pinyin: generatedPinyin
        });
      }
    } catch (error: any) {
      alert("Lỗi dịch thuật: " + error.message);
    }
    setTranslating(false);
  };

  const handleSegment = async (dlg: Dialogue) => {
    setSegmentData(dlg);
    setIsSegmenting(true);
    setSegmentedWords([]);
    
    // Segment using Intl.Segmenter
    const segmenter = new (Intl as any).Segmenter('zh-CN', { granularity: 'word' });
    const segments = Array.from(segmenter.segment(dlg.Hanzi)) as { segment: string, isWordLike: boolean }[];
    const words = segments.filter(s => s.isWordLike).map(s => s.segment);
    
    if (words.length === 0) {
      setIsSegmenting(false);
      return;
    }

    try {
      const meanings = await translateBatchText(words);
      const results = words.map((w, idx) => ({
        word: w,
        pinyin: pinyin(w),
        meaning: meanings[idx] || ""
      }));
      setSegmentedWords(results);
    } catch (e: any) {
      alert("Lỗi khi dịch từ: " + e.message);
    }
    setIsSegmenting(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hội thoại</h1>
      </div>
      
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-default-400" size={18} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo chủ đề, từ vựng..."
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
      
      {loading ? (
        <div className="flex justify-center mt-12"><Spinner /></div>
      ) : data.length === 0 ? (
        <p className="text-center text-default-500 mt-10">Chưa có dữ liệu hội thoại.</p>
      ) : (
        <div className="space-y-6 pb-12">
          {topics.map((topic, index) => {
            const topicDialogues = filteredData.filter((d) => d.Topic === topic);
            
            return (
              <div key={index} className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] dark:shadow-none dark:border dark:border-white/10">
                <div className="flex items-center mb-5 pb-3 border-b border-default-100 dark:border-white/5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 font-semibold">
                    {index + 1}
                  </div>
                  <h2 className="text-lg font-semibold">{topic}</h2>
                </div>
                <div className="space-y-4">
                  {topicDialogues.map((dlg, idx) => {
                    const isSpeakerA = !!dlg.Speaker_A;
                    
                    return (
                      <div key={dlg.ID || idx} className={`flex flex-col ${isSpeakerA ? "items-end" : "items-start"}`}>
                        <div 
                          className={`max-w-[85%] relative group cursor-pointer ${
                            isSpeakerA 
                              ? "bg-[#007AFF] text-white rounded-[20px] rounded-tr-[4px] speaker-a-bubble" 
                              : "bg-[#E9E9EB] dark:bg-[#262628] text-black dark:text-white rounded-[20px] rounded-tl-[4px]"
                          } px-4 py-3 shadow-sm hover:opacity-90 transition-opacity`}
                          onClick={() => handleSegment(dlg)}
                        >
                          
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex flex-col">
                              <div 
                                className={`text-[17px] font-medium leading-[2.2] tracking-wide ${isSpeakerA ? "text-white" : "text-foreground"}`}
                                dangerouslySetInnerHTML={{ __html: html(dlg.Hanzi) }} 
                              />
                            </div>
                            <div className="flex flex-col gap-1.5 shrink-0 mt-0.5">
                              <button 
                                onClick={(e) => { e.stopPropagation(); playAudio(dlg.Hanzi); }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                  isSpeakerA ? "bg-white/20 hover:bg-white/30 text-white" : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-default-600 dark:text-default-300"
                                }`}
                              >
                                <Volume2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); startListening(dlg.Hanzi, String(dlg.ID || idx)); }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                  activeSpeechId === String(dlg.ID || idx)
                                    ? "bg-red-500 text-white animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" 
                                    : isSpeakerA ? "bg-white/20 hover:bg-white/30 text-white" : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-default-600 dark:text-default-300"
                                }`}
                                title="Kiểm tra phát âm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                              </button>
                            </div>
                          </div>
                          
                          {speechResult?.id === String(dlg.ID || idx) && (
                            <div className={`mt-2 text-[13px] font-medium px-2 py-1 rounded-md inline-block ${
                              speechResult.isCorrect 
                                ? (isSpeakerA ? "bg-white/20 text-white" : "bg-green-100 text-green-700")
                                : (isSpeakerA ? "bg-red-500/50 text-white" : "bg-red-100 text-red-700")
                            }`}>
                              {speechResult.isCorrect ? "✅ " : "❌ "}{speechResult.text}
                            </div>
                          )}
                          
                          <p className={`text-[13.5px] mt-2 border-t pt-2 font-medium ${
                            isSpeakerA ? "border-white/20 text-white/90" : "border-default-200 dark:border-default-50/10 text-default-600 dark:text-default-400"
                          }`}>
                            {dlg.Meaning}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {showAddModal && renderAddModal()}
      {segmentData && renderSegmentModal()}
    </div>
  );

  function renderSegmentModal() {
    return (
      <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col justify-end animate-appearance-in" onClick={() => setSegmentData(null)}>
        <div 
          className="bg-background w-full max-h-[80vh] rounded-t-3xl p-6 flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Phân tích câu</h2>
            <button onClick={() => setSegmentData(null)} className="p-2 bg-default-100 rounded-full text-default-500">
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6 p-4 bg-default-50 rounded-2xl border border-default-200 dark:border-default-50/10">
            <p className="text-lg font-medium mb-2">{segmentData?.Hanzi}</p>
            <p className="text-default-600">{segmentData?.Meaning}</p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isSegmenting ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Spinner size="lg" />
                <p className="mt-4 text-default-500 font-medium animate-pulse">Đang dùng AI bóc tách từ vựng...</p>
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {segmentedWords.map((wordObj, idx) => (
                  <div key={idx} className="flex items-center p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-default-100 dark:border-default-50/10">
                    <button 
                      onClick={() => playAudio(wordObj.word)}
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-4 shrink-0"
                    >
                      <Volume2 size={18} />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-end gap-3 mb-1">
                        <p className="text-xl font-bold">{wordObj.word}</p>
                        <p className="text-[#007AFF] font-medium mb-0.5">{wordObj.pinyin}</p>
                      </div>
                      <p className="text-default-600">{wordObj.meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderAddModal() {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-appearance-in">
        <div className="flex justify-between items-center p-4 border-b border-default-200 dark:border-default-50/10">
          <button onClick={() => setShowAddModal(false)} className="text-[#007AFF] text-[17px]">Hủy</button>
          <h2 className="text-[17px] font-semibold">Thêm Hội Thoại</h2>
          <button onClick={handleAdd} disabled={adding || !newDialog.Hanzi || !newDialog.Topic} className="text-[#007AFF] text-[17px] font-semibold disabled:opacity-50">
            {adding ? "..." : "Lưu"}
          </button>
        </div>
        <div className="p-4 flex-1 bg-default-50/50">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-default-200 dark:border-default-50/10 shadow-sm mb-4">
            <input 
              value={newDialog.Topic} onChange={e => setNewDialog({...newDialog, Topic: e.target.value})} 
              placeholder="Chủ đề (VD: Chào hỏi)" 
              className="w-full p-4 bg-transparent focus:outline-none text-[17px]" 
            />
          </div>
          
          <div className="flex bg-default-200 dark:bg-default-50/10 rounded-lg p-1 mb-4">
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${newDialog.Speaker === "A" ? "bg-white dark:bg-[#2C2C2E] shadow-sm" : ""}`}
              onClick={() => setNewDialog({...newDialog, Speaker: "A"})}
            >Người nói A (Bạn)</button>
            <button 
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${newDialog.Speaker === "B" ? "bg-white dark:bg-[#2C2C2E] shadow-sm" : ""}`}
              onClick={() => setNewDialog({...newDialog, Speaker: "B"})}
            >Người nói B (Người lạ)</button>
          </div>

          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-default-200 dark:border-default-50/10 shadow-sm">
            <div className="flex border-b border-default-200 dark:border-default-50/10">
              <input 
                value={newDialog.Meaning} onChange={e => setNewDialog({...newDialog, Meaning: e.target.value})} 
                placeholder="Ý nghĩa (Tiếng Việt)" 
                className="w-full p-4 bg-transparent focus:outline-none text-[17px]" 
              />
              <button 
                onClick={handleAutoTranslate} 
                disabled={translating || !newDialog.Meaning}
                className="px-4 text-[#007AFF] flex items-center gap-1 font-medium bg-default-100/50 border-l border-default-200 dark:border-default-50/10 disabled:opacity-50"
              >
                {translating ? <Spinner size="sm" /> : <Sparkles size={16} />}
                Dịch
              </button>
            </div>
            <input 
              value={newDialog.Hanzi} onChange={e => setNewDialog({...newDialog, Hanzi: e.target.value})} 
              placeholder="Câu nói (Chữ Hán)" 
              className="w-full p-4 border-b border-default-200 dark:border-default-50/10 bg-transparent focus:outline-none text-[17px]" 
            />
            <input 
              value={newDialog.Pinyin} onChange={e => setNewDialog({...newDialog, Pinyin: e.target.value})} 
              placeholder="Pinyin" 
              className="w-full p-4 bg-transparent focus:outline-none text-[17px]" 
            />
          </div>
        </div>
      </div>
    );
  }
}

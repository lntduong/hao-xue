"use client";

import { useState, useEffect } from "react";
import { Search, Sparkles, Volume2, Plus, BookmarkCheck, ArrowLeft } from "lucide-react";
import { fetchSheetData, translateText, addSheetRow, Flashcard } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { HanziAnimator } from "@/components/HanziAnimator";
import { pinyin, match } from "pinyin-pro";
import { playAudio } from "@/lib/audio";
import Link from "next/link";

export default function DictionaryPage() {
  const [query, setQuery] = useState("");
  const [localVocab, setLocalVocab] = useState<Flashcard[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  
  const [translating, setTranslating] = useState(false);
  const [onlineResult, setOnlineResult] = useState<{ Hanzi: string, Pinyin: string, Meaning: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSheetData<Flashcard>("Vocab");
      setLocalVocab(data);
      setLoadingLocal(false);
    };
    loadData();
  }, []);

  const localResults = query ? localVocab.filter(card => {
    if (card.Hanzi.includes(query) || card.Meaning.toLowerCase().includes(query.toLowerCase())) return true;
    const matched = match(card.Hanzi, query);
    return matched !== null && matched.length > 0;
  }) : [];

  const handleOnlineTranslate = async () => {
    if (!query) return;
    setTranslating(true);
    setOnlineResult(null);
    setSaved(false);
    try {
      const result = await translateText(query);
      if (result && result.zhCN) {
        setOnlineResult({
          Hanzi: result.zhCN,
          Pinyin: pinyin(result.zhCN),
          Meaning: query
        });
      }
    } catch (e: any) {
      alert("Lỗi khi tra cứu: " + e.message);
    }
    setTranslating(false);
  };

  const handleSaveToVocab = async () => {
    if (!onlineResult) return;
    setSaving(true);
    const success = await addSheetRow("Vocab", {
      Hanzi: onlineResult.Hanzi,
      Pinyin: onlineResult.Pinyin,
      Meaning: onlineResult.Meaning,
      Level: "HSK 1", // Default level
    });
    if (success) {
      setSaved(true);
      // Cập nhật local vocab
      const data = await fetchSheetData<Flashcard>("Vocab");
      setLocalVocab(data);
    } else {
      alert("Lỗi khi lưu từ vựng.");
    }
    setSaving(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto pt-8 flex flex-col min-h-[calc(100vh-84px)]">
      <div className="flex items-center gap-3 mb-6 px-2">
        <Link href="/" className="w-10 h-10 bg-default-100 hover:bg-default-200 rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Siêu Từ Điển</h1>
      </div>

      <div className="relative mb-6 px-2">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-default-400" size={20} />
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nhập tiếng Việt, Hán hoặc Pinyin..."
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#1C1C1E] border border-default-200 dark:border-default-50/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-lg shadow-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleOnlineTranslate()}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-12">
        {loadingLocal ? (
          <div className="flex justify-center mt-10"><Spinner /></div>
        ) : (
          <>
            {/* Online Translation Section */}
            {query && (
              <div className="mb-8">
                <button 
                  onClick={handleOnlineTranslate}
                  disabled={translating}
                  className="w-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors mb-4"
                >
                  {translating ? <Spinner size="sm" /> : <Sparkles size={20} />}
                  Dịch thông minh từ: "{query}"
                </button>

                {onlineResult && (
                  <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] dark:shadow-none dark:border dark:border-white/10 text-center relative overflow-hidden">
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => playAudio(onlineResult.Hanzi)}
                        className="w-10 h-10 bg-default-100 hover:bg-default-200 rounded-full flex items-center justify-center text-[#007AFF] transition-colors"
                      >
                        <Volume2 size={20} />
                      </button>
                      <button 
                        onClick={handleSaveToVocab}
                        disabled={saving || saved}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          saved ? "bg-green-100 text-green-600" : "bg-primary/10 hover:bg-primary/20 text-primary"
                        }`}
                      >
                        {saving ? <Spinner size="sm" /> : saved ? <BookmarkCheck size={20} /> : <Plus size={20} />}
                      </button>
                    </div>

                    <div className="h-[80px] flex items-center justify-center mt-6 mb-4">
                      <HanziAnimator text={onlineResult.Hanzi} isVisible={true} />
                    </div>
                    
                    <p className="text-3xl text-[#007AFF] font-medium mb-3 tracking-wide">{onlineResult.Pinyin}</p>
                    <p className="text-xl text-default-600 font-medium">{onlineResult.Meaning}</p>
                  </div>
                )}
              </div>
            )}

            {/* Local Results */}
            {localResults.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-default-400 uppercase tracking-wider mb-4 pl-1">Kết quả trong sổ tay ({localResults.length})</h3>
                <div className="space-y-3">
                  {localResults.map(card => (
                    <div key={card.ID} className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-default-200 dark:border-default-50/10 flex justify-between items-center">
                      <div>
                        <p className="text-2xl font-bold mb-1 text-foreground">{card.Hanzi}</p>
                        <p className="text-sm text-[#007AFF] font-medium">{card.Pinyin}</p>
                        <p className="text-sm text-default-500 mt-1">{card.Meaning}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-default-100 text-default-500 rounded text-xs font-semibold self-start mt-1">
                          {card.Level}
                        </span>
                        <button 
                          className="w-10 h-10 bg-default-100 hover:bg-default-200 rounded-full flex items-center justify-center text-[#007AFF] transition-colors flex-shrink-0"
                          onClick={() => playAudio(card.Hanzi)}
                        >
                          <Volume2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {query && localResults.length === 0 && !onlineResult && !translating && (
              <p className="text-center text-default-500 mt-10">Không tìm thấy "{query}" trong sổ tay của bạn. Hãy thử dùng Dịch thông minh ở trên.</p>
            )}

            {!query && (
              <div className="flex flex-col items-center justify-center py-20 text-default-400">
                <Search size={48} className="mb-4 opacity-20" />
                <p>Nhập từ khoá để bắt đầu tra cứu</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

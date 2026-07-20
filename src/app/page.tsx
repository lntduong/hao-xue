"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, MessageSquare, BookOpen, ChevronRight, Flame, Target, CalendarDays, Gamepad2, BrainCircuit, UploadCloud, Search } from "lucide-react";
import { fetchSheetData, Flashcard } from "@/lib/api";
import { Spinner } from "@heroui/react";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  
  // Stats
  const [vocabCount, setVocabCount] = useState(0);
  const [dialogueCount, setDialogueCount] = useState(0);
  const [grammarCount, setGrammarCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  
  const [hskData, setHskData] = useState<{ level: string, count: number, color: string }[]>([]);

  useEffect(() => {
    // 1. Calculate Streak
    const today = new Date().toISOString().split('T')[0];
    const lastActive = localStorage.getItem("last_active_date");
    let currentStreak = parseInt(localStorage.getItem("current_streak") || "0", 10);
    
    if (lastActive) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        // Logged in consecutive day
        currentStreak++;
      } else if (diffDays > 1) {
        // Streak broken
        currentStreak = 1;
      }
      // If diffDays === 0, logged in today already, streak remains the same
    } else {
      // First time
      currentStreak = 1;
    }
    
    localStorage.setItem("last_active_date", today);
    localStorage.setItem("current_streak", currentStreak.toString());
    setStreak(currentStreak);

    // 2. Load Stats from Google Sheet
    async function loadStats() {
      try {
        const [vocabResult, dialoguesResult, grammarResult] = await Promise.all([
          fetchSheetData<Flashcard>("Vocab"),
          fetchSheetData<any>("Dialogues"),
          fetchSheetData<any>("Grammar")
        ]);

        const validVocabs = vocabResult.filter(c => c.Hanzi && c.Meaning);
        setVocabCount(validVocabs.length);
        setDialogueCount(dialoguesResult.length);
        setGrammarCount(grammarResult.length);

        // Calculate due count
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        
        const due = validVocabs.filter(card => {
          if (!card.Next_Review_Date) return true;
          const reviewDate = new Date(card.Next_Review_Date);
          return reviewDate <= todayDate;
        });
        setDueCount(due.length);

        // HSK Statistics
        const hskCounts: Record<string, number> = {
          "HSK 1": 0, "HSK 2": 0, "HSK 3": 0, "HSK 4": 0, "HSK 5": 0, "HSK 6": 0, "Khác": 0
        };
        
        validVocabs.forEach(card => {
          const level = card.Level && card.Level.trim();
          if (level && hskCounts[level] !== undefined) {
            hskCounts[level]++;
          } else {
            hskCounts["Khác"]++;
          }
        });

        const colors = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6", "#8E8E93"];
        const hskArray = Object.keys(hskCounts).map((key, index) => ({
          level: key,
          count: hskCounts[key],
          color: colors[index]
        })).filter(item => item.count > 0);

        setHskData(hskArray);
      } catch (e) {
        console.error("Failed to load stats", e);
      }
      setLoading(false);
    }
    
    loadStats();
  }, []);

  const modules = [
    { title: "Từ vựng", icon: <Layers size={22} className="text-[#007AFF]" />, href: "/vocab", count: vocabCount },
    { title: "Hội thoại", icon: <MessageSquare size={22} className="text-[#34C759]" />, href: "/dialogues", count: dialogueCount },
    { title: "Ngữ pháp", icon: <BookOpen size={22} className="text-[#FF9500]" />, href: "/grammar", count: grammarCount },
    { title: "Trò chơi", icon: <Gamepad2 size={22} className="text-[#AF52DE]" />, href: "/games", count: null },
  ];

  if (loading) {
    return <div className="flex justify-center mt-32"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto pt-10">
      {/* Header & Streak */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Chào mừng!</h1>
          <p className="text-default-500 mt-1 text-lg">Bạn đang làm rất tốt.</p>
        </div>
        <div className="flex flex-col items-center justify-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-200 dark:border-orange-500/20">
          <Flame size={28} className="text-orange-500 fill-orange-500" />
          <span className="text-orange-600 dark:text-orange-400 font-bold text-sm mt-1">{streak} Ngày</span>
        </div>
      </div>

      {/* Dictionary Quick Search */}
      <Link href="/dictionary" className="block">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-default-400" size={20} />
          <div className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#1C1C1E] border border-default-200 dark:border-default-50/10 rounded-2xl flex items-center text-default-400 shadow-sm transition-all active:scale-95">
            <span className="text-base font-medium">Tra cứu siêu từ điển...</span>
          </div>
        </div>
      </Link>

      {/* Action required card */}
      <Link href="/vocab" className="block">
        <div className="bg-gradient-to-r from-[#007AFF] to-[#5856D6] p-6 rounded-3xl text-white shadow-lg relative overflow-hidden transition-transform active:scale-95">
          <div className="relative z-10 flex flex-col items-start">
            <div className="bg-white/20 p-2 rounded-xl mb-4 backdrop-blur-md">
              <BrainCircuit size={24} className="text-white" />
            </div>
            {dueCount > 0 ? (
              <>
                <h2 className="text-4xl font-bold mb-1">{dueCount}</h2>
                <p className="text-white/80 font-medium">từ vựng cần ôn tập hôm nay</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1">Tuyệt vời!</h2>
                <p className="text-white/80 font-medium">Bạn đã ôn hết từ vựng hôm nay.</p>
              </>
            )}
            
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10">
            <BrainCircuit size={160} />
          </div>
        </div>
      </Link>

      {/* HSK Progress */}
      {vocabCount > 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl shadow-sm border border-default-200 dark:border-default-50/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Target size={20} className="text-default-500" />
              Tiến độ Từ vựng
            </h3>
            <span className="text-sm font-medium text-default-500">{vocabCount} từ</span>
          </div>
          
          <div className="w-full h-3 bg-default-100 dark:bg-default-50/10 rounded-full flex overflow-hidden mb-4">
            {hskData.map((item, index) => (
              <div 
                key={item.level} 
                style={{ width: `${(item.count / vocabCount) * 100}%`, backgroundColor: item.color }}
                className="h-full transition-all duration-500"
                title={`${item.level}: ${item.count} từ`}
              />
            ))}
          </div>
          
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
            {hskData.map(item => (
              <div key={item.level} className="flex items-center gap-1.5 text-xs font-medium text-default-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.level} ({item.count})
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Batch Import Button */}
      <Link href="/import" className="block w-full">
        <div className="w-full bg-white dark:bg-[#1C1C1E] shadow-sm border border-default-200 dark:border-default-50/10 hover:bg-default-50 dark:hover:bg-[#2C2C2E] text-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
          <UploadCloud size={20} className="text-[#007AFF]" />
          Nhập liệu hàng loạt (CSV)
        </div>
      </Link>

      {/* Quick Links */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg px-2 pt-2">Phân hệ học tập</h3>
        <div className="grid grid-cols-2 gap-3">
          {modules.map((mod) => (
            <Link key={mod.href} href={mod.href} className="block h-full">
              <div className="bg-white dark:bg-[#1C1C1E] p-4 rounded-2xl shadow-sm border border-default-200 dark:border-default-50/10 flex flex-col items-start gap-3 active:bg-default-50 transition-colors h-full">
                <div className="bg-default-50 dark:bg-default-50/5 p-2 rounded-xl">
                  {mod.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{mod.title}</h4>
                  {mod.count !== null && (
                    <p className="text-xs font-medium text-default-400 mt-0.5">{mod.count} mục</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

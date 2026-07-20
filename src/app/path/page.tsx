"use client";

import { useEffect, useState } from "react";
import { fetchSheetData, Flashcard } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { ArrowLeft, Map as MapIcon, Lock, CheckCircle2, Star, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PathPage() {
  const [vocab, setVocab] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSheetData<Flashcard>("Vocab");
      const validData = data.filter(c => c.Hanzi && c.Meaning);
      setVocab(validData);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center mt-32"><Spinner size="lg" /></div>;
  }

  // Chunk vocab into nodes of 10
  const CHUNK_SIZE = 10;
  const nodes = [];
  for (let i = 0; i < vocab.length; i += CHUNK_SIZE) {
    nodes.push(vocab.slice(i, i + CHUNK_SIZE));
  }

  // Determine node states
  // A node is completed if ALL its cards have been learned (Next_Review_Date exists)
  // The first uncompleted node is the "active" node.
  let activeFound = false;

  const nodeStates = nodes.map((chunk, index) => {
    const isCompleted = chunk.every(c => !!c.Next_Review_Date);
    
    let state = "locked";
    if (isCompleted) {
      state = "completed";
    } else if (!activeFound) {
      state = "active";
      activeFound = true;
    }

    // Special case: if all are completed, we just let them replay
    return { chunk, state, index };
  });

  return (
    <div className="p-4 max-w-md mx-auto pt-8 flex flex-col min-h-[calc(100vh-84px)] bg-[#F9FAFB] dark:bg-[#121212]">
      <div className="flex items-center gap-3 mb-8 px-2 relative z-20">
        <Link href="/" className="w-10 h-10 bg-white dark:bg-[#1C1C1E] shadow-sm rounded-full flex items-center justify-center transition-colors border border-default-100 dark:border-default-50/10">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MapIcon className="text-[#007AFF]" /> Lộ trình học
        </h1>
      </div>

      <div className="flex-1 relative flex flex-col items-center pb-32 pt-10">
        
        {nodes.length === 0 ? (
          <div className="z-10 mt-10 text-default-500 text-center bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl shadow-sm border border-default-100 dark:border-default-50/10">
            Bạn chưa có từ vựng nào trong kho. Hãy thêm từ vựng để bắt đầu cuộc hành trình!
          </div>
        ) : (
          <div className="w-full relative flex flex-col items-center z-10 gap-20">
            {/* The Background Line (Locked) */}
            <div className="absolute top-0 bottom-0 w-4 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full z-0" />
            
            {/* The Active Line (Completed) - Calculate height based on active node */}
            <div 
              className="absolute top-0 w-4 bg-gradient-to-b from-[#FFCC00] to-[#FF9500] rounded-full z-0 transition-all duration-700" 
              style={{ 
                height: activeFound 
                  ? `${(nodeStates.findIndex(n => n.state === 'active') / Math.max(1, nodeStates.length - 1)) * 100}%` 
                  : '100%' 
              }} 
            />

            {nodeStates.map((node) => {
              const visualIndex = node.index;
              const isEven = visualIndex % 2 === 0;
              
              const isCompleted = node.state === "completed";
              const isActive = node.state === "active";
              const isLocked = node.state === "locked";
              
              return (
                <div 
                  key={node.index}
                  className="relative flex justify-center items-center w-full"
                >
                  {/* Floating tooltip for active node */}
                  {isActive && (
                    <div className="absolute -top-16 bg-white dark:bg-[#1C1C1E] px-4 py-2.5 rounded-2xl shadow-lg border-2 border-[#007AFF] font-bold text-[#007AFF] animate-bounce whitespace-nowrap z-20">
                      Bắt đầu Trạm {node.index + 1}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#1C1C1E] rotate-45 border-b-2 border-r-2 border-[#007AFF]"></div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!isLocked) {
                        router.push(`/vocab?node=${node.index}`);
                      }
                    }}
                    disabled={isLocked}
                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg relative transition-all z-10 ${
                      isActive ? 'hover:scale-105 active:scale-95 ring-4 ring-[#007AFF]/30 ring-offset-2 ring-offset-[#F9FAFB] dark:ring-offset-[#121212]' : isCompleted ? 'hover:scale-105 active:scale-95' : ''
                    } ${
                      isCompleted 
                        ? "bg-[#FFCC00] border-4 border-[#FF9500] text-white shadow-[inset_0_-4px_0_rgba(220,130,0,0.5)]" 
                        : isActive
                          ? "bg-[#007AFF] border-4 border-[#0056B3] text-white shadow-[inset_0_-4px_0_rgba(0,60,150,0.5),0_8px_20px_rgba(0,122,255,0.4)]"
                          : "bg-[#F4F4F5] dark:bg-[#2C2C2E] border-4 border-[#D1D1D6] dark:border-[#3A3A3C] text-default-400 cursor-not-allowed shadow-[inset_0_-4px_0_rgba(0,0,0,0.05)]"
                    }`}
                  >
                    {isCompleted ? (
                      <Star size={36} className="fill-white drop-shadow-md" />
                    ) : isActive ? (
                      <Trophy size={40} className="fill-white/30 drop-shadow-md" />
                    ) : (
                      <Lock size={32} className="opacity-40" />
                    )}
                  </button>
                  
                  {/* Progress info - Alternating sides */}
                  <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col w-32 ${isEven ? 'right-[calc(50%+60px)] items-end text-right' : 'left-[calc(50%+60px)] items-start text-left'}`}>
                    <span className={`font-extrabold text-xl ${isActive ? 'text-[#007AFF]' : isCompleted ? 'text-[#FF9500]' : 'text-default-400'}`}>
                      Trạm {node.index + 1}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm mt-1.5 border ${
                      isCompleted ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50' : 
                      isActive ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50' : 
                      'bg-white text-default-500 border-default-200 dark:bg-[#1C1C1E] dark:border-default-50/10'
                    }`}>
                      {node.chunk.length} từ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="p-4 max-w-md mx-auto pt-8 flex flex-col min-h-[calc(100vh-84px)] bg-[#F4F4F5] dark:bg-[#121212]">
      <div className="flex items-center gap-3 mb-8 px-2">
        <Link href="/" className="w-10 h-10 bg-white dark:bg-[#1C1C1E] shadow-sm rounded-full flex items-center justify-center transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MapIcon className="text-[#007AFF]" /> Lộ trình học
        </h1>
      </div>

      <div className="flex-1 relative flex flex-col items-center pb-20">
        {/* The Path Line */}
        <div className="absolute top-0 bottom-0 w-3 bg-[#E5E5EA] dark:bg-[#2C2C2E] rounded-full z-0" />
        
        {nodes.length === 0 ? (
          <div className="z-10 mt-10 text-default-500 text-center bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl shadow-sm">
            Bạn chưa có từ vựng nào trong kho. Hãy thêm từ vựng để bắt đầu cuộc hành trình!
          </div>
        ) : (
          <div className="w-full flex flex-col-reverse items-center z-10 gap-12 mt-6">
            {nodeStates.map((node) => {
              // Calculate snake curve
              // We reverse index for visual, so node 0 is at bottom
              const visualIndex = node.index;
              const isEven = visualIndex % 2 === 0;
              const xOffset = isEven ? -60 : 60; // 60px left or right
              
              const isCompleted = node.state === "completed";
              const isActive = node.state === "active";
              const isLocked = node.state === "locked";
              
              return (
                <div 
                  key={node.index}
                  className="relative flex justify-center items-center w-full transition-transform duration-500"
                  style={{ transform: `translateX(${xOffset}px)` }}
                >
                  {/* Floating tooltip for active node */}
                  {isActive && (
                    <div className="absolute -top-12 bg-white dark:bg-[#1C1C1E] px-4 py-2 rounded-xl shadow-md border border-default-200 dark:border-default-50/10 font-bold text-[#007AFF] animate-bounce whitespace-nowrap">
                      Bắt đầu Trạm {node.index + 1}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-[#1C1C1E] rotate-45 border-b border-r border-default-200 dark:border-default-50/10"></div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!isLocked) {
                        router.push(`/vocab?node=${node.index}`);
                      }
                    }}
                    disabled={isLocked}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg relative border-4 transition-transform ${isActive ? 'hover:scale-105 active:scale-95' : isCompleted ? 'hover:scale-105 active:scale-95' : ''} ${
                      isCompleted 
                        ? "bg-[#FFD60A] border-[#FF9F0A] text-white" 
                        : isActive
                          ? "bg-[#007AFF] border-[#0056B3] text-white shadow-[0_0_20px_rgba(0,122,255,0.4)]"
                          : "bg-[#E5E5EA] dark:bg-[#2C2C2E] border-[#D1D1D6] dark:border-[#3A3A3C] text-default-400 cursor-not-allowed"
                    }`}
                  >
                    {isCompleted ? (
                      <Star size={32} className="fill-white" />
                    ) : isActive ? (
                      <Trophy size={32} className="fill-white/20" />
                    ) : (
                      <Lock size={28} />
                    )}
                  </button>
                  
                  {/* Progress info */}
                  <div className={`absolute top-1/2 -translate-y-1/2 ${isEven ? 'left-[90px]' : 'right-[90px]'} flex flex-col ${isEven ? 'items-start' : 'items-end'}`}>
                    <span className={`font-bold text-lg ${isActive ? 'text-[#007AFF]' : isCompleted ? 'text-[#FF9F0A]' : 'text-default-400'}`}>
                      Trạm {node.index + 1}
                    </span>
                    <span className="text-xs text-default-500 font-medium bg-white dark:bg-[#1C1C1E] px-2 py-0.5 rounded-full shadow-sm">
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

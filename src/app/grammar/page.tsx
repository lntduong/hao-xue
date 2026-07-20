"use client";

import { useEffect, useState } from "react";
import { fetchSheetData, addSheetRow, Grammar } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { Plus } from "lucide-react";

export default function GrammarPage() {
  const [data, setData] = useState<Grammar[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newGrammar, setNewGrammar] = useState({ Title: "", Structure: "", Explanation: "", Examples: "" });

  useEffect(() => {
    async function loadData() {
      const result = await fetchSheetData<Grammar>("Grammar");
      setData(result);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAdd = async () => {
    if (!newGrammar.Title || !newGrammar.Structure) return;
    setAdding(true);
    const success = await addSheetRow("Grammar", newGrammar);
    if (success) {
      setShowAddModal(false);
      setNewGrammar({ Title: "", Structure: "", Explanation: "", Examples: "" });
    } else {
      alert("Lỗi khi thêm ngữ pháp.");
    }
    setAdding(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ngữ pháp</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center mt-12"><Spinner /></div>
      ) : data.length === 0 ? (
        <p className="text-center text-default-500 mt-10">Chưa có dữ liệu ngữ pháp.</p>
      ) : (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-default-200 dark:border-default-50/10 overflow-hidden">
          {data.map((item, index) => (
            <details 
              key={item.ID || index} 
              className="group bg-transparent"
            >
              <summary className="p-4 cursor-pointer flex flex-col focus:outline-none list-none active:bg-default-100 transition-colors">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[17px] font-semibold tracking-tight text-foreground">{item.Title}</span>
                  <span className="text-default-300 group-open:rotate-90 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
                <span className="text-[14px] text-[#007AFF] font-medium mt-1">{item.Structure}</span>
              </summary>
              <div className="p-4 pt-2 pb-5 space-y-4 bg-default-50/50 dark:bg-black/20 border-t border-default-200 dark:border-default-50/10">
                <div>
                  <h4 className="text-[13px] uppercase tracking-wider font-semibold text-default-500 mb-2">Giải thích</h4>
                  <p className="text-[15px] leading-relaxed text-foreground/90">{item.Explanation}</p>
                </div>
                {item.Examples && (
                  <div>
                    <h4 className="text-[13px] uppercase tracking-wider font-semibold text-default-500 mb-2">Ví dụ</h4>
                    <div className="bg-white dark:bg-[#2C2C2E] p-3 rounded-xl border border-default-100 dark:border-white/5 shadow-sm">
                      <p className="text-[15px] leading-relaxed whitespace-pre-line text-foreground">{item.Examples}</p>
                    </div>
                  </div>
                )}
              </div>
              {index < data.length - 1 && (
                <div className="h-px bg-default-200 dark:bg-default-50/10 ml-4 group-open:hidden" />
              )}
            </details>
          ))}
        </div>
      )}
      
      {showAddModal && renderAddModal()}
    </div>
  );

  function renderAddModal() {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-appearance-in">
        <div className="flex justify-between items-center p-4 border-b border-default-200 dark:border-default-50/10">
          <button onClick={() => setShowAddModal(false)} className="text-[#007AFF] text-[17px]">Hủy</button>
          <h2 className="text-[17px] font-semibold">Thêm Ngữ Pháp</h2>
          <button onClick={handleAdd} disabled={adding || !newGrammar.Title || !newGrammar.Structure} className="text-[#007AFF] text-[17px] font-semibold disabled:opacity-50">
            {adding ? "..." : "Lưu"}
          </button>
        </div>
        <div className="p-4 flex-1 bg-default-50/50">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-default-200 dark:border-default-50/10 shadow-sm">
            <input 
              value={newGrammar.Title} onChange={e => setNewGrammar({...newGrammar, Title: e.target.value})} 
              placeholder="Tiêu đề (VD: Trợ từ 的)" 
              className="w-full p-4 border-b border-default-200 dark:border-default-50/10 bg-transparent focus:outline-none text-[17px]" 
            />
            <input 
              value={newGrammar.Structure} onChange={e => setNewGrammar({...newGrammar, Structure: e.target.value})} 
              placeholder="Cấu trúc" 
              className="w-full p-4 border-b border-default-200 dark:border-default-50/10 bg-transparent focus:outline-none text-[17px]" 
            />
            <textarea 
              value={newGrammar.Explanation} onChange={e => setNewGrammar({...newGrammar, Explanation: e.target.value})} 
              placeholder="Giải thích chi tiết" 
              className="w-full p-4 border-b border-default-200 dark:border-default-50/10 bg-transparent focus:outline-none text-[17px] min-h-[100px] resize-none" 
            />
            <textarea 
              value={newGrammar.Examples} onChange={e => setNewGrammar({...newGrammar, Examples: e.target.value})} 
              placeholder="Ví dụ (có thể xuống dòng)" 
              className="w-full p-4 bg-transparent focus:outline-none text-[17px] min-h-[100px] resize-none" 
            />
          </div>
        </div>
      </div>
    );
  }
}

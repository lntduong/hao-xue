"use client";

import { useState } from "react";
import { addBatchRows } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { ArrowLeft, UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { pinyin } from "pinyin-pro";

type ImportType = "Vocab" | "Dialogues";

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>("Vocab");
  const [csvText, setCsvText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setIsImporting(true);
    setResult(null);
    
    try {
      const lines = csvText.trim().split("\n");
      const rows = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Split by comma, but ignore commas inside double quotes. Then remove quotes.
        const parts = line
          .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(p => p.trim().replace(/^"|"$/g, ''));
        
        if (importType === "Vocab") {
          // Format: Hanzi, Pinyin, Meaning, Level
          const [Hanzi, PinyinInput, MeaningInput, LevelInput] = parts;
          if (!Hanzi) continue;
          
          rows.push({
            Hanzi,
            Pinyin: PinyinInput || pinyin(Hanzi),
            Meaning: MeaningInput || "",
            Level: LevelInput || "HSK 1",
            Next_Review_Date: "",
            Interval_Days: ""
          });
        } else if (importType === "Dialogues") {
          // Format: Topic, Speaker_A, Speaker_B, Hanzi, Pinyin, Meaning
          const [Topic, Speaker_A, Speaker_B, Hanzi, PinyinInput, Meaning] = parts;
          if (!Hanzi) continue;
          
          rows.push({
            Topic: Topic || "Chung",
            Speaker_A: Speaker_A || "",
            Speaker_B: Speaker_B || "",
            Hanzi,
            Pinyin: PinyinInput || pinyin(Hanzi),
            Meaning: Meaning || ""
          });
        }
      }
      
      if (rows.length === 0) {
        setResult({ success: false, message: "Không tìm thấy dữ liệu hợp lệ để nhập." });
        setIsImporting(false);
        return;
      }

      const res = await addBatchRows(importType, rows);
      if (res.success) {
        setResult({ success: true, message: `Đã nhập thành công ${res.count} dòng vào ${importType}.` });
        setCsvText("");
      }
    } catch (e: any) {
      setResult({ success: false, message: "Lỗi: " + e.message });
    }
    
    setIsImporting(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 bg-default-100 dark:bg-default-50/10 rounded-full text-foreground hover:bg-default-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Nhập liệu hàng loạt</h1>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl shadow-sm border border-default-200 dark:border-default-50/10 mb-6">
        <h2 className="font-semibold mb-3">1. Chọn loại dữ liệu</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setImportType("Vocab")}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${importType === "Vocab" ? "bg-[#007AFF] text-white" : "bg-default-100 text-default-600"}`}
          >
            Từ vựng
          </button>
          <button 
            onClick={() => setImportType("Dialogues")}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${importType === "Dialogues" ? "bg-[#34C759] text-white" : "bg-default-100 text-default-600"}`}
          >
            Hội thoại
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-3xl shadow-sm border border-default-200 dark:border-default-50/10 mb-6">
        <h2 className="font-semibold mb-2">2. Dán dữ liệu (CSV)</h2>
        <div className="mb-4 text-sm text-default-500 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800/20">
          <p className="font-medium text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1"><AlertCircle size={14}/> Định dạng yêu cầu (cách nhau bởi dấu phẩy):</p>
          {importType === "Vocab" ? (
            <code className="block bg-black/5 dark:bg-black/20 p-2 rounded mt-1">Chữ Hán, Pinyin, Nghĩa, HSK Level</code>
          ) : (
            <code className="block bg-black/5 dark:bg-black/20 p-2 rounded mt-1">Chủ đề, Speaker A, Speaker B, Chữ Hán, Pinyin, Nghĩa</code>
          )}
          <p className="mt-2 text-xs italic">* Nếu bỏ trống Pinyin, hệ thống sẽ tự động tạo Pinyin từ Chữ Hán.</p>
        </div>
        
        <textarea 
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Dán dữ liệu của bạn vào đây..."
          className="w-full h-48 p-4 bg-default-50 dark:bg-default-50/5 border border-default-200 dark:border-default-50/10 rounded-xl focus:outline-none focus:border-[#007AFF] resize-none text-[15px]"
        />
        
        {result && (
          <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {result.success ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <AlertCircle size={18} className="mt-0.5 shrink-0" />}
            <span className="font-medium text-sm">{result.message}</span>
          </div>
        )}
      </div>

      <button 
        onClick={handleImport}
        disabled={isImporting || !csvText.trim()}
        className="w-full bg-[#007AFF] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50"
      >
        {isImporting ? <Spinner size="sm" color="current" /> : <UploadCloud size={20} />}
        {isImporting ? "Đang xử lý..." : "Nhập dữ liệu"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1712") {
      // Set cookie that expires in 30 days
      const d = new Date();
      d.setTime(d.getTime() + (30*24*60*60*1000));
      document.cookie = `app_pin=1712;expires=${d.toUTCString()};path=/`;
      router.push("/");
    } else {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-default-50">
      <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-lg border border-default-200 dark:border-default-50/10 text-center animate-appearance-in">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-[#007AFF] rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Bảo mật</h1>
        <p className="text-default-500 mb-8">Vui lòng nhập mã PIN để truy cập ứng dụng của bạn.</p>
        
        <form onSubmit={handleLogin}>
          <div className="mb-6 relative">
            <input 
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Nhập mã PIN..."
              className={`w-full p-4 rounded-xl border-2 text-center text-2xl tracking-[0.5em] font-mono outline-none transition-colors ${
                error ? "border-red-500 bg-red-50" : "border-default-200 focus:border-[#007AFF]"
              }`}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 font-medium">Mã PIN không chính xác!</p>}
          </div>
          
          <button 
            type="submit"
            disabled={pin.length < 4}
            className="w-full bg-[#007AFF] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            Mở khóa
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

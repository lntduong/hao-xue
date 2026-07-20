"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Layers, MessageSquare, BookOpen, Gamepad2 } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Tổng quan", href: "/", icon: Home },
    { name: "Từ vựng", href: "/vocab", icon: Layers },
    { name: "Hội thoại", href: "/dialogues", icon: MessageSquare },
    { name: "Ngữ pháp", href: "/grammar", icon: BookOpen },
    { name: "Trò chơi", href: "/games", icon: Gamepad2 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[84px] pb-5 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-t border-default-200 dark:border-default-50/10 flex items-center justify-around z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 mt-2 transition-colors ${
              isActive ? "text-[#007AFF] dark:text-[#0A84FF]" : "text-default-400 hover:text-default-700"
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

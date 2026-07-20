"use client";

import { useEffect, useRef } from "react";
// @ts-ignore
import HanziWriter from "hanzi-writer";
import { useTheme } from "next-themes";

export default function HanziAnimator({ text, isVisible }: { text: string; isVisible: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!isVisible || !containerRef.current || !text) return;

    // Clear previous renders
    containerRef.current.innerHTML = "";
    
    // Only keep Chinese characters
    const chars = text.match(/[\u4e00-\u9fa5]/g) || [];
    if (chars.length === 0) return;
    
    const strokeColor = resolvedTheme === "dark" ? "#FFFFFF" : "#000000";
    const radicalColor = "#007AFF";

    let delay = 0;
    
    chars.forEach((char) => {
      const charDiv = document.createElement("div");
      charDiv.className = "w-[60px] h-[60px] flex-shrink-0";
      containerRef.current!.appendChild(charDiv);
      
      const writer = HanziWriter.create(charDiv, char, {
        width: 60,
        height: 60,
        padding: 4,
        strokeColor: strokeColor,
        radicalColor: radicalColor,
        showOutline: true,
        outlineColor: resolvedTheme === "dark" ? "#333333" : "#DDDDDD",
        strokeAnimationSpeed: 1.5,
        delayBetweenStrokes: 50,
      });
      
      setTimeout(() => {
        writer.animateCharacter();
      }, delay);
      
      // Delay next character animation
      delay += 1200;
    });
  }, [text, isVisible, resolvedTheme]);

  if (!isVisible) return null;

  return (
    <div className="w-full flex justify-center animate-appearance-in">
      <div 
        ref={containerRef} 
        className="flex flex-wrap justify-center gap-2"
      >
      </div>
    </div>
  );
}

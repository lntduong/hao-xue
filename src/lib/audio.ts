export function playAudio(text: string, lang: string = 'zh-CN') {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.8; // slightly slower for language learning
    utterance.pitch = 1;
    
    // Optional: try to find a natural sounding Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(voice => voice.lang.includes('zh') || voice.lang.includes('cmn'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    console.warn("Text-to-speech is not supported in this browser.");
  }
}

// Function to preload voices
export function initAudio() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}

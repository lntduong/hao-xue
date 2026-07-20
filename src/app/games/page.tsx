"use client";

import { useEffect, useState } from "react";
import { fetchSheetData, Flashcard } from "@/lib/api";
import { Spinner } from "@heroui/react";
import { CheckCircle2, XCircle, Trophy, ArrowRight, Play, RefreshCcw } from "lucide-react";
import { playAudio } from "@/lib/audio";

type Question = {
  id: string | number;
  type: "hanzi_to_meaning" | "meaning_to_hanzi";
  questionText: string;
  correctAnswer: string;
  options: string[];
  originalCard: Flashcard;
};

export default function GamesPage() {
  const [data, setData] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"start" | "playing" | "gameover">("start");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    async function loadData() {
      const result = await fetchSheetData<Flashcard>("Vocab");
      setData(result.filter(c => c.Hanzi && c.Meaning)); // only valid ones
      setLoading(false);
    }
    loadData();
  }, []);

  const generateGame = () => {
    if (data.length < 4) {
      alert("Bạn cần ít nhất 4 từ vựng để chơi minigame!");
      return;
    }

    // Shuffle and pick 10 words (or less if not enough)
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const gameSize = Math.min(10, shuffled.length);
    const selectedCards = shuffled.slice(0, gameSize);
    
    const newQuestions: Question[] = selectedCards.map((card) => {
      const isHanziToMeaning = Math.random() > 0.5;
      
      let correctAnswer = isHanziToMeaning ? card.Meaning : card.Hanzi;
      let questionText = isHanziToMeaning ? card.Hanzi : card.Meaning;
      
      // Get 3 random wrong answers
      const wrongAnswers = data
        .filter(c => c.ID !== card.ID)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map(c => isHanziToMeaning ? c.Meaning : c.Hanzi);
        
      const options = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());
      
      return {
        id: card.ID || Math.random().toString(),
        type: isHanziToMeaning ? "hanzi_to_meaning" : "meaning_to_hanzi",
        questionText,
        correctAnswer,
        options,
        originalCard: card
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setGameState("playing");
  };

  const handleSelect = (option: string) => {
    if (selectedOption || isAnimating) return; // Prevent multiple clicks
    
    setSelectedOption(option);
    setIsAnimating(true);
    
    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.correctAnswer;
    
    if (isCorrect) {
      setScore(s => s + 1);
      // Play audio if question was hanzi
      if (currentQ.type === "hanzi_to_meaning") {
        playAudio(currentQ.questionText);
      } else {
        playAudio(currentQ.correctAnswer);
      }
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedOption(null);
        setIsAnimating(false);
      } else {
        setGameState("gameover");
        setIsAnimating(false);
      }
    }, 1500);
  };

  if (loading) {
    return <div className="flex justify-center mt-20"><Spinner /></div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto pt-8 min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Trò chơi</h1>
      </div>

      {gameState === "start" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-appearance-in">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <Trophy size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Thử thách từ vựng</h2>
          <p className="text-default-500 mb-8 max-w-[250px]">
            Kiểm tra phản xạ từ vựng của bạn với 10 câu hỏi ngẫu nhiên 2 chiều.
          </p>
          <button 
            onClick={generateGame}
            className="w-full bg-[#007AFF] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-md"
          >
            <Play size={20} />
            Bắt đầu chơi
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div className="flex-1 flex flex-col animate-appearance-in">
          <div className="flex justify-between items-center mb-6 px-2 text-sm font-semibold text-default-500">
            <span>Câu {currentIndex + 1}/{questions.length}</span>
            <span className="text-[#007AFF]">Điểm: {score}</span>
          </div>
          
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-8 mb-6 shadow-sm border border-default-100 dark:border-white/10 flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-default-400 text-sm font-medium mb-4 uppercase tracking-wider">
              {questions[currentIndex].type === "hanzi_to_meaning" ? "Nghĩa của từ này là gì?" : "Chọn từ Hán tương ứng"}
            </p>
            <p className={`font-bold text-center text-foreground ${
              questions[currentIndex].type === "hanzi_to_meaning" ? "text-6xl" : "text-3xl"
            }`}>
              {questions[currentIndex].questionText}
            </p>
          </div>
          
          <div className="space-y-3 flex-1">
            {questions[currentIndex].options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectAnswer = option === questions[currentIndex].correctAnswer;
              
              let btnClass = "bg-white dark:bg-[#1C1C1E] border-default-200 dark:border-white/10 text-foreground hover:bg-default-50 dark:hover:bg-[#2C2C2E]";
              
              if (selectedOption) {
                if (isCorrectAnswer) {
                  btnClass = "bg-green-500 border-green-500 text-white"; // Correct answer is always highlighted
                } else if (isSelected) {
                  btnClass = "bg-red-500 border-red-500 text-white"; // Wrong choice
                } else {
                  btnClass = "opacity-50 border-default-200 dark:border-white/10"; // Dim others
                }
              }

              return (
                <button
                  key={idx}
                  disabled={!!selectedOption}
                  onClick={() => handleSelect(option)}
                  className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all font-medium text-lg ${btnClass}`}
                >
                  <span className={`${questions[currentIndex].type === "meaning_to_hanzi" ? "text-2xl" : ""}`}>
                    {option}
                  </span>
                  
                  {selectedOption && isCorrectAnswer && <CheckCircle2 size={24} className="text-white" />}
                  {selectedOption && isSelected && !isCorrectAnswer && <XCircle size={24} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-appearance-in">
          <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
            <Trophy size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Hoàn thành!</h2>
          <p className="text-default-500 mb-8">
            Bạn đã trả lời đúng {score} trên {questions.length} câu hỏi.
          </p>
          <div className="w-full space-y-3">
            <button 
              onClick={generateGame}
              className="w-full bg-[#007AFF] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-md"
            >
              <RefreshCcw size={20} />
              Chơi lại
            </button>
            <button 
              onClick={() => setGameState("start")}
              className="w-full bg-default-100 text-default-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-default-200 transition-colors"
            >
              Về màn hình chính
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

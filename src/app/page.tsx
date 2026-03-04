"use client";
import { useState, useEffect, useRef, useMemo } from "react";

// --- Custom Hook for Speech Recognition ---
function useSpeechRecognition(onResult: (text: string) => void) {
  const recognitionRef = useRef<any>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript + " ";
        }
      }

      if (finalTranscript) {
        onResult(cleanText(finalTranscript));
      } else {
        onResult(cleanText(interimTranscript));
      }
    };

    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, [onResult]);

  const start = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stop = () => recognitionRef.current?.stop();

  return { isRecording, start, stop };
}

// --- Utility Function ---
const cleanText = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-zA-Z\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();

// --- Components ---
function Setup({
  paragraph,
  setParagraph,
  strictMode,
  setStrictMode,
  onStart,
}: {
  paragraph: string;
  setParagraph: (val: string) => void;
  strictMode: boolean;
  setStrictMode: (val: boolean) => void;
  onStart: () => void;
}) {
  return (
    <div className="space-y-6">
      <textarea
        className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
        placeholder="Paste paragraph to memorize..."
        value={paragraph}
        onChange={(e) => setParagraph(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={strictMode}
            onChange={() => setStrictMode(!strictMode)}
            className="accent-black"
          />
          Strict Mode
        </label>
        <button
          className="bg-black text-white px-6 py-2 rounded-xl hover:bg-slate-800 transition disabled:opacity-40"
          disabled={!paragraph.trim()}
          onClick={onStart}
        >
          Start Now
        </button>
      </div>
    </div>
  );
}

function Preview({ paragraph, countdown }: { paragraph: string; countdown: number }) {
  return (
    <div className="space-y-6 text-center">
      <div className="text-5xl font-bold text-slate-700 animate-pulse">{countdown}</div>
      <div className="p-6 border border-slate-300 rounded-xl bg-slate-50 text-slate-700 leading-relaxed select-none">
        {paragraph}
      </div>
    </div>
  );
}

function Typing({
  paragraphWords,
  userInput,
  setUserInput,
  strictMode,
  onDone,
  speechControls,
}: {
  paragraphWords: string[];
  userInput: string;
  setUserInput: (val: string) => void;
  strictMode: boolean;
  onDone: () => void;
  speechControls: { isRecording: boolean; start: () => void; stop: () => void };
}) {
  const inputWords = useMemo(() => cleanText(userInput).split(" "), [userInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!strictMode) return;
    if (e.key === " ") {
      const rawWords = e.currentTarget.value.toLowerCase().split(" ");
      const currentWord = rawWords[rawWords.length - 1];
      const correctWord = paragraphWords[rawWords.length - 1];
      if (currentWord !== correctWord) e.preventDefault();
    }
  };

  const progress = Math.min((inputWords.length / paragraphWords.length) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-slate-600">Speak or type from memory</div>
        {!speechControls.isRecording ? (
          <button
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition"
            onClick={speechControls.start}
          >
            🎤 Start
          </button>
        ) : (
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
            onClick={speechControls.stop}
          >
            🛑 Stop
          </button>
        )}
      </div>

      <textarea
        className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        placeholder="Type or speak..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value.toLowerCase())}
        onKeyDown={handleKeyDown}
      />

      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-sm leading-relaxed">
        {inputWords.map((word, i) => {
          const isCorrect = word === paragraphWords[i];
          const isCurrent = i === inputWords.length - 1;
          return (
            <span
              key={i}
              className={`font-medium ${
                isCorrect ? "text-emerald-600" : "text-red-500"
              } ${isCurrent ? "underline" : ""}`}
            >
              {word + " "}
            </span>
          );
        })}
      </div>

      <div className="w-full bg-slate-200 h-2 rounded-full">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-end">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-40"
          onClick={onDone}
          disabled={!userInput.trim()}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Result({ accuracy, onReset }: { accuracy: number; onReset: () => void }) {
  return (
    <div className="space-y-6 text-center">
      <div className="text-3xl font-bold">Results</div>
      <div className="space-y-2">
        <div className="text-lg font-medium">Accuracy</div>
        <div className="text-5xl font-bold text-blue-600">{accuracy}%</div>
        <div className="w-full bg-slate-200 h-3 rounded-full mt-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>
      <button
        className="bg-black text-white px-6 py-2 rounded-xl hover:bg-slate-800 transition"
        onClick={onReset}
      >
        Play Again
      </button>
    </div>
  );
}

// --- Main App ---
export default function Home() {
  const [paragraph, setParagraph] = useState("");
  const [userInput, setUserInput] = useState("");
  const [gameState, setGameState] = useState<"setup" | "preview" | "typing" | "result">("setup");
  const [countdown, setCountdown] = useState(5);
  const [accuracy, setAccuracy] = useState(0);
  const [strictMode, setStrictMode] = useState(false);

  const paragraphWords = useMemo(() => cleanText(paragraph).split(" "), [paragraph]);

  const { isRecording, start, stop } = useSpeechRecognition(setUserInput);

  // --- Countdown effect ---
  useEffect(() => {
    if (gameState !== "preview") return;
    if (countdown === 0) {
      setGameState("typing");
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  const startGame = () => {
    setCountdown(5);
    setGameState("preview");
  };

  const calculateResults = () => {
    let correctCount = 0;
    const inputWords = cleanText(userInput).split(" ");
    paragraphWords.forEach((word, index) => {
      if (inputWords[index] === word) correctCount++;
    });
    setAccuracy(Math.round((correctCount / paragraphWords.length) * 100));
    setGameState("result");
    stop();
  };

  const resetGame = () => {
    setParagraph("");
    setUserInput("");
    setAccuracy(0);
    setCountdown(5);
    setGameState("setup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Memorization Trainer</h1>
          <p className="text-slate-500 text-sm">Train your memory by typing or speaking from recall</p>
        </div>

        {gameState === "setup" && (
          <Setup
            paragraph={paragraph}
            setParagraph={setParagraph}
            strictMode={strictMode}
            setStrictMode={setStrictMode}
            onStart={startGame}
          />
        )}

        {gameState === "preview" && <Preview paragraph={paragraph} countdown={countdown} />}

        {gameState === "typing" && (
          <Typing
            paragraphWords={paragraphWords}
            userInput={userInput}
            setUserInput={setUserInput}
            strictMode={strictMode}
            onDone={calculateResults}
            speechControls={{ isRecording, start, stop }}
          />
        )}

        {gameState === "result" && <Result accuracy={accuracy} onReset={resetGame} />}
      </div>
    </div>
  );
}
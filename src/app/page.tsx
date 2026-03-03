"use client";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [paragraph, setParagraph] = useState("");
  const [gameState, setGameState] = useState<
    "setup" | "preview" | "typing" | "result"
  >("setup");
  const [userInput, setUserInput] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [accuracy, setAccuracy] = useState(0);
  const [strictMode, setStrictMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const recognitionRef = useRef<any>(null);

  // ✅ REMOVE EVERYTHING EXCEPT LETTERS AND SPACES
  const cleanText = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "") // remove non letters
      .replace(/\s+/g, " ") // remove extra spaces
      .trim();
  };

  const paragraphWords = cleanText(paragraph).split(" ");
  const inputWords = cleanText(userInput).split(" ");

  // -------------------------
  // SETUP SPEECH RECOGNITION
  // -------------------------
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
      let transcript = "";

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      // ✅ CLEAN SPEECH INPUT LIVE
      const cleaned = cleanText(transcript);
      setUserInput(cleaned);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // -------------------------
  // COUNTDOWN LOGIC
  // -------------------------
  useEffect(() => {
    if (gameState !== "preview") return;

    if (countdown === 0) {
      setGameState("typing");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [gameState, countdown]);

  // -------------------------
  // START / STOP VOICE
  // -------------------------
  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    recognitionRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  // -------------------------
  // STRICT MODE (Typing Only)
  // -------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!strictMode) return;

    if (e.key === " ") {
      const currentIndex = inputWords.length - 1;
      const currentWord = inputWords[currentIndex];
      const correctWord = paragraphWords[currentIndex];

      if (currentWord !== correctWord) {
        e.preventDefault();
      }
    }
  };

  // -------------------------
  // RESULTS
  // -------------------------
  const calculateResults = () => {
    let correctCount = 0;

    paragraphWords.forEach((word, index) => {
      if (inputWords[index] === word) {
        correctCount++;
      }
    });

    const finalAccuracy = Math.round(
      (correctCount / paragraphWords.length) * 100
    );

    setAccuracy(finalAccuracy);
    setGameState("result");
  };

  const resetGame = () => {
    setParagraph("");
    setUserInput("");
    setAccuracy(0);
    setCountdown(5);
    setGameState("setup");
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-10 gap-6">
      <h1 className="text-3xl font-bold">Memorization Typing Game</h1>

      {gameState === "setup" && (
        <>
          <textarea
            className="w-full max-w-2xl p-3 border rounded"
            placeholder="Paste paragraph to memorize..."
            value={paragraph}
            onChange={(e) => setParagraph(e.target.value)}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={strictMode}
              onChange={() => setStrictMode(!strictMode)}
            />
            Strict Mode
          </label>

          <button
            className="bg-black text-white px-4 py-2 rounded"
            disabled={!paragraph.trim()}
            onClick={() => {
              setCountdown(5);
              setGameState("preview");
            }}
          >
            Start
          </button>
        </>
      )}

      {gameState === "preview" && (
        <>
          <div className="text-lg font-semibold">
            Memorize... {countdown}
          </div>

          <div className="w-full max-w-2xl p-4 border rounded select-none">
            {paragraph}
          </div>
        </>
      )}

      {gameState === "typing" && (
        <>
          <div className="text-lg font-semibold">
            Speak or type from memory
          </div>

          <div className="flex gap-4">
            {!isRecording ? (
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={startRecording}
              >
                🎤 Start Speaking
              </button>
            ) : (
              <button
                className="bg-red-600 text-white px-4 py-2 rounded"
                onClick={stopRecording}
              >
                🛑 Stop
              </button>
            )}
          </div>

          <textarea
            className="w-full max-w-2xl p-3 border rounded"
            placeholder="Type or speak..."
            value={userInput}
            onChange={(e) =>
              setUserInput(cleanText(e.target.value))
            }
            onKeyDown={handleKeyDown}
          />

          <div className="w-full max-w-2xl p-4 border rounded">
            {inputWords.map((word, index) => {
              const isCorrect = word === paragraphWords[index];

              return (
                <span
                  key={index}
                  className={
                    isCorrect
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {word + " "}
                </span>
              );
            })}
          </div>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={calculateResults}
            disabled={!userInput.trim()}
          >
            Done
          </button>
        </>
      )}

      {gameState === "result" && (
        <>
          <div className="text-2xl font-bold">Results</div>
          <div className="text-lg">Accuracy: {accuracy}%</div>

          <button
            className="bg-black text-white px-4 py-2 rounded"
            onClick={resetGame}
          >
            Play Again
          </button>
        </>
      )}
    </div>
  );
}
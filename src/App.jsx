import React, { useState, useRef } from "react";
import { transcribeAudio } from "./groqSTT";
import { translateText } from "./groqTranslate";
import { playSpeech } from "./ttsApi";


export default function App() {
  const [screen, setScreen] = useState("home");
  const [language, setLanguage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // === Sélection langue ===
  const handleSelect = (lang) => {
    setLanguage(lang);
    setScreen("record");
  };

  // === Démarrer l’enregistrement ===
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        setResult("⏳ Transcription en cours...");

        // 1️⃣ Transcrire avec Groq STT
        const text = await transcribeAudio(audioBlob);
        setResult(`📝 Texte détecté : ${text}\n\n⏳ Traduction en cours...`);

        // 2️⃣ Traduire en chinois
     const fromLang = language === "fr" ? "French" : "Chinese";
const toLang = language === "fr" ? "Chinese" : "French";

setResult(`📝 Texte détecté (${fromLang}) : ${text}\n\n⏳ Traduction...`);

const translated = await translateText(text, fromLang, toLang);

setResult(
  `📝 Texte détecté (${fromLang}) : ${text}\n\n🌐 Traduction (${toLang}) : ${translated}`
);


// Lecture automatique selon la langue cible
if (toLang === "Chinese") {
  await playSpeech(translated, "zh");
} else if (toLang === "French") {
  await playSpeech(translated, "fr");
}

      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur micro :", err);
      alert("Impossible d’accéder au micro.");
    }
  };

  // === Arrêter l’enregistrement ===
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div style={styles.app}>
      {screen === "home" && (
        <>
          <h1 style={styles.h1}>Choisis ta langue</h1>
          <button style={styles.button} onClick={() => handleSelect("fr")}>
            🇫🇷 Français
          </button>
          <button style={styles.button} onClick={() => handleSelect("zh")}>
            🇨🇳 Chinois
          </button>
        </>
      )}

      {screen === "record" && (
        <>
          <h2 style={styles.h2}>
            🎙️ Parle en {language === "fr" ? "français" : "chinois"}
          </h2>

          {!isRecording ? (
            <button style={styles.buttonRecord} onClick={startRecording}>
              🔴 Appuyer pour parler
            </button>
          ) : (
            <button style={styles.buttonStop} onClick={stopRecording}>
              🟢 Arrêter
            </button>
          )}

          <div style={styles.resultBox}>{result}</div>

          <button style={styles.backButton} onClick={() => setScreen("home")}>
            ⬅️ Retour
          </button>
        </>
      )}
    </div>
  );
}

// 🎨 Style global
const styles = {
  app: {
    height: "100vh",
    width: "100%",
    background: "#0d1117",
    color: "#f1f1f1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, sans-serif",
    textAlign: "center",
    padding: 20,
  },
  h1: {
    fontSize: "2rem",
    marginBottom: 20,
  },
  h2: {
    fontSize: "1.5rem",
    marginBottom: 20,
  },
  button: {
    background: "#d4af37",
    border: "none",
    color: "#fff",
    padding: "12px 24px",
    fontSize: "1rem",
    borderRadius: "8px",
    margin: "10px",
    cursor: "pointer",
    transition: "0.2s",
  },
  buttonRecord: {
    background: "#c1121f",
    border: "none",
    color: "#fff",
    padding: "14px 28px",
    fontSize: "1rem",
    borderRadius: "10px",
    margin: "10px",
    cursor: "pointer",
  },
  buttonStop: {
    background: "#28a745",
    border: "none",
    color: "#fff",
    padding: "14px 28px",
    fontSize: "1rem",
    borderRadius: "10px",
    margin: "10px",
    cursor: "pointer",
  },
  resultBox: {
    width: "80%",
    maxWidth: "800px",
    background: "#161b22",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "30px",
    color: "#e6edf3",
    fontSize: "1rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    boxShadow: "0 0 12px rgba(255, 255, 255, 0.05)",
    textAlign: "left",
  },
  backButton: {
    marginTop: "20px",
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
  },
};

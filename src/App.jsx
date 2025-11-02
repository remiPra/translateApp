import React, { useState, useRef } from "react";
import { transcribeAudio } from "./groqSTT";
import { translateText } from "./groqTranslate";
import { playSpeech } from "./ttsApi";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [language, setLanguage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // === Sélection langue ===
  const handleSelect = (lang) => {
    setLanguage(lang);
    setScreen("record");
  };

  // === Traitement du texte/audio ===
  const processTranslation = async (inputText) => {
    try {
      setIsLoading(true);
      setResult("🔄 Traduction en cours...");

      const fromLang = language === "fr" ? "French" : "Chinese";
      const toLang = language === "fr" ? "Chinese" : "French";

      setResult(`📝 Texte détecté (${fromLang}) : ${inputText}\n\n⏳ Traduction...`);

      const translated = await translateText(inputText, fromLang, toLang);

      setResult(
        `📝 Texte détecté (${fromLang}) : ${inputText}\n\n🌍 Traduction (${toLang}) : ${translated}`
      );

      // Lecture automatique
      if (toLang === "Chinese") {
        await playSpeech(translated, "zh");
      } else if (toLang === "French") {
        await playSpeech(translated, "fr");
      }

      setIsLoading(false);
    } catch (err) {
      console.error("Erreur traduction :", err);
      setResult("❌ Erreur lors de la traduction");
      setIsLoading(false);
    }
  };

  // === Démarrer l'enregistrement ===
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
        setIsLoading(true);
        setResult("🔄 Transcription en cours...");

        try {
          const text = await transcribeAudio(audioBlob);
          await processTranslation(text);
        } catch (err) {
          console.error("Erreur STT :", err);
          setResult("❌ Erreur lors de la transcription");
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur micro :", err);
      alert("Impossible d'accéder au micro.");
      setIsLoading(false);
    }
  };

  // === Arrêter l'enregistrement ===
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // === Soumettre le texte ===
  const handleTextSubmit = () => {
    if (textInput.trim()) {
      processTranslation(textInput);
    }
  };

  return (
    <div style={styles.app}>
      <style>{keyframes}</style>

      {/* === ÉCRAN ACCUEIL === */}
      {screen === "home" && (
        <div style={styles.container}>
          <div style={styles.header}>
            <h1 style={styles.h1}>✨ Traducteur Vocal ✨</h1>
            <p style={styles.subtitle}>Choisissez votre langue</p>
          </div>

          <div style={styles.buttonGroup}>
            <button
              style={styles.button}
              onClick={() => handleSelect("fr")}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
            >
              🇫🇷 Français
            </button>
            <button
              style={styles.button}
              onClick={() => handleSelect("zh")}
              onMouseEnter={(e) => Object.assign(e.target.style, styles.buttonHover)}
              onMouseLeave={(e) => Object.assign(e.target.style, styles.button)}
            >
              🇨🇳 Chinois
            </button>
          </div>
        </div>
      )}

      {/* === ÉCRAN RECORD (Voice + Text ensemble) === */}
      {screen === "record" && (
        <div style={styles.container}>
          <h2 style={styles.h2}>
            🎙️ {language === "fr" ? "Français" : "Chinois"}
          </h2>

          {/* === AFFICHE MICRO ET INPUT UNIQUEMENT SI PAS DE RÉSULTAT === */}
          {!result && (
            <>
              {/* === SECTION PUSH TO TALK === */}
              <div style={styles.recordingContainer}>
                <p style={styles.sectionLabel}>🎤 Push to Talk</p>
                {!isRecording ? (
                  <button
                    style={styles.buttonRecord}
                    onClick={startRecording}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, {
                        ...styles.buttonRecord,
                        transform: "scale(1.05)",
                      })
                    }
                    onMouseLeave={(e) => Object.assign(e.target.style, styles.buttonRecord)}
                  >
                    🎤 Appuyer pour parler
                  </button>
                ) : (
                  <button
                    style={styles.buttonStop}
                    onClick={stopRecording}
                    onMouseEnter={(e) =>
                      Object.assign(e.target.style, {
                        ...styles.buttonStop,
                        transform: "scale(1.05)",
                      })
                    }
                    onMouseLeave={(e) => Object.assign(e.target.style, styles.buttonStop)}
                  >
                    ⏹️ Arrêter
                  </button>
                )}
              </div>

              {/* === SECTION INPUT TEXTE === */}
              <div style={styles.textInputSection}>
                <p style={styles.sectionLabel}>⌨️ Ou tapez ici</p>
                <div style={styles.textInputContainer}>
                  <textarea
                    style={styles.textarea}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Entrez votre texte..."
                    disabled={isLoading}
                  />

                  <div style={styles.inputButtonGroup}>
                    <button
                      style={{
                        ...styles.buttonTranslate,
                        opacity: textInput.trim() ? 1 : 0.5,
                        cursor: textInput.trim() && !isLoading ? "pointer" : "not-allowed",
                      }}
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim() || isLoading}
                      onMouseEnter={(e) =>
                        textInput.trim() && !isLoading &&
                        Object.assign(e.target.style, { transform: "scale(1.05)" })
                      }
                      onMouseLeave={(e) =>
                        Object.assign(e.target.style, { transform: "scale(1)" })
                      }
                    >
                      {isLoading ? "⏳ Traduction..." : "✨ Traduire"}
                    </button>

                    <button
                      style={styles.buttonClear}
                      onClick={() => setTextInput("")}
                      disabled={isLoading}
                      onMouseEnter={(e) =>
                        !isLoading &&
                        Object.assign(e.target.style, { ...styles.buttonClear, transform: "scale(1.05)" })
                      }
                      onMouseLeave={(e) =>
                        Object.assign(e.target.style, { transform: "scale(1)" })
                      }
                    >
                      🗑️ Effacer
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === LOADER === */}
          {isLoading && <div style={styles.loader} />}

          {/* === RÉSULTAT === */}
          {result && <div style={styles.resultBox}>{result}</div>}

          {/* === BOUTON RETOUR === */}
          <button
            style={styles.backButton}
            onClick={() => {
              setScreen("home");
              setResult("");
              setTextInput("");
              setIsLoading(false);
            }}
            onMouseEnter={(e) => Object.assign(e.target.style, styles.backButtonHover)}
            onMouseLeave={(e) => Object.assign(e.target.style, styles.backButton)}
          >
            ⬅️ Retour
          </button>
        </div>
      )}
    </div>
  );
}

// ✨ Animations CSS
const keyframes = `
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 12px 36px rgba(0, 102, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
    50% { box-shadow: 0 12px 48px rgba(0, 217, 255, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// 🎨 Palette bleue premium
const COLORS = {
  primary: "#0066ff",
  secondary: "#00d9ff",
  accent: "#0044cc",
  dark: "#0a1428",
  surface: "#0d1f3c",
  text: "#e0e7ff",
  textMuted: "#94a3b8",
  success: "#10b981",
};

const styles = {
  app: {
    height: "100vh",
    width: "100%",
    background: `linear-gradient(135deg, ${COLORS.dark} 0%, #0f2847 100%)`,
    color: COLORS.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
    textAlign: "center",
    padding: 20,
    overflow: "auto",
  },
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: "600px",
    padding: "20px 0",
  },
  header: {
    marginBottom: 40,
  },
  h1: {
    fontSize: "3rem",
    marginBottom: 15,
    fontWeight: "700",
    background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.02em",
    animation: "fadeInDown 0.6s ease-out",
    margin: 0,
  },
  subtitle: {
    fontSize: "1.1rem",
    color: COLORS.textMuted,
    fontWeight: "400",
    marginTop: 10,
    animation: "fadeIn 0.8s ease-out",
  },
  h2: {
    fontSize: "1.8rem",
    marginBottom: 30,
    fontWeight: "600",
    color: COLORS.secondary,
    animation: "fadeIn 0.5s ease-out",
    margin: 0,
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    width: "100%",
  },
  button: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
    border: "none",
    color: "#fff",
    padding: "14px 32px",
    fontSize: "1.1rem",
    fontWeight: "600",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: `0 8px 24px rgba(0, 102, 255, 0.3)`,
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  buttonHover: {
    transform: "translateY(-3px)",
    boxShadow: `0 12px 32px rgba(0, 102, 255, 0.5)`,
  },

  // === RECORDING SECTION ===
  recordingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 15,
    margin: "30px 0",
    width: "100%",
  },
  sectionLabel: {
    fontSize: "1rem",
    fontWeight: "600",
    color: COLORS.secondary,
    margin: 0,
    textAlign: "center",
  },
  buttonRecord: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
    border: "2px solid transparent",
    color: "#fff",
    padding: "16px 36px",
    fontSize: "1.2rem",
    fontWeight: "700",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: `0 12px 36px rgba(0, 102, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
    animation: "pulse 2s ease-in-out infinite",
    width: "100%",
    maxWidth: "300px",
  },
  buttonStop: {
    background: `linear-gradient(135deg, ${COLORS.success} 0%, #059669 100%)`,
    border: "none",
    color: "#fff",
    padding: "16px 36px",
    fontSize: "1.2rem",
    fontWeight: "700",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: `0 12px 36px rgba(16, 185, 129, 0.4)`,
    animation: "fadeIn 0.3s ease-out",
    width: "100%",
    maxWidth: "300px",
  },

  // === TEXT INPUT SECTION ===
  textInputSection: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
  },
  textInputContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  textarea: {
    background: `linear-gradient(135deg, ${COLORS.surface} 0%, #0f2f5c 100%)`,
    border: `2px solid rgba(0, 217, 255, 0.3)`,
    borderRadius: "12px",
    padding: "14px",
    color: COLORS.text,
    fontSize: "1rem",
    fontFamily: "inherit",
    lineHeight: 1.5,
    minHeight: "100px",
    maxHeight: "150px",
    resize: "vertical",
    transition: "all 0.3s ease",
    boxShadow: `0 4px 16px rgba(0, 102, 255, 0.1)`,
    outline: "none",
  },
  inputButtonGroup: {
    display: "flex",
    gap: "12px",
    width: "100%",
  },
  buttonTranslate: {
    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
    border: "none",
    color: "#fff",
    padding: "12px 24px",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: `0 8px 24px rgba(0, 102, 255, 0.3)`,
    flex: 1,
  },
  buttonClear: {
    background: `linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)`,
    border: `2px solid ${COLORS.secondary}`,
    color: COLORS.secondary,
    padding: "12px 24px",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    flex: 1,
  },

  loader: {
    width: "40px",
    height: "40px",
    border: `3px solid rgba(0, 102, 255, 0.2)`,
    borderTop: `3px solid ${COLORS.secondary}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "20px 0",
  },
  resultBox: {
    width: "100%",
    background: `linear-gradient(135deg, ${COLORS.surface} 0%, #0f2f5c 100%)`,
    borderRadius: "16px",
    padding: "24px",
    marginTop: "24px",
    color: COLORS.text,
    fontSize: "1rem",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    boxShadow: `0 20px 48px rgba(0, 102, 255, 0.2), inset 0 1px 0 rgba(0, 217, 255, 0.1)`,
    textAlign: "left",
    border: `1px solid rgba(0, 217, 255, 0.2)`,
    backdropFilter: "blur(10px)",
    animation: "slideUp 0.4s ease-out",
    maxHeight: "250px",
    overflowY: "auto",
    scrollBehavior: "smooth",
    wordBreak: "break-word",
  },
  backButton: {
    marginTop: "24px",
    background: `linear-gradient(135deg, rgba(0, 102, 255, 0.2) 0%, rgba(0, 217, 255, 0.1) 100%)`,
    color: COLORS.secondary,
    border: `2px solid ${COLORS.secondary}`,
    borderRadius: "10px",
    padding: "10px 24px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "600",
    fontSize: "1rem",
    width: "auto",
  },
  backButtonHover: {
    background: `linear-gradient(135deg, rgba(0, 102, 255, 0.4) 0%, rgba(0, 217, 255, 0.2) 100%)`,
    transform: "translateY(-2px)",
    boxShadow: `0 8px 20px rgba(0, 217, 255, 0.3)`,
  },
};
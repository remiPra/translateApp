export async function playSpeech(text, lang = "fr") {
  if (!text) return;

  try {
    const response = await fetch(`https://seo-tool-cd8x.onrender.com/synthesize/${lang}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error("Erreur synthèse vocale :", await response.text());
      return;
    }

    // Récupérer le flux audio
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Lecture
    const audio = new Audio(url);
    audio.play();

    // Nettoyage du blob après lecture
    audio.onended = () => URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Erreur TTS:", error);
  }
}

export async function transcribeAudio(audioBlob) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  formData.append("model", "whisper-large-v3");

  const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erreur STT:", errorText);
    throw new Error(errorText);
  }

  const data = await response.json();
  return data.text;
}

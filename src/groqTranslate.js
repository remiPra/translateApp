export async function translateText(text, fromLang, toLang) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
Tu es un traducteur professionnel. 
Ta mission : traduire fidèlement le texte donné de ${fromLang} vers ${toLang}.
Règles impératives :
- Réponds UNIQUEMENT avec la traduction.
- Ne donne AUCUNE explication, AUCUNE remarque, AUCUN commentaire.
- Si le texte est déjà dans la langue cible, répète-le simplement.
- Utilise la langue ${toLang} exclusivement dans ta réponse.
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Erreur traduction :", err);
    return "⚠️ Erreur de traduction";
  }
}

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const bodyData = JSON.parse(event.body);
        const userQuery = bodyData.query || "Vérification d'actualité";
        const domain = bodyData.domain || 'général';
        // Remplace par ta vraie clé Perplexity
        const PERPLEXITY_API_KEY = "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";

        const prompt = `Agis comme un expert strict en fact-checking. 
Analyse cette affirmation/sujet : "${userQuery}" (Domaine : ${domain}).
Fais une recherche web immédiate et approfondie. 
Cite au moins 2 sources web réelles et vérifiables (URLs).

Tu dois répondre STRICTEMENT en format JSON valide, sans aucune autre explication, avec cette structure :
{
  "badge": "VÉRIFIÉ" ou "INFOX" ou "DOUTE",
  "title": "Titre explicite",
  "score": "Pourcentage de fiabilité",
  "findings": "Explication détaillée de la vérification",
  "sources": ["URL1", "URL2"]
}`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: 'Tu es un vérificateur de faits rigoureux qui répond uniquement en JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.2
            })
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(content);

        // Injecte les citations brutes de Perplexity si le JSON en manquait
        if ((!result.sources || result.sources.length === 0) && data.citations) {
            result.sources = data.citations.slice(0, 3);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error("Erreur critique :", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                badge: "ERREUR",
                title: "Échec de la connexion",
                score: "0%",
                findings: "Impossible de joindre le service de vérification.",
                sources: []
            })
        };
    }
}

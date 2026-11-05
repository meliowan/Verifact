export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const bodyData = JSON.parse(event.body);
        const imageBase64 = bodyData.imageBase64;
        const mimeType = bodyData.mimeType || 'image/jpeg';
        const domain = bodyData.domain || 'auto';

        if (!imageBase64) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Aucune image reçue." })
            };
        }

        // ==========================================
        // METS TA CLÉ PERPLEXITY ENTRE LES GUILLEMETS :
        const PERPLEXITY_API_KEY = "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";
        // ==========================================

        const prompt = `Agis en tant qu'expert en fact-checking. Analyse cette image (domaine ciblé : ${domain}) et effectue une recherche web approfondie pour vérifier si ces faits ou cette image sont authentiques ou s'il s'agit d'une infox.

Renvoie STRICTEMENT et UNIQUEMENT un objet JSON valide (sans aucun texte autour, sans balises markdown ```json) avec cette structure exacte :
{
  "isNews": true,
  "badge": "VERIFIÉ AUTHENTIQUE" ou "ALERTE • INTOX",
  "title": "Titre court résumant le sujet",
  "score": "92%",
  "theme": "emerald" ou "red",
  "consensus": "CONFIRMÉ PAR LA PRESSE" ou "DÉBUNKÉ",
  "sources": [
    { "name": "Nom d'un média", "status": "confirmed", "note": "Détail de la source" }
  ],
  "findings": [
    { "title": "Point d'enquête", "desc": "Explication détaillée de la vérification." }
  ]
}`;

        // Appel direct à l'API Perplexity (modèle Sonar orienté recherche web)
        const perplexityResponse = await fetch('[https://api.perplexity.ai/chat/completions](https://api.perplexity.ai/chat/completions)', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { 
                                type: 'image_url', 
                                image_url: { url: `data:${mimeType};base64,${imageBase64}` } 
                            }
                        ]
                    }
                ],
                temperature: 0.2
            })
        });

        if (!perplexityResponse.ok) {
            const errText = await perplexityResponse.text();
            throw new Error(`Erreur API Perplexity: ${perplexityResponse.status} - ${errText}`);
        }

        const data = await perplexityResponse.json();
        let textResponse = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "{}";
        
        // Nettoyage des balises markdown si présentes
        textResponse = textResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

        let resultData = JSON.parse(textResponse);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resultData)
        };

    } catch (error) {
        console.error("Erreur serveur:", error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                isNews: false,
                badge: "ERREUR TECHNIQUE",
                title: "Échec de l'analyse",
                theme: "red",
                consensus: "ERREUR",
                sources: [],
                findings: [
                    { title: "Détail", desc: error.message || "Erreur de traitement." }
                ]
            })
        };
    }
}

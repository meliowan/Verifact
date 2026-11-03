import { GoogleGenAI } from '@google/genai';

// ==========================================
// METS TA CLÉ API GEMINI ENTRE LES GUILLEMETS ICI :
const MA_CLE_API = "AQ.Ab8RN6J09nhRhNkFZepgDKBIlU-T96WhVgES-iNMDtGwxaGofg";
// ==========================================

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageBase64, mimeType, domain } = JSON.parse(event.body);
        
        const ai = new GoogleGenAI({ apiKey: MA_CLE_API });

        const prompt = `Agis en tant qu'expert en fact-checking et analyse cette image. 
Domaine ciblé : ${domain}.
Utilise la recherche Google en direct (Google Search) pour vérifier si cette image ou cette information est mentionnée dans des sources d'actualité majeures (Le Monde, Le Figaro, New York Times, Reuters, etc.).

Règles importantes :
- Si c'est une photo personnelle, un selfie, un animal de compagnie ou un contenu sans lien manifeste avec l'actualité, définis "isNews" à false.
- Si c'est un article d'actualité, une capture d'écran de média ou une image virale publique, définis "isNews" à true.

Renvoie STRICTEMENT un objet JSON valide (sans aucun bloc de texte markdown autour, juste l'objet JSON brut) avec cette structure exacte :
{
  "isNews": true ou false,
  "badge": "VERIFIÉ AUTHENTIQUE" ou "ALERTE • INTOX" ou "HORS SUJET / PERSONNEL",
  "title": "Titre court résumant le sujet",
  "score": "Pourcentage de confiance réel basé sur l'enquête (ex: 94% ou 12%)",
  "theme": "emerald" ou "red" ou "amber",
  "consensus": "CONFIRMÉ PAR LA PRESSE" ou "DÉBUNKÉ" ou "HORS ACTUALITÉ",
  "sources": [
    { "name": "Le Monde", "status": "confirmed" | "debunked" | "warning" | "not_found", "note": "Détail de la source" },
    { "name": "Le Figaro", "status": "confirmed" | "debunked" | "warning" | "not_found", "note": "Détail" }
  ],
  "findings": [
    { "title": "Point d'enquête", "desc": "Explication détaillée de la vérification web." }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType || 'image/jpeg',
                        data: imageBase64
                    }
                },
                prompt
            ],
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let textResponse = response.text.trim();
        textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const resultData = JSON.parse(textResponse);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resultData)
        };

    } catch (error) {
        console.error("Erreur serveur:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Erreur lors de l'analyse en direct." })
        };
    }
}

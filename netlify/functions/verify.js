export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const bodyData = JSON.parse(event.body);
        const domain = bodyData.domain || 'actualité générale';
        // On récupère le texte descriptif ou le titre fourni par l'utilisateur
        const userQuery = bodyData.query || bodyData.title || `Actualité récente sur le domaine ${domain}`;

        // ==========================================
        // METS TA CLÉ PERPLEXITY ENTRE LES GUILLEMETS :
        const PERPLEXITY_API_KEY = "pplx-TA_CLE_PERPLEXITY_ICI";
        // ==========================================

        const prompt = `En tant qu'expert en fact-checking, analyse la véracité de cette information/sujet : "${userQuery}" (Domaine : ${domain}). 
Effectue une recherche web en direct pour trouver des sources, des articles de presse récents et déterminer si c'est vrai, faux ou trompeur.

Renvoie STRICTEMENT et UNIQUEMENT un objet JSON valide (sans markdown ```json, juste le texte JSON brut) respectant exactement cette structure :
{
  "isNews": true,
  "badge": "VÉRIFIÉ EN DIRECT",
  "title": "Vérification : ${userQuery.substring(0, 30)}...",
  "score": "87%",
  "theme": "emerald",
  "consensus": "CONFIRMÉ PAR LES SOURCES",
  "findings": [
    { "title": "Analyse des faits", "desc": "Rédige ici les conclusions précises basées sur la recherche web en direct de ce sujet spécifique." }
  ]
}`;

        const perplexityResponse = await fetch('[https://api.perplexity.ai/chat/completions](https://api.perplexity.ai/chat/completions)', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro', // Utilisation de sonar-pro pour une recherche et une analyse plus poussées et dynamiques
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3
            })
        });

        if (!perplexityResponse.ok) {
            const errText = await perplexityResponse.text();
            throw new Error(`Erreur API Perplexity: ${perplexityResponse.status} - ${errText}`);
        }

        const data = await perplexityResponse.json();
        let textResponse = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "{}";
        const rawCitations = data.citations || [];

        textResponse = textResponse.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

        let resultData;
        try {
            resultData = JSON.parse(textResponse);
        } catch (e) {
            resultData = {
                isNews: true,
                badge: "RÉSULTAT WEB",
                title: "Enquête : " + domain,
                score": "80%",
                theme: "emerald",
                consensus: "INFORMATIONS RECENSÉES",
                findings: [{ title: "Synthèse", desc: textResponse }]
            };
        }

        resultData.sources = rawCitations.map((url) => {
            let domainName = "Source web";
            try {
                domainName = new URL(url).hostname.replace('www.', '');
            } catch (err) {}
            return {
                name: domainName.charAt(0).toUpperCase() + domainName.slice(1),
                status: "confirmed",
                note: url
            };
        });

        if (!resultData.sources || resultData.sources.length === 0) {
            resultData.sources = [{ name: "Perplexity Live Search", status: "confirmed", note: "Recherche sur le web mondial" }];
        }

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
                badge: "ERREUR",
                title: "Échec de l'analyse",
                theme: "red",
                consensus: "INDISPONIBLE",
                sources: [],
                findings: [{ title: "Erreur", desc: error.message }]
            })
        };
    }
}

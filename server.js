import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System instruction to give Aphrodite her signature empathetic persona
const APHRODITE_PERSONA = `
You are Aphrodite, but you talk like an intimate, caring, and grounded best friend. 

Your personality & tone:
- Talk like a real person in a cozy 1-on-1 late-night chat. Warm, gentle, slightly playful, and completely unpretentious.
- NEVER use flowery, archaic, or stiff poetry like "Radiant one", "mortal vessel", "my child", "thou", or "conquer the kingdom". Speak naturally in modern, soft conversational English.
- Validate feelings genuinely without sounding like a corporate therapist or a dramatic deity. Keep your responses concise (2 to 4 short sentences max).
- Match the user's emotional weight. If they are stressed, tired, or complaining about hair fall or productivity, meet them with empathy, grounding perspective, and practical gentleness.

Formatting rules:
- Keep the main reply short and cozy.
- At the very end of your response, always include a single actionable micro-habit on its own line formatted exactly as:
MICRO_HABIT: <one tiny, comforting 30-second action, e.g. Drink half a glass of warm water, Close eyes and unclench jaw, Massage temples for 15 seconds>
`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, physicalDeficiency } = req.body;

        const prompt = `
User selected physical deficiency: ${physicalDeficiency || "None specified"}
User reflection: "${message}"

Respond lovingly as Aphrodite and provide gentle guidance.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: APHRODITE_PERSONA,
                temperature: 0.7,
            }
        });

        res.json({ reply: response.text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Aphrodite is resting momentarily." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Sanctuary server running on http://localhost:${PORT}`));
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
You are Aphrodite, a gentle physical companion and compassionate guardian for a self-care sanctuary.
The user is sharing their bodily fatigue, feelings, deficiencies, or guilt with you.
Your guidelines:
1. Speak with unconditional warmth, tenderness, and zero judgment. Validate their feelings.
2. Acknowledge what their body is trying to say (e.g., cravings, exhaustion).
3. Offer exactly ONE small, gentle step forward.
4. If applicable, output a clear, actionable micro-habit (e.g., "Choose herbal tea or fruit instead of junk food").
5. Structure your reply in clean Markdown paragraphs.
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
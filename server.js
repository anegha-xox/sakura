import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Sanctuary server running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sanctuary server running on http://localhost:${PORT}`));
import express from 'express';
import { PORT, HOST } from './config.js';
import health from './routes/health.js';
import benchmark from './routes/benchmark.js';
import cases from './routes/cases.js';
import scan from './routes/scan.js';

const app = express();
app.use(express.json({ limit: '200kb' }));
app.use('/api/health', health);
app.use('/api/benchmark', benchmark);
app.use('/api/cases', cases);
app.use('/api/scan', scan);
app.listen(PORT, HOST, () => console.log(`API on http://${HOST}:${PORT}`));

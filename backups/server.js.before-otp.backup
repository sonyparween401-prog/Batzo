require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { registerRoutes } = require('./routes');

const { registerUser } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'Batzo API',
    status: 'healthy'
  });
});

app.post('/api/register', async (req, res) => {
  try {
    const { registerRoutes } = require('./routes');

const { name, mobile, password } = req.body;
    const user = await registerUser(name, mobile, password);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Batzo API running on http://127.0.0.1:${PORT}`);
});

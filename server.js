require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/ai', require('./routes/ai'));

// Health check endpoint for Render/uptime monitoring
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Nexora Mega Store API',
    catalogSize: db.memoryStore.products.length
  });
});

// Catch-all route to serve the single-page application
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🛍️  NEXORA MEGASTORE - E-COMMERCE PLATFORM`);
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📦  Catalog: ${db.memoryStore.products.length} live products loaded`);
    console.log(`💳  Payments: UPI (QR & ID), COD, Cards & Net Banking`);
    console.log(`🤖  AI Shopping Copilot initialized & ready`);
    console.log(`====================================================`);
  });
}

module.exports = app;

require('dotenv').config({ path: '.env.local' });
const express = require('express');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

const app = express();

app.use(cors());
app.use(express.json());

// 1. SECURE STRIPE API ENDPOINT
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, email } = req.body;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      receipt_email: email,
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. SERVE THE COMPILED FRONTEND 
// Points directly to the built static folder
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback routing logic to ensure React Router / View transitions don't break on page refresh
app.get('/*fallback', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  res.send('Aura Jewellery API Server Running Successfully');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Unified Node Engine running on port ${PORT}`));
const express = require('express');
const path = require('path');
const cors = require('cors');
// Securely pulls your secret key from environment variables on production platforms
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51TmrFmFfHEi7mBiZM7l1SIyfCSDgz6QgZkybN6Ja8ZXWLjjFEeZzE2kImJR9eeSjwt9G18PChcDhQZYTGb2suXO400l9YayH30'); 

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
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Unified Node Engine running on port ${PORT}`));
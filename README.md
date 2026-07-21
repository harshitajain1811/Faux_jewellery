# 💎 Artificial Jewellery E-Commerce Application

A modern, high-performance, full-stack E-Commerce storefront for artificial and fashion jewellery. Built with a **React (Vite)** frontend, **Express / Node.js** API backend, **Supabase** database, and integrated **Stripe API** for secure payment processing.

![Performance Score](https://img.shields.io/badge/PageSpeed_Desktop-96%2F100-brightgreen)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Supabase%20%7C%20Stripe-blue)

---

## ✨ Features & Highlights

* **Automated Order Confirmation Emails:** Powered by **Supabase Edge Functions** and **Resend API** to trigger instant transactional emails upon successful Stripe checkout.
* **Database Schemas & Edge Logic:** Custom PostgreSQL database schemas, automated triggers, real-time inventory synchronization, and serverless Edge Functions for background tasks.
* **Responsive UI/UX:** Fully responsive, modern storefront optimized for desktop, tablet, and mobile viewports using Tailwind CSS.
* **Product Catalog & Quick-Add Cart:** Interactive product views, stock indicators, dynamic cart state management, and seamless drawer workflows.
* **Secure Checkout Flow:** Full **Stripe Payment Gateway** integration supporting safe checkout flows and order creation.
* **Blazing-Fast Performance:** Engineered for high efficiency, achieving a **96% Desktop Performance** and **100% Best Practices** rating on Google PageSpeed Insights.
* **Production-Ready Deployment:** Hosted and continuous integration set up via **Vercel** (Frontend) and **Render** (Backend).

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React (Vite)
* **Styling:** Tailwind CSS
* **State & Icons:** React Context API, Lucide Icons

### **Backend & Database**
* **Server:** Node.js, Express.js
* **Database & Auth:** Supabase (PostgreSQL Schemas, Triggers & Edge Functions)
* **Email Service:** Resend API
* **Payments:** Stripe API (Test & Live Mode)

### **Hosting & DevOps**
* **Frontend Hosting:** Vercel
* **Backend Hosting:** Render

---

## 🔒 Enterprise Backend Infrastructure

The production environment includes a pre-configured, enterprise-grade Supabase architecture:

* **Row Level Security (RLS):** Strict multi-tenant security policies protecting user and order data.
* **Database Triggers & Functions:** Automated inventory updates and order status lifecycle management.
* **Serverless Edge Functions:** Event-driven email dispatch via **Resend API** on successful Stripe payments.

> **Note on Backend Deployment:**  
> For security reasons, live database migrations, custom RLS scripts, and Edge Function environment configurations are maintained privately.  
>  
> **Interested in a fully deployed, production-ready version for your brand?**  
> * 📩 [Hire me on Upwork](https://www.upwork.com/services/product/development-it-a-custom-full-stack-e-commerce-website-built-with-react-supabase-stripe-2079107499170948100?ref=project_share)  
> * 🌐 [View Live Storefront](https://aura-jewellery-seven.vercel.app/)

---

## 🚀 Getting Started Locally

To run this project on your local machine, follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/harshitajain1811/Faux_jewellery.git](https://github.com/harshitajain1811/Faux_jewellery.git)
cd Faux_jewellery
```

### 2. Install Dependencies
```bash
npm install
```
### 3. Setup .env.local
```bash
# Create a .env.local file in the root directory and add your environment variables:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
```
### 4. Start Development Servers
```bash
# Start backend server
node server.cjs

# Start frontend development server
npm run dev

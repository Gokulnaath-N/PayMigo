# Paymigo — Platform Documentation

## What Is Paymigo?

Paymigo is India's first AI-powered **parametric income protection platform** built specifically for gig economy workers — primarily food and package delivery partners. It solves a real, underserved problem: a single monsoon week can wipe out 40% of a delivery partner's monthly income, and traditional insurance is too slow, too bureaucratic, and too expensive to help them.

Paymigo flips the model. Instead of filing a claim and waiting weeks, payouts are triggered **automatically by real-world data** — rainfall exceeding a threshold, dangerous AQI levels, curfews, or other verified disruptions. No forms. No phone calls. Money hits the worker's wallet in under 90 seconds.

---

## Core Value Proposition

- **Parametric triggers** — payouts fire based on objective data (e.g., rainfall > 15mm/hr), not subjective damage assessment
- **Micro-premiums** — weekly coverage starting at ₹49/week, no multi-month lock-ins
- **Instant payouts** — wallet credit in 90 seconds via UPI/Razorpay
- **Zero paperwork** — fully automated claim lifecycle
- **AI-driven pricing** — premiums calculated per worker based on zone risk, tenure, weather forecasts, and peer behavior

---

## Platform Architecture

Paymigo is a three-layer system:

```
Frontend (React + TypeScript + Vite)
        ↓
Backend API (Node.js + Express + Prisma + PostgreSQL)
        ↓
ML Service (Python FastAPI — 7 trained models)
```

The frontend never talks to ML models directly. All intelligence flows through the backend, which acts as the orchestrator.

---

## Core Features

### 1. Worker Onboarding
- Phone-based authentication (OTP via Firebase)
- Pincode → zone mapping with automatic risk tier assignment
- Platform ID registration (Swiggy, Zomato, etc.)
- ML-powered zone risk scoring at signup
- Instant premium quote generation

### 2. Parametric Insurance Plans

Three tiers of weekly coverage:

| Plan    | Price   | Rainfall Trigger | Max Daily Payout | Payout Speed  |
|---------|---------|-----------------|-----------------|---------------|
| Basic   | ₹49/wk  | > 25mm/hr       | ₹800            | 4 hours       |
| Pro     | ₹69/wk  | > 15mm/hr       | ₹1,500          | 90 seconds    |
| Premium | ₹119/wk | > 10mm/hr       | ₹2,500          | Instant       |

Monsoon season (June–September) applies automatic pricing adjustments (+₹30–₹40/plan) and adds the Stay-at-Home Benefit.

### 3. Trigger Detection Engine
Continuously polls disruption sources:
- Weather APIs (rainfall, storm alerts, flood alerts)
- AQI monitoring
- News/government feeds (curfew, Section 144 orders)

Each event is classified by the ML Trigger Classifier (Random Forest, 94% confidence) to determine if it meets payout criteria. When confirmed, eligible claims are created automatically for all active workers in the affected zone.

### 4. Fraud Detection & Validation
Multi-layer fraud pipeline before any payout:
- **Isolation Forest anomaly detector** — scores claim behavior against historical patterns
- **GPS Spoofing Classifier** (Random Forest) — detects fake location traces
- **GeoTruth coherence engine** — cross-references cell tower data, motion sensors, and location plausibility
- **Community photo validation** — geotagged visual evidence as fallback when APIs fail

Fraud decisions: `AUTO_APPROVE` → `SOFT_PROOF` → `MANUAL_REVIEW` → `REJECT`

### 5. Dynamic Premium Engine (XGBoost)
Weekly premium is not fixed — it's recalculated every Monday using 37 features:
- Zone risk tier
- 7-day LSTM weather forecast score
- AQI 7-day average
- Platform tenure (weeks)
- Loyalty weeks paid
- Historical disruption rate in zone
- Peer claim rate in zone
- Seasonal factors (month sin/cos encoding)

Model performance: R² = 0.796 on test set, MAE = ₹24.68.

### 6. Risk Forecasting (LSTM)
A 2-layer LSTM network predicts 7-day disruption probability per zone using 14-day weather sequences (11 features: rainfall, temperature, humidity, wind speed, pressure, storm/flood/heatwave flags). ROC-AUC = 0.94. Output feeds directly into premium calculation and proactive worker alerts.

### 7. Zone Clustering (K-Means)
Delivery zones are clustered into risk tiers (1–5) based on:
- Historical rainfall and flood frequency
- AQI history
- Past disruption rates

This determines the base risk multiplier applied to every worker's premium in that zone.

### 8. Curfew NLP Detection
TF-IDF + Logistic Regression model classifies news headlines and government texts to detect curfews, strikes, and Section 144 orders. Extracts zone, duration hints, and confidence score. Feeds into the trigger pipeline as a non-weather disruption source.

### 9. Loyalty Pool & Rewards
- A portion of every premium goes into a zone-level loyalty pool
- Workers who don't claim accumulate bonus multipliers
- Gamified avatar/leaderboard system to drive engagement
- Fuel cashback on Pro and Premium plans

### 10. Wallet & Payouts
- In-app wallet for premium deductions and payout credits
- UPI/Razorpay integration for instant disbursement
- Full transaction history
- Webhook-based reconciliation for payment confirmation

### 11. Admin Dashboard
- Zone risk trends and live trigger status
- Claim pipeline overview (pending, fraud check, approved, paid)
- Loss ratio analytics
- Worker onboarding metrics
- ML model inference logs

### 12. Insurer Portal
- Aggregate risk exposure by zone
- Claim trend analytics
- Policy performance data
- Designed for B2B insurer partnerships

---

## ML Model Stack (7 Models)

| # | Model | Algorithm | Purpose |
|---|-------|-----------|---------|
| 1 | Zone Clusterer | K-Means + PCA | Assign zone risk tier |
| 2 | Premium Engine | XGBoost (2000 trees) | Calculate weekly premium |
| 3 | Trigger Classifier | Random Forest | Validate trigger events |
| 4 | Curfew NLP | TF-IDF + Logistic Regression | Detect curfews from text |
| 5 | Fraud Detector | Isolation Forest | Anomaly scoring on claims |
| 6 | GPS Classifier | Random Forest | Detect GPS spoofing |
| 7 | Risk Forecaster | LSTM (64→32→Dense) | 7-day disruption forecast |

All models are served via a FastAPI service (`uvicorn app.main:app`) with Swagger docs at `/docs`. Docker-ready.

---

## Data Model (PostgreSQL via Prisma)

Core entities:
- `Worker` — identity, zone, risk tier, loyalty weeks
- `Zone` — city, pincode, risk tier, risk multiplier
- `Policy` — tier, weekly premium, loyalty percent, active status
- `TriggerEvent` — type, actual value, threshold, confidence, zone
- `Claim` — status, payout amount, fraud score, coherence score
- `FraudDecision` — fraud score, risk level, decision, reason
- `Payout` — amount, provider, transaction ID, status
- `PremiumQuote` — ML-generated quote with confidence range
- `ModelInferenceLog` — full audit trail of every ML call
- `AuditLog` — backend operations history
- `Notification` — SMS/push/WhatsApp delivery records

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | Firebase Authentication (OTP/phone) |
| ML Service | Python, FastAPI, scikit-learn, XGBoost, TensorFlow/Keras |
| Payments | Razorpay (UPI) |
| Deployment | Docker, Firebase Hosting / Vercel |
| i18n | English, Hindi, Tamil |

---

## What We Are Specialized to Build

Paymigo is purpose-built for the intersection of:

1. **Parametric insurance logic** — trigger evaluation, threshold detection, automated claim creation
2. **ML-powered risk pricing** — dynamic, per-worker premium calculation using real-time and historical signals
3. **Fraud-resistant payout pipelines** — multi-layer validation before any money moves
4. **Gig economy financial infrastructure** — micro-premium wallets, instant UPI disbursement, weekly policy cycles
5. **Real-time disruption monitoring** — weather, AQI, and NLP-based event detection across 1,200+ micro-zones

The platform is designed to scale from prototype to production with a microservices-ready architecture (Auth, Worker, Policy, Trigger, Claim, Fraud, Payout, Notification, Analytics, ML Gateway services) backed by an event-driven backbone.

# PayMigo - Quick Start Guide

## 🚀 System Overview

PayMigo is a production-grade AI-powered parametric insurance platform with:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Express.js + Node.js + Prisma
- **ML Services:** FastAPI + Python + TensorFlow/XGBoost
- **Database:** PostgreSQL
- **Auth:** Firebase

---

## ⚡ Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
# Backend
cd backend
npm install

# ML Service
cd ../ml-services/ML-Service
pip install -r requirements.txt
pip install -e Geotruth/

# Frontend
cd ../../Paymigo_Frontend/web
npm install
```

### Step 2: Setup Database

```bash
cd backend

# Create PostgreSQL database
createdb paymigo

# Update .env with your DATABASE_URL
# DATABASE_URL="postgresql://user:password@localhost:5432/paymigo"

# Run migrations
npx prisma generate
npx prisma migrate dev
```

### Step 3: Start All Services

```bash
# Terminal 1 - Backend (Port 3000)
cd backend
node server.js

# Terminal 2 - ML Service (Port 8000)
cd ml-services/ML-Service
uvicorn app.main:app --reload --port 8000

# Terminal 3 - Frontend (Port 5173)
cd Paymigo_Frontend/web
npm run dev
```

**Access the app:** http://localhost:5173

---

## 🔧 Configuration

### Backend Environment (.env)
```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/paymigo"
JWT_SECRET="your-secret-key-here"
FIREBASE_PROJECT_ID="paymigo-27412"
```

### Frontend Environment (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_ML_URL=http://127.0.0.1:8000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=paymigo-27412.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=paymigo-27412
VITE_FIREBASE_STORAGE_BUCKET=paymigo-27412.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 📁 Project Structure

```
PayMigo_Final/
├── backend/                    # Express.js API Gateway
│   ├── routes/                 # API endpoints
│   │   ├── auth.js            # Authentication
│   │   ├── dashboard.js       # Dashboard data
│   │   ├── pricing.js         # Pricing intelligence
│   │   ├── geotruth.js        # Claim verification
│   │   ├── fraud.js           # Fraud review
│   │   ├── analytics.js       # Risk analytics
│   │   └── ...
│   ├── lib/                   # Utilities
│   ├── middleware/            # Auth middleware
│   ├── prisma/                # Database schema
│   └── server.js              # Entry point
│
├── ml-services/ML-Service/    # FastAPI ML Gateway
│   ├── app/
│   │   ├── api/               # ML endpoints
│   │   │   ├── geotruth.py   # GeoTruth API
│   │   │   ├── fraud.py      # Fraud detection
│   │   │   ├── forecast.py   # LSTM forecaster
│   │   │   └── ...
│   │   ├── adapters/          # ML adapters
│   │   │   └── geotruth_adapter.py
│   │   ├── models/            # ML models
│   │   ├── pipelines/         # Orchestration
│   │   └── main.py            # Entry point
│   └── Geotruth/              # GeoTruth package
│       └── geotruth/
│           ├── engine.py      # Core engine
│           ├── layers/        # Detection layers
│           └── ...
│
└── Paymigo_Frontend/web/      # React Frontend
    ├── src/
    │   ├── pages/             # Page components
    │   │   ├── Dashboard.tsx
    │   │   ├── Plans.tsx
    │   │   ├── ClaimVerification.tsx
    │   │   ├── RiskAnalytics.tsx
    │   │   └── ...
    │   ├── components/        # Reusable components
    │   ├── App.tsx            # Main app + routing
    │   └── main.tsx           # Entry point
    └── ...
```

---

## 🎯 Key Features Implemented

### 1. Dynamic Pricing Intelligence
- XGBoost premium engine
- Zone risk clustering
- Loyalty discounts
- Real-time weather integration

### 2. GeoTruth Verification
- Multi-modal sensor verification
- 7-layer coherence scoring
- Mock location detection
- Behavioral baseline analysis

### 3. Fraud Detection
- XGBoost fraud classifier
- GPS spoofing detection
- Network ring detection
- 20+ feature engineering

### 4. Risk Forecasting
- LSTM 7-day predictions
- Zone-level risk scores
- Weather orchestration
- Claim volume forecasting

### 5. Admin Analytics
- Real-time dashboards
- Zone heatmaps
- Claim predictions
- Premium impact analysis

---

## 🔗 API Endpoints

### Backend (http://localhost:3000)
- `POST /auth/login` - User authentication
- `GET /dashboard/summary` - Dashboard data
- `GET /pricing/intelligence` - Pricing recommendations
- `POST /geotruth/verify` - Claim verification
- `GET /api/analytics/forecast` - Risk forecast
- `GET /api/analytics/zones` - Zone heatmap

### ML Service (http://127.0.0.1:8000)
- `POST /geotruth/verify` - GeoTruth verification
- `POST /fraud/detect` - Fraud detection
- `POST /forecast/predict` - LSTM forecast
- `POST /premium/predict` - Premium calculation
- `POST /trigger/predict` - Trigger classification
- `GET /docs` - API documentation

---

## ✅ Verification Steps

### 1. Check ML Service
```bash
curl http://127.0.0.1:8000/
# Expected: {"status": "online", "message": "PayMigo ML Service is running"}
```

### 2. Check Backend
```bash
curl http://localhost:3000/
# Expected: "Backend Running 🚀"
```

### 3. Check Frontend
- Open http://localhost:5173
- Should see landing page
- No console errors

### 4. Test GeoTruth Integration
```bash
curl -X POST http://127.0.0.1:8000/geotruth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "worker_id": "test123",
    "claimed_pincode": "600001",
    "timestamp": 1234567890,
    "cell_tower_ids": ["tower1", "tower2"]
  }'
```

### 5. Test Fraud Detection
```bash
curl -X POST http://127.0.0.1:8000/fraud/detect \
  -H "Content-Type: application/json" \
  -d '{
    "zone_risk_tier": 2.0,
    "gps_spoof_probability": 0.1
  }'
```

---

## 🐛 Troubleshooting

### ML Service Won't Start
```bash
# Check Python version (3.8+)
python --version

# Reinstall dependencies
pip install -r requirements.txt
pip install -e Geotruth/

# Check port availability
lsof -i :8000  # Unix/Mac
netstat -ano | findstr :8000  # Windows
```

### Backend Database Error
```bash
# Check PostgreSQL is running
pg_isready

# Reset database
npx prisma migrate reset
npx prisma migrate dev
```

### Frontend Build Error
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version (16+)
node --version
```

### CORS Issues
- Verify `cors()` enabled in backend/server.js
- Check VITE_API_URL in frontend/.env matches backend port

---

## 📊 System Architecture

```
┌─────────────┐
│   Frontend  │  React (Port 5173)
│   (Vite)    │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│   Backend   │  Express (Port 3000)
│  (Node.js)  │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│ ML Service  │  FastAPI (Port 8000)
│  (Python)   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Database   │  PostgreSQL
│  (Prisma)   │
└─────────────┘
```

---

## 🎓 Key Concepts

### GeoTruth
Multi-modal environmental coherence verification system that validates claims using:
- Barometric pressure
- Acoustic fingerprinting
- Network topology
- Inertial motion
- Zone coherence
- Behavioral baseline
- Social ring detection

### Parametric Insurance
Insurance that pays out automatically when predefined triggers are met (e.g., rainfall > 15mm/hr), without manual claim assessment.

### LSTM Forecasting
Long Short-Term Memory neural network that predicts 7-day risk scores based on historical weather and claim patterns.

### Dynamic Pricing
XGBoost model that calculates personalized premiums based on:
- Zone risk tier
- Worker profile
- Loyalty weeks
- Weather forecast
- Historical claims

---

## 📚 Documentation

- **System Architecture:** `SYSTEM_ARCHITECTURE.md`
- **Testing Guide:** `TESTING_CHECKLIST.md`
- **API Documentation:** http://127.0.0.1:8000/docs (when ML service running)

---

## 🚀 Next Steps

1. ✅ Complete system integration (DONE)
2. 🔄 Run comprehensive testing (NEXT)
3. 🔄 Deploy to staging environment
4. 🔄 Load testing & optimization
5. 🔄 Production deployment

---

## 💡 Tips

- Use `npm run dev` for hot reload during development
- Check browser console for frontend errors
- Monitor backend logs for API errors
- Use `/docs` endpoint to test ML APIs interactively
- Keep all 3 services running simultaneously

---

**Status:** ✅ System fully integrated and ready for testing

**Support:** Check `TESTING_CHECKLIST.md` for detailed test cases

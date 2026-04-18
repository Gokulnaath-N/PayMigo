# NLP Alert System Implementation - Test Guide

## Overview
The Curfew NLP Alert System has been successfully implemented with the following components:

## ✅ Completed Components

### 1. Database Layer
- **NLPEvent Model**: Added to `schema.prisma` with fields for text, label, confidence, source, zone, status, and timestamps
- **Status**: Ready for migration

### 2. Backend API Layer
- **nlp.js**: Complete REST API with endpoints:
  - `POST /api/nlp/process-headlines` - Process headlines from ML service
  - `GET /api/nlp/alerts` - Fetch active alerts with filtering
  - `POST /api/nlp/convert-to-trigger` - Convert alert to system trigger
  - `POST /api/nlp/ignore-alert` - Mark alert as ignored
  - `GET /api/nlp/stats` - Get NLP statistics
  - `DELETE /api/nlp/clear-old` - Clean up old alerts
- **Integration**: Added to `server.js` with authentication middleware

### 3. ML Service Layer
- **curfew.py**: Enhanced with new endpoints:
  - `POST /predict` - Single headline prediction
  - `POST /predict-batch` - Batch headline processing
  - `GET /simulate-news` - Synthetic news generation for testing
  - `POST /process-headlines` - Backend-compatible processing
  - `GET /health` - Health check endpoint
- **Features**: City-to-zone mapping, confidence scoring, synthetic headline generation

### 4. Admin Command Center
- **AlertsPage.tsx**: Full admin interface with:
  - Real-time alerts feed with filtering
  - Alert details panel with confidence visualization
  - Action buttons for "Escalate to Trigger" and "Ignore"
  - Statistics dashboard
  - Manual headline processing
  - Zone and status filtering

### 5. Admin Navigation
- **AdminSidebar.tsx**: Added "NLP Alerts" navigation item with Bell icon

### 6. Worker Integration
- **CurfewBanner.tsx**: Alert banner component with:
  - Real-time alert fetching (every 60 seconds)
  - Zone-specific filtering
  - Color-coded alerts (Red for curfew, Orange for strike)
  - Dismiss functionality
  - Pulsing animation for visibility
  - Responsive design

### 7. Dashboard Integration
- **Dashboard.tsx**: Integrated CurfewBanner with user zone context
- **App.tsx**: Added `/admin/alerts` route

## 🧪 Testing Instructions

### Prerequisites
1. Apply database migration:
   ```bash
   cd backend
   npx prisma db push
   ```

2. Start backend server:
   ```bash
   cd backend
   npm start
   ```

3. Start ML service:
   ```bash
   cd ml-services/ML-Service
   python -m app.main
   ```

### Test Scenarios

#### 1. Admin Alert Processing
1. Navigate to `/admin/alerts`
2. Click "Process Headlines" to fetch synthetic news
3. Verify alerts appear in the feed
4. Check statistics update
5. Select an alert to view details
6. Test "Escalate to Trigger" functionality
7. Test "Ignore Alert" functionality

#### 2. Worker Alert Display
1. Ensure worker has zone assigned in database
2. Navigate to `/dashboard`
3. CurfewBanner should appear if active alerts exist for worker's zone
4. Test dismiss functionality
5. Verify banner auto-refreshes

#### 3. ML Service Integration
1. Test `GET /curfew/simulate-news` endpoint
2. Verify synthetic headlines are generated
3. Test `POST /curfew/process-headlines` endpoint
4. Verify classification confidence scores

#### 4. End-to-End Flow
1. Process headlines from admin panel
2. Convert alert to system trigger
3. Verify trigger appears in system
4. Check worker dashboard for alert banner
5. Test payout eligibility changes

## 🔧 Configuration

### City-to-Zone Mapping
```javascript
const CITY_ZONE_MAP = {
  'chennai': 'chennai-central',
  'mumbai': 'mumbai-western',
  'delhi': 'delhi-ncr',
  'bangalore': 'bangalore-electronic-city',
  'hyderabad': 'hyderabad-hitech-city',
  'kolkata': 'kolkata-salt-lake',
  'pune': 'pune-hinjewadi',
  'ahmedabad': 'ahmedabad-gandhinagar',
  'jaipur': 'jaipur-mansarovar',
  'lucknow': 'lucknow-gomti-nagar'
};
```

### Alert Classification
- **Curfew**: Red banner, high priority
- **Strike**: Orange banner, medium priority
- **Normal**: No banner displayed

### Confidence Thresholds
- **Storage**: > 0.7 confidence
- **Trigger Conversion**: > 0.8 confidence (configurable)

## 🚀 Deployment Notes

1. **Database Migration**: Run `npx prisma db push` in production
2. **Environment Variables**: Ensure ML service URL is accessible
3. **Authentication**: NLP endpoints require valid JWT token
4. **Monitoring**: Set up alerts for ML service health checks

## 📊 Performance Considerations

- **Auto-refresh**: Worker banner refreshes every 60 seconds
- **Batch Processing**: Admin processes headlines in batches
- **Cleanup**: Old alerts automatically cleared after 7 days
- **Caching**: Statistics cached for 5 minutes

## 🔍 Troubleshooting

### Common Issues
1. **ML Service Connection**: Ensure port 8000 is accessible
2. **Database Sync**: Run migration if NLPEvent table doesn't exist
3. **Authentication**: Verify JWT tokens are valid
4. **Zone Mapping**: Check city names match zone mapping

### Debug Commands
```bash
# Check ML service health
curl http://localhost:8000/curfew/health

# Test backend NLP endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/nlp/stats
```

## ✅ Verification Checklist

- [ ] Database migration applied
- [ ] Backend server running on port 3000
- [ ] ML service running on port 8000
- [ ] Admin can process headlines
- [ ] Alerts appear in admin feed
- [ ] Worker sees alert banner for their zone
- [ ] Alert conversion to trigger works
- [ ] Statistics dashboard updates correctly
- [ ] Auto-refresh functionality working

The NLP Alert System is now fully implemented and ready for testing!

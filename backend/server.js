import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import workerRoutes from "./routes/worker.js";
import premiumRoutes from "./routes/premium.js";
import authRoutes from "./routes/auth.js";
import triggerRoutes from "./routes/triggers.js";
import aiRoutes from "./routes/ai.js";
import weatherRoutes from "./routes/weather.js";
import payoutRoutes from "./routes/payouts.js";
import orchestratorRoutes from "./routes/orchestrator.js";
import pricingRoutes from "./routes/pricing.js";
import geotruthRoutes from "./routes/geotruth.js";
import fraudRoutes from "./routes/fraud.js";
import analyticsRoutes from "./routes/analytics.js";
import dashboardRoutes from "./routes/dashboard.js";
import paymentRoutes from "./routes/payment.js";
import fraudMockRoutes from "./routes/fraud-mock.js";
import walletRoutes from "./routes/wallet.js";
import nlpRoutes from "./routes/nlp.js";
import { requireAuth } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/workers", requireAuth, workerRoutes);
app.use("/premium", requireAuth, premiumRoutes);
app.use("/api/triggers", triggerRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/payouts", payoutRoutes);
app.use("/api/trigger", orchestratorRoutes);
app.use("/pricing", pricingRoutes);
app.use("/geotruth", requireAuth, geotruthRoutes);
app.use("/fraud", requireAuth, fraudRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/dashboard", requireAuth, dashboardRoutes);
app.use("/payment", paymentRoutes);
app.use("/fraud-mock", fraudMockRoutes);
app.use("/wallet", walletRoutes);
app.use("/api/nlp", requireAuth, nlpRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

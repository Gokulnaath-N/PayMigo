import express from "express";
import prisma from "../lib/prisma.js";
import axios from "axios";

const router = express.Router();

// GET /api/weather/live/{zone_id}
router.get("/live/:zone_id", async (req, res) => {
  const { zone_id } = req.params;
  try {
    const zone = await prisma.zone.findUnique({ where: { id: zone_id } });
    if (!zone) return res.status(404).json({ error: "Zone not found" });

    // Directly call the Python ML backend Pipeline
    const mlResponse = await axios.get(`http://127.0.0.1:8000/orchestrator/pipeline/weather/live/${zone_id}`);
    
    // Create Weather Event directly from backend Orchestrator output
    const event = await prisma.weatherEvent.create({
      data: {
        zoneId: zone.id,
        weatherType: mlResponse.data.weather_type || "UNKNOWN",
        intensity: mlResponse.data.intensity || 0.0,
        confidenceScore: mlResponse.data.confidence || 1.0,
      }
    });

    res.json({ event, live_data: mlResponse.data });
  } catch (error) {
    console.error("Live weather fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch live weather" });
  }
});

// GET /api/weather/user/{user_id}
router.get("/user/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: user_id },
      include: { userLocation: true }
    });
    
    if (!worker) return res.status(404).json({ error: "User not found" });

    const payload = {
      user_id,
      gps_coordinates: worker.userLocation?.gpsCoordinates || null,
      zone_id: worker.zoneId
    };

    const mlResponse = await axios.post(`http://127.0.0.1:8000/orchestrator/pipeline/weather/user`, payload);
    
    res.json(mlResponse.data);
  } catch (error) {
    console.error("User weather fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch user localized weather" });
  }
});

export default router;

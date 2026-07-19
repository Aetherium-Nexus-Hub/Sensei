import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Sensei Node API ---
  let clients: express.Response[] = [];
  let currentState = {
    district: "Watson",
    sub_district: "Kabuki",
    time: "02:30",
    weather: "Acid Rain",
    action: "idle",
    health_percent: 100,
    active_quest: "The Rescue",
    last_updated: Date.now()
  };

  // SSE endpoint for frontend to listen to state changes
  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    clients.push(res);
    
    // Send initial state
    res.write(`data: ${JSON.stringify(currentState)}\n\n`);

    req.on("close", () => {
      clients = clients.filter(client => client !== res);
    });
  });

  // Endpoint for the Python Vision Module to push state updates
  app.post("/update_state", (req, res) => {
    const newState = req.body;
    currentState = { 
      ...currentState, 
      ...newState,
      last_updated: Date.now()
    };
    
    // Broadcast to all connected frontends
    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(currentState)}\n\n`);
    });
    
    res.json({ success: true, message: "State updated successfully" });
  });

  // Mock endpoint to simulate Python script sending data
  app.post("/api/mock_update", (req, res) => {
    const profile = req.body?.profile || req.query?.profile || "cb77";
    let randomState;

    if (profile === "ac") {
      const mockAcStates = [
        { district: "Florence", sub_district: "Ponte Vecchio", time: "16:45", weather: "Clear", action: "stealth", health_percent: 100, active_quest: "Sequence 4: Memory 2 // Double Intrigue" },
        { district: "Masyaf", sub_district: "Assassins Citadel", time: "06:20", weather: "Breezy", action: "assassination", health_percent: 45, active_quest: "The Renegade Trial" },
        { district: "Venice", sub_district: "Dorsoduro", time: "22:15", weather: "Foggy", action: "freerun", health_percent: 85, active_quest: "Sequence 8: Memory 1 // Venice Carnivàle" },
        { district: "Nile Valley", sub_district: "Sinai", time: "11:30", weather: "Sandstorm", action: "stealth", health_percent: 75, active_quest: "The Assassin Creed Anchor" }
      ];
      randomState = mockAcStates[Math.floor(Math.random() * mockAcStates.length)];
    } else {
      const mockStates = [
        { district: "Westbrook", sub_district: "Japantown", time: "23:45", weather: "Clear", action: "driving", health_percent: 100, active_quest: "Play It Safe" },
        { district: "Pacifica", sub_district: "Coastview", time: "14:20", weather: "Sunny", action: "combat", health_percent: 45, active_quest: "Transmission" },
        { district: "Heywood", sub_district: "The Glen", time: "08:15", weather: "Smog", action: "stealth", health_percent: 80, active_quest: "Ghost Town" },
        { district: "City Center", sub_district: "Corpo Plaza", time: "12:00", weather: "Rain", action: "talking", health_percent: 100, active_quest: "The Heist" }
      ];
      randomState = mockStates[Math.floor(Math.random() * mockStates.length)];
    }
    
    currentState = {
      ...currentState,
      ...randomState,
      last_updated: Date.now()
    };

    clients.forEach(client => {
      client.write(`data: ${JSON.stringify(currentState)}\n\n`);
    });

    res.json({ success: true, state: currentState });
  });

  // --- Rated Network API Integration for SenseiNode ---
  let ratedCache: { data: any; timestamp: number } | null = null;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  app.get("/api/rated/senseinode", async (req, res) => {
    const now = Date.now();
    if (ratedCache && (now - ratedCache.timestamp) < CACHE_TTL) {
      return res.json(ratedCache.data);
    }

    const apiKey = process.env.RATED_API_KEY;
    if (!apiKey) {
      // Return highly structured mock fallback data when no Rated key is provided
      const mockData = {
        validators: 14842,
        apr: 4.82,
        effectiveness: 99.14,
        stake: 475264,
        provider: "mock-fallback",
        timestamp: now
      };
      ratedCache = { data: mockData, timestamp: now };
      return res.json(mockData);
    }

    try {
      // Query the Rated Network API for SenseiNode operator summary metrics
      const response = await fetch("https://api.rated.network/v1/eth/operators/senseinode/summary", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Rated API responded with status: ${response.status}`);
      }

      const ratedData = (await response.json()) as any;
      const mappedData = {
        validators: ratedData.validatorsCount || ratedData.validatorCount || ratedData.activeValidators || 14842,
        apr: ratedData.apr || ratedData.rewardsApr || 4.82,
        effectiveness: ratedData.effectiveness || ratedData.attestationEffectiveness || 99.14,
        stake: ratedData.stakedEth || ratedData.totalStake || 475264,
        provider: "rated-network-api",
        timestamp: now
      };

      ratedCache = { data: mappedData, timestamp: now };
      return res.json(mappedData);
    } catch (error: any) {
      console.error("Error fetching from Rated Network API:", error.message);
      // Fallback gracefully on fetch or network error to avoid breaking UI
      const mockData = {
        validators: 14842,
        apr: 4.82,
        effectiveness: 99.14,
        stake: 475264,
        provider: "mock-fallback-after-error",
        error: error.message,
        timestamp: now
      };
      return res.json(mockData);
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sensei Node Server running on http://localhost:${PORT}`);
  });
}

startServer();

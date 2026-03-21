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
    const mockStates = [
      { district: "Westbrook", sub_district: "Japantown", time: "23:45", weather: "Clear", action: "driving", health_percent: 100, active_quest: "Play It Safe" },
      { district: "Pacifica", sub_district: "Coastview", time: "14:20", weather: "Sunny", action: "combat", health_percent: 45, active_quest: "Transmission" },
      { district: "Heywood", sub_district: "The Glen", time: "08:15", weather: "Smog", action: "stealth", health_percent: 80, active_quest: "Ghost Town" },
      { district: "City Center", sub_district: "Corpo Plaza", time: "12:00", weather: "Rain", action: "talking", health_percent: 100, active_quest: "The Heist" }
    ];
    const randomState = mockStates[Math.floor(Math.random() * mockStates.length)];
    
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

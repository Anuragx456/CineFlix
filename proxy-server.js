const http = require("http");
const https = require("https");
const fs = require("fs");

// Read API key from .env file
const envContent = fs.readFileSync(".env", "utf8");
const API_KEY = envContent.split("=").slice(1).join("=").trim();

const PORT = 3001;

const server = http.createServer((req, res) => {
  // Allow all origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Forward the exact request path to TMDB
  const tmdbUrl = `https://api.themoviedb.org/3${req.url}`;
  console.log(`[Proxy] ${req.method} ${req.url} → ${tmdbUrl}`);

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
  };

  const proxyReq = https.request(tmdbUrl, options, (proxyRes) => {
    let data = "";
    proxyRes.on("data", (chunk) => (data += chunk));
    proxyRes.on("end", () => {
      console.log(`[Proxy] Response: ${proxyRes.statusCode}`);
      res.writeHead(proxyRes.statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(data);
    });
  });

  proxyReq.on("error", (err) => {
    console.error(`[Proxy] Error: ${err.message}`);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  });

  proxyReq.end();
});

server.listen(PORT, "0.0.0.0", () => {
  const interfaces = require("os").networkInterfaces();
  const addresses = Object.values(interfaces)
    .flat()
    .filter((i) => i.family === "IPv4" && !i.internal)
    .map((i) => i.address);

  console.log(`\n✅ TMDB Proxy Server running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  addresses.forEach((addr) => {
    console.log(`   Network: http://${addr}:${PORT}`);
  });
  console.log(
    `\nAll requests to this server are forwarded to api.themoviedb.org\n`,
  );
});

import makeDebug from "debug";
import fs from "fs";
import http from "http";
import https from "https";
import { IConfig } from "./config";

const debug = makeDebug("liz-socket");

export function create(config: IConfig) {
  return config.tls.use ? createHttpsServer(config) : createHttpServer();
}

function createHttpsServer(config: IConfig) {
  debug("setting up HTTPS server");

  if (config.tls.certPath !== undefined && config.tls.keyPath !== undefined) {
    const httpsOptions = {
      cert: fs.readFileSync(config.tls.certPath),
      key: fs.readFileSync(config.tls.keyPath)
    };

    return https.createServer(httpsOptions, healthcheck);
  } else {
    throw new Error("tls.certPath or tls.keyPath undefined");
  }
}

function createHttpServer() {
  debug("setting up HTTP server");

  return http.createServer(healthcheck);
}

function healthcheck(req: http.IncomingMessage, res: http.ServerResponse) {
  if (req.url === "/health" && req.method === "GET") {
    debug("processing /health request");

    res.writeHead(200);
    res.end(JSON.stringify({ status: "online" }));
  }
}

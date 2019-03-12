import { Action, IMakeBus, makeUpdater } from "@neezer/liz";
import makeDebug from "debug";
import EventEmitter from "events";
import nanoid from "nanoid";
import net from "net";
import { equals, reject } from "ramda";
import WebSocket from "ws";
import { handle as handleBanners } from "./banner";
import { Broadcast, handle as handleBroadcasts } from "./broadcast";
import { handle as handleClose } from "./close";
import { IConfig } from "./config";
import { create as createHttp } from "./http";
import { handle as handleMessages } from "./message";
import { handle as handleReplies } from "./reply";

// from ws
export interface IClose {
  code: number;
  reason: string;
}

type Banners = Action[];
type WebSocketServer = WebSocket.Server & { broadcast: Broadcast };

const debug = makeDebug("liz-socket");

export function create(bus: IMakeBus, config: IConfig) {
  const status = new EventEmitter();
  const { emit, stream } = bus;
  const server = createHttp(config);

  let banners: Banners = [];
  let openConnections: net.Socket[] = [];

  const setBanners = (newBanners: Banners) => (banners = newBanners);

  server.on("connection", socket => {
    openConnections.push(socket);

    socket.on("close", () => {
      openConnections = reject(equals(socket), openConnections);
    });
  });

  const wss = new WebSocket.Server({ server }) as WebSocketServer;
  const broadcast = makeBroadcast(wss);

  wss.on("connection", (socket, request) => {
    debug("websocket connection established");

    const connectionId = nanoid();
    const close = makeUpdater<IClose>();

    let { origin } = request.headers;

    if (typeof origin !== "string") {
      origin = undefined;
    }

    const handle = {
      close: handleClose(close.emit),
      error: handleError(status),
      message: handleMessages(config, socket, connectionId, emit, origin),
      replies: handleReplies(config, socket, stream, close.stream, connectionId)
    };

    sendBanners(banners, socket);
    handle.replies();

    socket.on("message", handle.message);
    socket.on("close", handle.close);
    socket.on("error", handle.error);
  });

  handleBroadcasts(config, stream, broadcast);
  handleBanners(config, stream, banners, setBanners);

  server.listen(config.port, () => {
    status.emit(
      "online",
      `server listening for connections on :${config.port}`
    );
  });

  status.on("shutdown", () => {
    openConnections.forEach((socket: net.Socket) => {
      socket.destroy();
    });

    server.close(() => {
      status.emit("closed");
    });
  });

  return status;
}

function sendBanners(banners: Banners, socket: WebSocket) {
  banners.forEach(banner => {
    banner.slim = true;

    socket.send(JSON.stringify(banner));
  });
}

function makeBroadcast(server: WebSocketServer) {
  return (action: Action) => {
    debug("broadcasting message to all connected clients");

    server.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(action));
      }
    });
  };
}

function handleError(emitter: EventEmitter) {
  return (error: Error) => {
    emitter.emit("error", error);
  };
}

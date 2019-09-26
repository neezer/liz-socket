import { augment } from "@neezer/action";
import { Action, Emit, makeAction } from "@neezer/liz";
import makeDebug from "debug";
import nanoid from "nanoid";
import WebSocket from "ws";
import { IConfig } from "./config";

const debug = makeDebug("liz-socket");

export function handle(
  config: IConfig,
  socket: WebSocket,
  connectionId: string,
  emit: Emit<Action>,
  origin: string | undefined
) {
  return (data: WebSocket.Data) => {
    try {
      sendToBus(config, data, emit, connectionId, origin);
    } catch (error) {
      socket.emit("error", error);
    }
  };
}

function sendToBus(
  config: IConfig,
  data: WebSocket.Data,
  emit: Emit<Action>,
  connectionId: string,
  origin: string | undefined
) {
  const message = parse(data);

  if (!message.type) {
    return;
  }

  const action = makeAction(config.appId)(
    message.type,
    message.payload,
    message.meta
  );

  const enhancedMessage = augment(action, {
    connectionId,
    correlationId: action.meta.correlationId || nanoid(),
    origin
  });

  debug("received message from connected client type=%s", action.type);
  emit(enhancedMessage);
}

function parse(data: WebSocket.Data) {
  try {
    return JSON.parse(data.toString());
  } catch (error) {
    throw new Error("message not JSON");
  }
}

import { Action, Emit, makeAction } from "@neezer/liz";
import makeDebug from "debug";
import nanoid from "nanoid";
import { lensPath, pipe, set, view } from "ramda";
import WebSocket from "ws";
import { IConfig } from "./config";

const debug = makeDebug("liz-socket");
const connectionIdLens = lensPath(["meta", "connectionId"]);
const correlationIdLens = lensPath(["meta", "correlationId"]);

export function handle(
  config: IConfig,
  socket: WebSocket,
  connectionId: string,
  emit: Emit
) {
  return (data: WebSocket.Data) => {
    try {
      sendToBus(config, data, emit, connectionId);
    } catch (error) {
      socket.emit("error", error);
    }
  };
}

function sendToBus(
  config: IConfig,
  data: WebSocket.Data,
  emit: Emit,
  connectionId: string
) {
  const message = parse(data);

  const action = makeAction(config.appId)(
    message.type,
    message.payload,
    message.meta
  );

  const enhancedMessage = pipe(
    assignConnectionId(connectionId),
    assignCorrelationId()
  )(action);

  debug("received message from connected client type=%s", action.type);

  emit(enhancedMessage);
}

function assignConnectionId(connectionId: string) {
  return (action: Action) => {
    return set(connectionIdLens, connectionId, action);
  };
}

function assignCorrelationId() {
  return (action: Action) => {
    const hasCorrelationId = view(correlationIdLens, action) !== undefined;

    if (hasCorrelationId) {
      return action;
    }

    return set(correlationIdLens, nanoid(), action);
  };
}

function parse(data: WebSocket.Data) {
  try {
    return JSON.parse(data.toString());
  } catch (error) {
    throw new Error("message not JSON");
  }
}

import { runEffects, tap, until } from "@most/core";
import { newDefaultScheduler } from "@most/scheduler";
import { Stream } from "@most/types";
import { Action, ActionStream, combinators } from "@neezer/liz";
import makeDebug from "debug";
import WebSocket from "ws";
import { IClose } from ".";
import { IConfig } from "./config";

const debug = makeDebug("liz-socket");

export function handle(
  config: IConfig,
  socket: WebSocket,
  stream: ActionStream,
  closeStream: Stream<IClose>,
  connectionId: string
) {
  return () => {
    const effect = (action: Action) => {
      debug("received message to sent to client type=%s", action.type);

      action.slim = true;

      socket.send(JSON.stringify(action));
    };

    const replies = combinators.matching(config.replyPrefix, stream);
    const enhanced = combinators.withConnectionId(connectionId, replies);
    const shifted = combinators.shiftType(enhanced);
    const effects = tap(effect, shifted);
    const limitedEffects = until(closeStream, effects);

    runEffects(limitedEffects, newDefaultScheduler());
  };
}

import { runEffects, tap } from "@most/core";
import { newDefaultScheduler } from "@most/scheduler";
import { Action, ActionStream, combinators } from "@neezer/liz";
import { IConfig } from "./config";

export type Broadcast = (action: Action) => void;

export function handle(
  config: IConfig,
  stream: ActionStream,
  broadcast: Broadcast
) {
  const effect = (action: Action) => {
    action.slim = true;

    broadcast(action);
  };

  const broadcasts = combinators.matching(config.broadcastPrefix, stream);
  const shifted = combinators.shiftType(broadcasts);
  const effects = tap(effect, shifted);

  runEffects(effects, newDefaultScheduler());
}

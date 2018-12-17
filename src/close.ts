import { Emit } from "@neezer/liz";
import makeDebug from "debug";

const debug = makeDebug("liz-socket");

export function handle(emit: Emit) {
  return (code: number, reason: string) => {
    debug("connection closed");

    emit({ code, reason });
  };
}

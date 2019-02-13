import { Emit } from "@neezer/liz";
import makeDebug from "debug";

const debug = makeDebug("liz-socket");

interface IClose {
  code: number;
  reason: string;
}

export function handle(emit: Emit<IClose>) {
  return (code: number, reason: string) => {
    debug("connection closed");

    emit({ code, reason });
  };
}

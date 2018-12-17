import { runEffects, tap } from "@most/core";
import { newDefaultScheduler } from "@most/scheduler";
import { Action, ActionStream, combinators } from "@neezer/liz";
import makeDebug from "debug";
import { append, findIndex, lensIndex, propEq, set } from "ramda";
import { IConfig } from "./config";

const debug = makeDebug("liz-socket");

type SetBanners = (actions: Action[]) => void;

export function handle(
  config: IConfig,
  stream: ActionStream,
  bannerStore: Action[],
  setBanners: SetBanners
) {
  const storeBanner = (action: Action) => {
    debug("setting a banner");

    const existingIndex = findIndex(propEq(action.type, "type"), bannerStore);
    const existingLens = lensIndex(existingIndex);

    if (existingIndex === -1) {
      setBanners(append(action, bannerStore));
    } else {
      setBanners(set(existingLens, action, bannerStore));
    }
  };

  const banners = combinators.matching(config.bannerPrefix, stream);
  const shifted = combinators.shiftType(banners);
  const effects = tap(storeBanner, shifted);

  runEffects(effects, newDefaultScheduler());
}

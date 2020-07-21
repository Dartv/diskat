import { Collection } from 'discord.js';

import type { Context, Middleware } from '../types';

export interface Cooldown {
  startAt: number;
  usages: number;
  timeout: NodeJS.Timeout;
}

export interface Config {
  userId?: string;
  // amount of times the command can be used in the given time period
  max: number;
  // amount of time cooldown lasts, in seconds
  window: number;
  // callback to trigger when cooldown is activated
  onCooldown?: (cooldown: Cooldown, next: (context: unknown) => unknown) => unknown;
}

export const withCooldown = <T extends Context>(
  config: (context: T) => Promise<Config>,
): Middleware<T> => {
  const cooldowns: Collection<string, Cooldown> = new Collection();

  return async (next, context) => {
    const {
      max,
      window,
      userId = context.message.author.id,
      onCooldown = () => false,
    } = await config(context);

    if (!userId) {
      return next(context);
    }

    const cooldown = cooldowns.get(userId);

    if (cooldown && cooldown.usages >= max) {
      return onCooldown(cooldown, next);
    }

    const response = await next(context);

    if (!cooldown) {
      cooldowns.set(userId, {
        startAt: Date.now(),
        usages: 1,
        timeout: context.client.setTimeout(() => {
          cooldowns.delete(userId);
        }, window * 1000),
      });
    } else {
      cooldown.usages++;
    }

    return response;
  };
};

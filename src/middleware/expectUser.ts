import { User } from 'discord.js';

import { Middleware, Context } from '../types';

export const expectUser = <T extends Context>(
  config: string[] | ((context: T) => Promise<{ identifiers: string[]; user?: User }>)
): Middleware<T> => async (next, context) => {
  const {
    identifiers,
    user = context.message.author,
  } = typeof config === 'function' ? await config(context) : { identifiers: config };

  if (!user) {
    return next(context);
  }

  const ids = new Set(identifiers);
  const { id, username, discriminator } = user;

  return ids.has(id) || ids.has(`${username}#${discriminator}`) && next(context);
};

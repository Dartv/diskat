import { GuildMember } from 'discord.js';

import { Context, Middleware } from '../types';

export const expectRole = <T extends Context>(
  config: string[] | ((context: T) => Promise<{ roles: string[]; member?: GuildMember }>),
): Middleware<T> => async (next, context) => {
  const {
    roles,
    member = context.message.member,
  } = typeof config === 'function' ? await config(context) : { roles: config };

  if (!member) {
    return next(context);
  }

  const ok = roles.some(
    (identifier) => member.roles.cache.find((role) => role.name === identifier || role.id === identifier)
  );

  return ok && next(context);
};

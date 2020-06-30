import { PermissionString, GuildMember } from 'discord.js';

import { Middleware, Context } from '../types';

export const expectPermissions = <T extends Context>(
  config: PermissionString[] | ((context: T) => Promise<{ permissions: PermissionString[], member?: GuildMember }>)
): Middleware<T> => async (next, context) => {
  const {
    permissions,
    member = context.message.member,
  } = typeof config === 'function' ? await config(context) : { permissions: config };

  if (!member) {
    return next(context);
  }

  const ok = permissions.every((permission) => member.hasPermission(permission));

  return ok && next(context);
};

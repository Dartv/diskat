import { PermissionString } from 'discord.js';
import { Middleware, Context } from '../types';

export const expectPermissions = <T extends Context>(
  config: PermissionString[] | ((context: T) => Promise<PermissionString[]>)
): Middleware<T> => async (next, context) => {
  const { message: { member } } = context;

  if (!member) {
    return next(context);
  }

  const permissions = typeof config === 'function' ? await config(context) : config;
  const ok = permissions.every((permission) => member.hasPermission(permission));

  return ok && next(context);
};

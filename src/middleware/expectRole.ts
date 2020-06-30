import { Context, Middleware } from '../types';

export const expectRole = <T extends Context>(
  config: string[] | ((context: T) => Promise<string[]>),
): Middleware<T> => async (next, context) => {
  const { message: { member } } = context;

  if (!member) {
    return next(context);
  }

  const roles = typeof config === 'function' ? await config(context) : config;

  const ok = roles.some(
    (identifier) => member.roles.cache.find((role) => role.name === identifier || role.id === identifier)
  );

  return ok && next(context);
};

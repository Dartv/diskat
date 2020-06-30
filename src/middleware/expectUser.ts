import { Middleware, Context } from '../types';

export const expectUser = <T extends Context>(
  config: string[] | ((context: T) => Promise<string[]>)
): Middleware<T> => async (next, context) => {
  const {
    message: {
      author: {
        id,
        username,
        discriminator,
      },
    },
  } = context;

  const identifiers = new Set(
    typeof config === 'function' ? await config(context) : config
  );

  return identifiers.has(id) || identifiers.has(`${username}#${discriminator}`) && next(context);
};

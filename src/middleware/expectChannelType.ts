import { Middleware } from '../types';

export const expectChannelType = (config: { type: keyof typeof ChannelType }): Middleware => async (next, context) => {
  const { message: { channel } } = context;

  return channel.type === config.type && next(context);
};

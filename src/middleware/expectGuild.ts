import type { Middleware } from '../types';
import { expectChannelType } from './expectChannelType';

export const expectGuild = (): Middleware => expectChannelType({ type: 'text' });

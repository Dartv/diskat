import type { Middleware } from '../types';
import { expectChannelType } from './expectChannelType';

export const expectDM = (): Middleware => expectChannelType({ type: 'dm' });

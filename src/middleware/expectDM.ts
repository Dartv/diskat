import { expectChannelType } from './expectChannelType';
import { Middleware } from '../types';

export const expectDM = (): Middleware => expectChannelType({ type: 'dm' });

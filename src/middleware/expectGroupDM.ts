import { Middleware } from '../types';
import { expectChannelType } from './expectChannelType';

export const expectGroupDM = (): Middleware => expectChannelType({ type: 'group' });

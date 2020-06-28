import { Message } from 'discord.js';

import { PrefixFilter } from './PrefixFilter';

export type DeferredFilterFunction = (message: Message) => Promise<boolean | RegExp>;

export class DeferredFilter extends PrefixFilter<
  DeferredFilterFunction,
  Promise<boolean | RegExp>
> {
  constructor(filter: DeferredFilterFunction) {
    super(filter);
  }

  async test(message: Message): Promise<boolean | RegExp> {
    return this.filter(message);
  }
}

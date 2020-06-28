import { Message } from 'discord.js';

import { PrefixFilter } from './PrefixFilter';

export class RegexFilter extends PrefixFilter<RegExp, boolean> {
  constructor(filter: RegExp) {
    super(filter);
  }

  test(message: Message): boolean {
    return this.filter.test(message.content);
  }
}

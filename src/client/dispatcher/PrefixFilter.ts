import { Message } from 'discord.js';

export abstract class PrefixFilter<T, U> {
  constructor(public filter: T) {}

  abstract test(message: Message): U;
}

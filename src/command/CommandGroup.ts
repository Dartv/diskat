import { EventEmitter } from 'events';
import { Collection } from 'discord.js';

import type { CommandObject } from './CommandObject';
import type { Middleware, TypedEventEmitter, CommandGroupEvents, Context } from '../types';

export class CommandGroup<
  T extends CommandObject<Context, unknown>
> extends (EventEmitter as new () => TypedEventEmitter<CommandGroupEvents>) {
  name: string;
  commands: Collection<string, T>;
  middleware: Middleware[];

  constructor(name: string) {
    super();

    this.name = name;
    this.commands = new Collection();
    this.middleware = [];
  }

  add(command: T): this {
    const { name } = command;

    this.commands.set(name, command);
    command.linkGroup(this);

    return this;
  }

  applyMiddleware(...middlewares: Middleware[]): boolean {
    this.middleware = [...middlewares, ...this.middleware];

    return this.emit('middlewareUpdate', this.middleware);
  }
}

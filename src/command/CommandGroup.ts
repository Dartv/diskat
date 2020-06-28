import { EventEmitter } from 'events';
import { Collection } from 'discord.js';

import { Command } from './Command';
import { Middleware, TypedEventEmitter, CommandGroupEvents } from '../types';

export class CommandGroup extends (EventEmitter as new () => TypedEventEmitter<CommandGroupEvents>) {
  name: string;
  commands: Collection<string, Command>;
  middleware: Middleware[];

  constructor(name: string) {
    super();

    this.name = name;
    this.commands = new Collection();
    this.middleware = [];
  }

  add(command: Command): this {
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

import { Collection } from 'discord.js';

import type { Middleware, CommandConfigurator, Context, CommandOptions } from '../types';
import type { Client } from '../client/Client';
import { Command } from './Command';
import { CommandError } from '../errors/CommandError';
import { CommandGroup } from './CommandGroup';

export class CommandRegistry<
  T extends Command<Context, unknown> = Command<Context, unknown>,
  C extends Client = Client
> extends Collection<string, T> {
  aliases: Collection<string, string> = new Collection();
  groups: Collection<string, CommandGroup<T>> = new Collection();
  client: C;

  constructor(client: C, entries?: ReadonlyArray<readonly [string, T]> | null) {
    super(entries);

    this.client = client;
  }

  add(configurator: CommandConfigurator<CommandOptions<Extract<T, Context>, unknown>, C>): this {
    this.addCommand(new Command(configurator(this.client)) as T);

    return this;
  }

  get(identifier: string): T | undefined {
    const name = this.getMainName(identifier);

    if (name) {
      return super.get(name);
    }
  }

  delete(identifier: string): boolean {
    const name = this.getMainName(identifier);

    if (name) {
      this.aliases
        .filter((value) => name === value)
        .forEach((value, alias) => this.aliases.delete(alias));
      this.groups
        .filter((group) => group.commands.size === 1 && !!group.commands.get(name))
        .forEach((group, key) => this.groups.delete(key));
      return super.delete(name);
    }

    return false;
  }

  applyGroupMiddleware(group: string, middlewares: Middleware[]): this {
    const commandGroup = this.groups.get(group);

    if (!commandGroup) {
      throw new CommandError(`Attempted to apply middleware to non-existent command group: ${group}`);
    }

    commandGroup.applyMiddleware(...middlewares);

    return this;
  }

  addCommand(command: T): this {
    if (this.has(command.name)) {
      throw new CommandError(`Attempting to add duplicate command: "${command.name}"`);
    }

    const { name, aliases, group } = command;

    this.set(name, command);
    this.alias(name, aliases);

    if (group) {
      if (!this.groups.has(group)) {
        this.groups.set(group, new CommandGroup(group));
      }

      this.groups.get(group)?.add(command);
    }

    return this;
  }

  getMainName(identifier: string): string | undefined {
    return this.has(identifier) ? identifier : this.aliases.get(identifier);
  }

  alias(name: string, aliases: string[]): this {
    aliases.forEach((alias) => {
      if (!this.has(name)) {
        throw new CommandError(`Attempting to add alias to non-existent command "${name}"`);
      }

      if (this.aliases.has(alias)) {
        throw new CommandError(`Attempting to add duplicate alias "${alias}" to command "${name}"`);
      }

      this.aliases.set(alias, name);
    });

    return this;
  }
}

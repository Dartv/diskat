import { Collection } from 'discord.js';

import { Command } from './Command';
import { CommandError } from '../errors/CommandError';
import { CommandGroup } from './CommandGroup';
import { Middleware, CommandOptions } from '../types';


export class CommandRegistry {
  commands: Collection<string, Command>;
  aliases: Collection<string, string>;
  groups: Collection<string, CommandGroup>;

  constructor() {
    this.commands = new Collection();
    this.aliases = new Collection();
    this.groups = new Collection();
  }

  add(...configurators: Array<(x: Record<string, unknown>) => CommandOptions>): this {
    configurators.map(configurator => configurator({})).forEach((commandOptions) => {
      this.addCommand(new Command(commandOptions));
    });

    return this;
  }

  get(identifier: string): Command | undefined {
    const name = this.getMainName(identifier);

    if (name) {
      return this.commands.get(name);
    }
  }

  applyGroupMiddleware(group: string, middlewares: Middleware[]): this {
    const commandGroup = this.groups.get(group);

    if (!commandGroup) {
      throw new CommandError(`Attempted to apply middleware to non-existent command group: ${group}`);
    }

    commandGroup.applyMiddleware(...middlewares);

    return this;
  }

  addCommand(command: Command): this {
    if (this.commands.has(command.name)) {
      throw new CommandError(`Attempting to add duplicate command: "${command.name}"`);
    }

    const { name, aliases, group } = command;

    this.commands.set(name, command);
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
    return this.commands.has(identifier) ? identifier : this.aliases.get(identifier);
  }

  alias(name: string, aliases: string[]): this {
    aliases.forEach((alias) => {
      if (!this.commands.has(name)) {
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

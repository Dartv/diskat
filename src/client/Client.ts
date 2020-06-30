import { Client as DiscordClient } from 'discord.js';

import type { ClientOptions, ClientEvents } from '../types';
import { CommandRegistry } from '../command/CommandRegistry';
import { ServiceContainer } from './ServiceContainer';
import { Dispatcher } from './Dispatcher';
import { TypeResolver } from '../command/resolvers/TypeResolver';
import { ClientResolver } from '../command/resolvers/ClientResolver';

export class Client extends DiscordClient {
  commands: CommandRegistry;
  services: ServiceContainer;
  dispatcher: Dispatcher;
  types: TypeResolver;
  resolver: ClientResolver;

  constructor(options: ClientOptions) {
    const { prefix, ...rest } = options;

    super(rest);

    this.commands = new CommandRegistry();
    this.services = new ServiceContainer();
    this.types = new TypeResolver(this);
    this.resolver = new ClientResolver(this);
    this.dispatcher = new Dispatcher({ client: this, prefix });
  }

  public on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this {
    return super.on(event as any, listener);
  }

  public once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this {
    return super.on(event as any, listener);
  }

  public emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean {
    return super.emit(event as any, ...args);
  }
}

import { Client as DiscordClient } from 'discord.js';

import { ClientOptions, ClientEvents } from '../types';
import { CommandRegistry } from '../command/CommandRegistry';
import { ServiceContainer } from './services/ServiceContainer';
import { Dispatcher } from './dispatcher/Dispatcher';

export class Client extends DiscordClient {
  commands: CommandRegistry;
  services: ServiceContainer;
  dispatcher: Dispatcher;

  constructor(options: ClientOptions) {
    const { prefix, ...rest } = options;

    super(rest);

    this.commands = new CommandRegistry();
    this.services = new ServiceContainer();
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

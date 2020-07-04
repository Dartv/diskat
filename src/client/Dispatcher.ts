import { escapeRegExp, sample } from 'lodash';
import { MessageEmbed, Message, TextChannel } from 'discord.js';

import type {
  PrefixFilterFunction,
  Context,
  CreateContextOptions,
  CommandResponse,
  DispatcherOptions,
  Prefix,
  ParsedCommand,
} from '../types';
import type { Client } from './Client';
import { Response } from '../command/responses/Response';
import { CommandParser } from '../command/parsers/CommandParser';
import { ArgumentParser } from '../command/parsers/ArgumentParser';
import { MarkdownFormatter } from '../utils/MarkdownFormatter';

export class Dispatcher<C extends Client = Client> {
  client: C;
  prefix: Prefix;
  prefixFilter: RegExp | PrefixFilterFunction;

  constructor(options: DispatcherOptions<C>) {
    Object.assign(this, options);

    if (typeof this.prefix === 'string') {
      this.prefix = escapeRegExp(this.prefix.trim());
    }

    this.client.once('ready', () => {
      this.prefixFilter = this.createPrefixFilter(this.prefix);
    });
    this.client.on('message', this.dispatch.bind(this));
    this.client.on('messageUpdate', this.dispatch.bind(this));
  }

  async dispatch(prevMessage: Message, newMessage?: Message): Promise<boolean | this> {
    if (this.shouldFilterEvent(prevMessage, newMessage)) {
      this.client.emit('eventFilter', prevMessage, newMessage);
    }

    const message = newMessage || prevMessage;
    const prefix = typeof this.prefixFilter === 'function'
      ? await this.prefixFilter(message)
      : this.prefixFilter;

    if (!prefix || !(prefix instanceof RegExp) || this.shouldFilterPrefix(prefix, message)) {
      return this.client.emit('prefixFilter', message);
    }

    let parsedCommand: ParsedCommand;

    try {
      parsedCommand = CommandParser.parse(message, prefix);
    } catch (error) {
      return this.client.emit('parseCommandError', error, message);
    }

    await this.dispatchCommand(parsedCommand.identifier, parsedCommand.rawArgs, message);

    return this;
  }

  shouldFilterEvent(message: Message, newMessage?: Message): boolean {
    return !!newMessage && message.content === newMessage.content;
  }

  shouldFilterPrefix(prefix: RegExp, message: Message): boolean {
    return !prefix.test(message.content);
  }

  createPrefixFilter(prefix: Prefix): RegExp | PrefixFilterFunction {
    if (typeof prefix === 'string') {
      if (/^@client$/i.test(prefix)) {
        return new RegExp(`^<@!?${this.client.user?.id}>`);
      } else if (/^@me:.+/i.test(prefix)) {
        const prefixString = prefix.match(/@me:(.+)/)?.[1];
        const prefixRegex = new RegExp(`^${prefixString}`, 'i');

        return async ({ author }: Message) => {
          if (author.id === this.client.user?.id) {
            return prefixRegex;
          }

          return false;
        };
      }

      return new RegExp(`^${prefix}`, 'i');
    } else if (prefix instanceof RegExp) {
      const matches = prefix.toString().match(/^\/(.+)\/(\w+)?$/);

      return new RegExp(`^${matches?.[1]}`, matches?.[2]);
    } else if (typeof prefix === 'function') {
      return prefix;
    }

    throw new TypeError('Prefix should be a string or function');
  }

  createContext({ message, command, args = {} }: CreateContextOptions): Context {
    return {
      command,
      message,
      args,
      client: this.client,
      commands: this.client.commands,
      dispatch: <T>(response: CommandResponse<T>) => this.dispatchResponse(
        message.channel as TextChannel,
        response,
      ),
      formatter: MarkdownFormatter,
      services: this.client.services,
    };
  }

  async dispatchCommand<T>(
    commandName: string,
    rawArgs: string,
    message: Message,
  ): Promise<boolean | this | Message | T> {
    const command = this.client.commands.get(commandName);

    if (!command) {
      return this.client.emit('unknownCommand', commandName, message);
    }

    let args: Record<string, unknown>;

    try {
      args = await new ArgumentParser(this.client).parse(command.parameters, rawArgs, message);
    } catch (error) {
      return this.client.emit('parseArgumentsError', error, command.name, message);
    }

    let response: CommandResponse<T>;

    try {
      const injectedServices = [...command.dependencies].reduce(
        (acc, [serviceName, contextName]) => {
          if (!this.client.services.has(serviceName)) {
            throw new Error(`Attempting to inject a non-existent service: ${serviceName}`);
          }

          return {
            ...acc,
            [contextName]: this.client.services.get(serviceName),
          };
        },
        {},
      );

      const context = this.createContext({ message, command, args });

      response = await command.handle({ ...context, ...injectedServices, args });
    } catch (error) {
      return this.client.emit('dispatchError', error, this.createContext({ message, command, args }));
    }

    if (!response) {
      return this.client.emit('middlewareFilter', this.createContext({ message, command, args }));
    }

    try {
      return await this.dispatchResponse(message.channel as TextChannel, response);
    } catch (error) {
      return this.client.emit(
        'dispatchError',
        error,
        this.createContext({ message, command, args }),
      );
    }
  }

  async dispatchResponse<T>(
    channel: TextChannel,
    response: CommandResponse<T>,
  ): Promise<Message | T> {
    if (typeof response === 'string') {
      return channel.send(response);
    }

    if (Array.isArray(response)) {
      return this.dispatchResponse(channel, sample(response)!);
    }

    // for god knows why reason MessageEmbed loses its reference
    // so this is a dirty hack around that
    if (response?.constructor?.name === MessageEmbed.name) {
      return channel.send('', { embed: response as MessageEmbed });
    }

    if (response instanceof Message) {
      return response;
    }

    if (response instanceof Response) {
      return response.respond();
    }

    throw new Error('Returned value from command handler is not of a recognized type');
  }
}

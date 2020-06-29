import { escapeRegExp, sample } from 'lodash';
import { MessageEmbed, Message, TextChannel } from 'discord.js';

import {
  ResponseType,
  PrefixFilterFunction,
  Context,
  CreateContextOptions,
  CommandResponse,
  DispatcherOptions,
  Prefix,
} from '../types';
import { Response } from '../command/responses/Response';
import { Client } from './Client';
import { CommandParser } from '../command/parsers/CommandParser';
import { ParsedCommand } from '../command/parsers/ParsedCommand';
import { ArgumentParser } from '../command/parsers/ArgumentParser';
import { MarkdownFormatter } from '../utils/MarkdownFormatter';

export class Dispatcher {
  client: Client;
  prefix: Prefix;
  prefixFilter: RegExp | PrefixFilterFunction;

  constructor({ client, prefix }: DispatcherOptions) {
    this.client = client;
    this.prefix = prefix;

    if (typeof this.prefix === 'string') {
      this.prefix = escapeRegExp(this.prefix.trim());
    }

    client.once('ready', () => {
      this.prefixFilter = this.createPrefixFilter(this.prefix);
    });
    client.on('message', this.dispatch.bind(this));
    client.on('messageUpdate', this.dispatch.bind(this));
  }

  static resolveResponseType(response: unknown): ResponseType | null {
    if (!response) {
      return ResponseType.NO_RESPONSE;
    } else if (typeof response === 'string') {
      return ResponseType.STRING;
    } else if (Array.isArray(response)) {
      return ResponseType.ARRAY;
    } else if (response instanceof MessageEmbed) {
      return ResponseType.EMBED;
    } else if (response instanceof Response) {
      return ResponseType.CUSTOM_RESPONSE;
    }

    return null;
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

    const command = this.client.commands.get(parsedCommand.identifier);

    if (!command) {
      return this.client.emit('unknownCommand', parsedCommand.identifier, message);
    }

    let args: Record<string, unknown>;

    try {
      args = await new ArgumentParser(this.client).parse(command.parameters, parsedCommand.rawArgs, message);
    } catch (error) {
      return this.client.emit('parseArgumentsError', error, command.name, message);
    }

    let response: CommandResponse;

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
      return this.client.emit('handlerError', error, this.createContext({ message, command, args }));
    }

    if (!response) {
      return this.client.emit('middlewareFilter', this.createContext({ message, command, args }));
    }

    try {
      await this.dispatchResponse(message.channel as TextChannel, response);

      return this;
    } catch (error) {
      return this.client.emit(
        'dispatchError',
        error,
        this.createContext({ message, command, args }),
      );
    }
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
      dispatch: (response: CommandResponse) => this.dispatchResponse(
        message.channel as TextChannel,
        response,
      ),
      formatter: MarkdownFormatter,
      services: this.client.services,
    };
  }

  async dispatchResponse(channel: TextChannel, response: unknown): Promise<Message | null | unknown> {
    switch (Dispatcher.resolveResponseType(response)) {
      case ResponseType.STRING:
        return channel.send(response as string);
      case ResponseType.ARRAY: {
        const choice = sample(response as CommandResponse[]);

        return this.dispatchResponse(channel, choice as CommandResponse);
      }
      case ResponseType.EMBED:
        return channel.send(response as MessageEmbed);
      case ResponseType.CUSTOM_RESPONSE:
        return (response as Response).respond();
      case ResponseType.NO_RESPONSE:
        return null;
      default:
        throw new Error('Returned value from command handler is not of a recognized type');
    }
  }
}

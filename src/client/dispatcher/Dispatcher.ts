import { escapeRegExp, sample } from 'lodash';
import { MessageEmbed, Message, TextChannel } from 'discord.js';

import { ResponseType } from '../../types';
import { RegexFilter } from './RegexFilter';
import { DeferredFilter, DeferredFilterFunction } from './DeferredFilter';
import { Response } from '../../command/responses/Response';
import { Client } from '../client';
import { CommandParser } from '../../command/parsers/CommandParser';
import { ParsedCommand } from '../../command/parsers/ParsedCommand';
import { ArgumentParser } from '../../command/parsers/ArgumentParser';
import { MarkdownFormatter } from '../../utils/MarkdownFormatter';

export interface DispatcherOptions {
  client: Client;
  prefix: string | RegExp | DeferredFilterFunction;
}

export class Dispatcher {
  client: DispatcherOptions['client'];
  prefix: DispatcherOptions['prefix'];
  prefixFilter: RegexFilter | DeferredFilter;

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

  static resolveResponseType(response: any): ResponseType | null {
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

  async dispatch(message: Message, newMessage?: Message): Promise<boolean | this> {
    if (this.shouldFilterEvent(message, newMessage)) {
      return this.client.emit('dispatchFail', 'eventFilter', { message, newMessage });
    }

    const contentMessage = newMessage || message;
    const prefix = this.prefixFilter instanceof DeferredFilter
      ? await this.prefixFilter.test(contentMessage)
      : this.prefixFilter.filter;

    if (!prefix || !(prefix instanceof RegExp) || this.shouldFilterPrefix(prefix, contentMessage)) {
      return this.client.emit('dispatchFail', 'prefixFilter', { message: contentMessage });
    }

    let parsedCommand: ParsedCommand;

    try {
      parsedCommand = CommandParser.parse(contentMessage, prefix);
    } catch (error) {
      return this.client.emit('dispatchFail', 'parseCommand', { message: contentMessage, error });
    }

    const command = this.client.commands.get(parsedCommand.identifier);

    if (!command) {
      return this.client.emit('dispatchFail', 'unknownCommand', {
        message: contentMessage,
        command: parsedCommand.identifier,
      });
    }

    const context = {
      message: contentMessage,
      client: this.client,
      commands: this.client.commands,
      dispatch: <T extends (...args: any[]) => any>(response: Response<T>) => this.dispatchResponse(
        contentMessage.channel as TextChannel,
        response,
      ),
      formatter: MarkdownFormatter,
      services: this.client.services,
    };

    let args;

    try {
      args = ArgumentParser.parse(command.parameters, parsedCommand.rawArgs);
    } catch (error) {
      return this.client.emit(
        'dispatchFail',
        'parseArguments',
        {
          message: contentMessage,
          command: parsedCommand.identifier,
          error,
        },
      );
    }

    let response;

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

      response = await command.handle({ ...context, ...injectedServices, args });
    } catch (error) {
      return this.client.emit(
        'dispatchFail',
        'handlerError',
        {
          message: contentMessage,
          command: command.name,
          args,
          error,
        },
      );
    }

    if (!response) {
      return this.client.emit(
        'dispatchFail',
        'middlewareFilter',
        {
          message: contentMessage,
          command: command.name,
          args,
        },
      );
    }

    try {
      await this.dispatchResponse(contentMessage.channel as TextChannel, response);

      return this;
    } catch (error) {
      return this.client.emit(
        'dispatchFail',
        'dispatch',
        {
          message: contentMessage,
          command: command.name,
          args,
          error,
          response,
        },
      );
    }
  }

  shouldFilterEvent(message: Message, newMessage?: Message): boolean {
    return !!newMessage && message.content === newMessage.content;
  }

  shouldFilterPrefix(prefix: RegExp, message: Message): boolean {
    console.log(prefix, prefix.test(message.content), message.content);
    return !prefix.test(message.content);
  }

  createPrefixFilter(prefix: Dispatcher['prefix']): RegexFilter | DeferredFilter {
    if (typeof prefix === 'string') {
      if (/^@client$/i.test(prefix)) {
        return new RegexFilter(new RegExp(`^<@!?${this.client.user?.id}>`));
      } else if (/^@me:.+/i.test(prefix)) {
        const prefixString = prefix.match(/@me:(.+)/)?.[1];
        const prefixRegex = new RegExp(`^${prefixString}`, 'i');

        return new DeferredFilter(async ({ author }) => (
          author.id === this.client.user?.id && prefixRegex
        ));
      }

      return new RegexFilter(new RegExp(`^${prefix}`, 'i'));
    } else if (prefix instanceof RegExp) {
      const matches = prefix.toString().match(/^\/(.+)\/(\w+)?$/);

      return new RegexFilter(new RegExp(`^${matches?.[1]}`, matches?.[2]));
    } else if (typeof prefix === 'function') {
      return new DeferredFilter(prefix);
    }

    throw new TypeError('Prefix should be a string or function');
  }

  async dispatchResponse(channel: TextChannel, response: any): Promise<Message | null> {
    switch (Dispatcher.resolveResponseType(response)) {
      case ResponseType.STRING:
        return channel.send(response as string);
      case ResponseType.ARRAY: {
        const choice = sample(response as string[]);

        return this.dispatchResponse(channel, choice);
      }
      case ResponseType.EMBED:
        return channel.send(response as MessageEmbed);
      case ResponseType.CUSTOM_RESPONSE:
        return (response as Response<any>).respond();
      case ResponseType.NO_RESPONSE:
        return null;
      default:
        throw new Error('Returned value from command handler is not of a recognized type');
    }
  }
}

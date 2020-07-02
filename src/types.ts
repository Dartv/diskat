/* eslint-disable no-var, @typescript-eslint/ban-types */

import Discord, { Message, MessageEmbed } from 'discord.js';

import type { Command } from './command/Command';
import type { Client } from './client/Client';
import type { MarkdownFormatter } from './utils/MarkdownFormatter';
import type { Response } from './command/responses/Response';

export type Arguments<T> = [T] extends [(...args: infer U) => unknown]
  ? U
  : [T] extends [void] ? [] : [T];

export interface TypedEventEmitter<Events> {
  addListener<E extends keyof Events> (event: E, listener: Events[E]): this;
  on<E extends keyof Events> (event: E, listener: Events[E]): this;
  once<E extends keyof Events> (event: E, listener: Events[E]): this;
  prependListener<E extends keyof Events> (event: E, listener: Events[E]): this;
  prependOnceListener<E extends keyof Events> (event: E, listener: Events[E]): this;

  off<E extends keyof Events>(event: E, listener: Events[E]): this;
  removeAllListeners<E extends keyof Events> (event?: E): this;
  removeListener<E extends keyof Events> (event: E, listener: Events[E]): this;

  emit<E extends keyof Events> (event: E, ...args: Arguments<Events[E]>): boolean;
  eventNames (): (keyof Events | string | symbol)[];
  rawListeners<E extends keyof Events> (event: E): Function[];
  listeners<E extends keyof Events> (event: E): Function[];
  listenerCount<E extends keyof Events> (event: E): number;

  getMaxListeners (): number;
  setMaxListeners (maxListeners: number): this;
}

export interface ClientOptions extends Discord.ClientOptions {
  prefix: string;
}

export interface CommandHandler<
  T extends Context = Context,
  U = CommandResponse<unknown>
> {
  (context: T): Promise<U>;
}

export interface CommandOptions {
  handler: CommandHandler;
  triggers: string[];
  parameters?: ParameterDefinition[];
  group?: string;
  description?: string;
  dependencies?: string[];
  middleware?: Middleware[];
}

export interface Middleware<A extends Context = Context, B extends Context = Context, R = unknown> {
  (next: (context: B) => Promise<R>, context: A): Promise<R>;
}

export interface CommandGroupEvents {
  middlewareUpdate: (middlewares: Middleware[]) => void;
}

export interface ParsedCommand {
  // raw message content;
  raw: string;
  // raw message context with any command prefix trimmed from the start
  trimmed: string;
  // the name of the command being invoked
  identifier: string;
  // A space-delimited array of arguments that were given as part of the command
  args: string[];
  // The delimited arguments joined together as a string
  rawArgs: string;
}

export enum ParameterType {
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  FLOAT = 'float',
  NUMBER = 'number',
  STRING = 'string',
  DATE = 'date',
  URL = 'url',
  USER = 'user',
  MEMBER = 'member',
  CHANNEL = 'channel',
  TEXT_CHANNEL = 'text channel',
  VOICE_CHANNEL = 'voice channel',
  CATEGORY_CHANNEL = 'category channel',
  NEWS_CHANNEL = 'news channel',
  STORE_CHANNEL = 'store channel',
  ROLE = 'role',
}

export interface ParameterDefinition<T = unknown> {
  name: string;
  description?: string;
  optional?: boolean;
  type?: string | TypeResolverFunction;
  repeatable?: boolean;
  literal?: boolean;
  defaultValue?: T | ((message: Message) => T | Promise<T>);
}

export type ParsedParameter<T = unknown> = Required<ParameterDefinition<T>>;

export type CommandResponse<T> =
  | string
  | Response<T>
  | Message
  | MessageEmbed
  | [CommandResponse<T>, ...CommandResponse<T>[]];

export interface ClientEvents extends Discord.ClientEvents {
  eventFilter: [Message, Message?],
  prefixFilter: [Message],
  middlewareFilter: [Context],
  unknownCommand: [string, Message],
  parseCommandError: [Error, Message],
  parseArgumentsError: [Error, string, Message],
  dispatchError: [Error, Context],
}

export interface PrefixFilterFunction {
  (message: Message): Promise<boolean | RegExp>;
}

export interface Context {
  command: Command;
  commands: Client['commands'];
  message: Message;
  client: Client;
  formatter: MarkdownFormatter;
  services: Client['services'];
  dispatch: <T>(response: CommandResponse<T>) => Promise<Message | T>;
  args: Record<string, unknown>;
}

export interface CreateContextOptions {
  message: Message;
  command: Command;
  args?: Record<string, unknown>;
}

export type Prefix = string | RegExp | PrefixFilterFunction;

export interface DispatcherOptions {
  client: Client;
  prefix: string | RegExp | PrefixFilterFunction;
}

export interface TypeResolverFunction <T extends unknown = unknown> {
  (value: string, message: Message): null | T | Promise<null | T>;
}

export type CommandConfigurator = (client: Client) => CommandOptions;

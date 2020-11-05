/* eslint-disable no-var, @typescript-eslint/ban-types */

import Discord, { Message, MessageEmbed } from 'discord.js';

import type { CommandObject } from './command/CommandObject';
import type { Client } from './client/Client';
import type { MarkdownFormatter } from './utils/MarkdownFormatter';
import type { Response } from './command/responses/Response';
import { ArgumentParserError } from './errors/ArgumentParserError';
import { CommandParserError } from './errors/CommandParserError';

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

export type CommandHandler<T extends Context, R> = <Result = R>(context: T) => Promise<CommandResponse<Result>>;

export interface CommandConfig {
  triggers: string[];
  parameters?: ParameterDefinition[];
  group?: string;
  description?: string;
  dependencies?: string[];
  middleware?: Middleware[];
}

export type Command<T extends Context, R = unknown> = CommandHandler<T, R> & {
  config: CommandConfig;
};

export type CommandConfigurator<
  T extends Context = Context,
  R = unknown,
  C extends Client = Client
> = (client: C) => Command<T, R>;

export type Middleware<A extends Context = Context, B extends Context = Context, R = unknown> = (
  next: (context: B) => Promise<R>,
  context: A,
) => Promise<R>;

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
  STRING_LOWER = 'string lowercased',
  STRING_UPPER = 'string uppercased',
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
  COMMAND = 'command',
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
  parseCommandError: [CommandParserError, Message],
  parseArgumentsError: [ArgumentParserError, string, Message],
  dispatchError: [Error, Context],
}

export interface PrefixFilterFunction {
  (message: Message): Promise<boolean | RegExp>;
}

export interface Context<C extends Client = Client> {
  command: CommandObject<Context, unknown>;
  commands: C['commands'];
  message: Message;
  client: C;
  formatter: typeof MarkdownFormatter;
  services: C['services'];
  dispatch: <T>(response: CommandResponse<T>) => Promise<Message | T>;
  args: any;
  rawArgs: string;
}

export interface CreateContextOptions {
  message: Message;
  command: CommandObject<Context, unknown>;
  args?: any;
  rawArgs?: string;
}

export type Prefix = string | RegExp | PrefixFilterFunction;

export interface DispatcherOptions<C extends Client = Client> {
  client: C;
  prefix: Prefix;
}

export interface TypeResolverContext<T = unknown, C extends Client = Client> {
  message: Message;
  value: T;
  client: C;
  args: Record<string, unknown>;
}

export type TypeResolverFunction<C extends TypeResolverContext = TypeResolverContext, U = unknown> = (
  context: C,
) => null | U | Promise<null | U>;

export type TypeResolvable<
  C extends TypeResolverContext = TypeResolverContext,
  U = unknown
> = string | TypeResolverFunction<C, U>;

export interface ServiceInstance<T extends unknown = unknown> {
  aliases: string[];
  instance: T;
}

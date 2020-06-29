/* eslint-disable no-var, @typescript-eslint/ban-types */

import Discord, { Message, MessageEmbed } from 'discord.js';

import type { Command } from './command/Command';
import type { Client } from './client/Client';
import type { MarkdownFormatter } from './utils/MarkdownFormatter';
import type { Response } from './command/responses/Response';

export type Arguments<T> = [T] extends [(...args: infer U) => any]
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

export interface CommandHandler<T extends Context = Context, R extends CommandResponse = CommandResponse> {
  (context: T): Promise<R>;
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

export type Middleware = <A, B, R>(next: (context: B) => R, context: A) => B | Promise<B>;

export interface CommandGroupEvents {
  middlewareUpdate: (middlewares: Middleware[]) => void;
}

export interface ParsedCommandOptions {
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
}

export interface ParameterDefinition {
  name: string;
  description?: string;
  optional?: boolean;
  type?: ParameterType;
  repeatable?: boolean;
  literal?: boolean;
  defaultValue?: any;
}

export enum ResponseType {
  STRING = 'STRING',
  ARRAY = 'ARRAY',
  EMBED = 'EMBED',
  CUSTOM_RESPONSE = 'CUSTOM_RESPONSE',
  NO_RESPONSE = 'NO_RESPONSE',
}

export type CommandResponse =
  | string
  | Response
  | MessageEmbed
  | (string | Response | MessageEmbed)[];

export interface ClientEvents extends Discord.ClientEvents {
  eventFilter: [Message, Message?],
  prefixFilter: [Message],
  middlewareFilter: [Context],
  unknownCommand: [string, Message],
  parseCommandError: [Error, Message],
  parseArgumentsError: [Error, string, Message],
  handlerError: [Error, Context],
  dispatchError: [Error, Context],
}

export interface PrefixFilterFunction {
  (message: Message): Promise<boolean | RegExp>;
}

export interface DispatchFunction {
  (response: CommandResponse): Promise<Message | null>;
}

export interface Context {
  command: Command;
  commands: Client['commands'];
  message: Message;
  client: Client;
  formatter: MarkdownFormatter;
  services: Client['services'];
  dispatch: DispatchFunction;
  args: Record<string, any>;
}

export interface CreateContextOptions {
  message: Message;
  command: Command;
  args?: any;
}

export type Prefix = string | RegExp | PrefixFilterFunction;

export interface DispatcherOptions {
  client: Client;
  prefix: string | RegExp | PrefixFilterFunction;
}

/* eslint-disable no-var, @typescript-eslint/ban-types */

import Discord, { Message } from 'discord.js';

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

export interface CommandHandler<T> {
  (context: T): any;
}

export interface CommandOptions<T extends any = any> {
  handler: CommandHandler<T>;
  triggers: any;
  parameters?: any;
  group?: string;
  description?: string;
  dependencies?: any;
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

type DispatchFailFilter =
  | 'eventFilter'
  | 'prefixFilter'
  | 'parseCommand'
  | 'unknownCommand'
  | 'parseArguments'
  | 'handlerError'
  | 'middlewareFilter'
  | 'dispatch';

export interface ClientEvents extends Discord.ClientEvents {
  dispatchFail: [
    DispatchFailFilter,
    {
      message: Message;
      newMessage?: Message;
      error?: Error;
      command?: string;
      args?: any;
      response?: any;
    },
  ],
}

export enum ServiceType {
  CONSTRUCTED = 'CONSTRUCTED',
  SINGLETON = 'SINGLETON',
  INSTANCE = 'INSTANCE',
}

// export declare class Client extends DiscordClient {
//   constructor(options: ClientOptions);
// }

// export type DeferredFilterFunction = (message: Message) => boolean;

// export declare class Dispatcher {
//   client: DispatcherOptions['client'];
//   prefix: DispatcherOptions['prefix'];

//   constructor(options: DispatcherOptions);
// }

// export declare class PrefixFilter<T> {
//   filter: T;

//   constructor(filter: T);

//   test(message: Message): boolean;
// }

// export declare class RegexFilter extends PrefixFilter<RegExp> {}

// export declare class DeferredFilter extends PrefixFilter<DeferredFilterFunction> {}

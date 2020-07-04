import { Collection, Message } from 'discord.js';
import { toNumber, toInteger } from 'lodash';
import { URL } from 'url';

import type { TypeResolverFunction, TypeResolvable } from '../../types';
import type { Client } from '../../client/Client';
import { ParameterType } from '../../types';
import { TypeResolverError } from '../../errors/TypeResolverError';

export class TypeResolver<C extends Client> extends Collection<string, TypeResolverFunction> {
  client: C;

  constructor(client: C, entries?: ReadonlyArray<readonly [string, TypeResolverFunction]> | null) {
    super(entries);

    this.client = client;

    this.addDefaultTypes();
  }

  static isString(value: string): boolean {
    return typeof value === 'string';
  }

  static isNumber(value: string): boolean {
    return !Number.isNaN(+value) && typeof +value === 'number';
  }

  static isBoolean(value: string): boolean {
    return ['true', 'false'].includes(value.toLowerCase());
  }

  static isDate(value: string): boolean {
    return !Number.isNaN(Date.parse(value));
  }

  static toNumber(value: string): number {
    return toNumber(value);
  }

  static toInteger(value: string): number {
    return toInteger(value);
  }

  static toFloat(value: string): number {
    return Number.parseFloat(value);
  }

  static toBoolean(value: string): boolean {
    return value.toLowerCase() === 'true';
  }

  static toDate(value: string): Date {
    return new Date(Date.parse(value));
  }

  static oneOfType<C extends Client = Client>(
    types: (string | TypeResolverFunction)[],
  ): TypeResolverFunction<unknown, unknown, C> {
    return async function (this: TypeResolver<C>, value, message) {
      return types.reduce(async (accumP, type, i) => {
        const accum = await accumP;

        if (accum !== null) return accum;

        try {
          const resolved = await this.resolve(type, value, message);

          return resolved;
        } catch (err) {
          if (i === types.length - 1) {
            throw err;
          }

          return accum;
        }
      }, Promise.resolve(null));
    }
  }

  static oneOf<T, U, C extends Client = Client>(
    type: string | TypeResolverFunction<T, U, C>,
    expected: U[],
  ): TypeResolverFunction<T, U, C> {
    return async function (this: TypeResolver<C>, value, message) {
      const resolved = await this.resolve(type, value, message);

      if (!expected.includes(resolved)) {
        throw new TypeResolverError(`Expected "${value}" to match "${expected.join(' | ').trim()}" of type "${type}"`);
      }

      return resolved;
    }
  }

  static validate<T, U, C extends Client = Client>(
    predicate: (
      this: TypeResolver<C>,
      resolved: U,
      value: string,
      message: Message,
      client: C,
    ) => boolean | Promise<boolean>,
    type: string | TypeResolverFunction<T, U, C> = ParameterType.STRING,
  ): TypeResolverFunction<T, U, C> {
    return async function (this: TypeResolver<C>, value, message) {
      const resolved = await this.resolve(type, value, message);

      if (!await predicate.call(this, resolved, value, message)) {
        throw new TypeResolverError(`Value "${value}" of type "${type}" failed validation`);
      }

      return resolved;
    }
  }

  static compose<T, C extends Client = Client>(
    ...types: (string | TypeResolverFunction)[]
  ): TypeResolverFunction<unknown, T, C> {
    return async function (this: TypeResolver<C>, value, message) {
      return types.reduce(
        async (acc: Promise<any>, type) => acc.then((resolved) => this.resolve(type, resolved, message)),
        Promise.resolve(value),
      );
    }
  }

  static catch<T, U, C extends Client = Client>(
    onRejected: (value: T, message: Message, client: C) => Promise<U | null>,
    type: TypeResolvable<T, U, C>,
  ): TypeResolverFunction<T, U, C> {
    return async function (this: TypeResolver<C>, value, message) {
      let resolved: U | null;
      try {
        resolved = await this.resolve(type, value, message);
      } catch (err) {
        resolved = await onRejected.call(this, value, message, this.client);

        if (resolved === null) {
          throw err;
        }
      }

      return resolved;
    }
  }

  addDefaultTypes(): this {
    const defaultTypes: Record<ParameterType, TypeResolverFunction<string, unknown, C>> = {
      [ParameterType.STRING]: (value) => TypeResolver.isString(value) ? value : null,
      [ParameterType.NUMBER]: (value) => TypeResolver.isNumber(value) ? TypeResolver.toNumber(value) : null,
      [ParameterType.INTEGER]: (value) => TypeResolver.isNumber(value) ? TypeResolver.toInteger(value) : null,
      [ParameterType.FLOAT]: (value) => TypeResolver.isNumber(value) ? TypeResolver.toFloat(value) : null,
      [ParameterType.BOOLEAN]: (value) => TypeResolver.isBoolean(value) ? TypeResolver.toBoolean(value) : null,
      [ParameterType.DATE]: (value) => TypeResolver.isDate(value) ? TypeResolver.toDate(value) : null,
      [ParameterType.URL]: (value) => {
        try {
          return new URL(value);
        } catch (err) {
          return null;
        }
      },
      [ParameterType.USER]: (value) => this.client.resolver.resolveUser(value) || null,
      [ParameterType.MEMBER]: (value, message) => this.client.resolver.resolveMember(
        value,
        message.guild?.members.cache,
      ) || null,
      [ParameterType.CHANNEL]: (value, message) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
      ) || null,
      [ParameterType.TEXT_CHANNEL]: (value, message) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'text' },
      ) || null,
      [ParameterType.VOICE_CHANNEL]: (value, message) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'voice' },
      ) || null,
      [ParameterType.CATEGORY_CHANNEL]: (value, message) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'category' },
      ) || null,
      [ParameterType.NEWS_CHANNEL]: (value, message) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'news' },
      ) || null,
      [ParameterType.STORE_CHANNEL]: (value, message) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'store' },
      ) || null,
      [ParameterType.ROLE]: (value, message) => this.client.resolver.resolveRole(
        value,
        message.guild?.roles.cache,
      ) || null,
      [ParameterType.COMMAND]: (value) => this.client.resolver.resolveCommand(value, this.client.commands) || null,
    };

    Object.entries(defaultTypes).forEach(([key, resolver]) => {
      this.set(key, resolver);
    });

    return this;
  }

  async resolve<T, U>(
    type: TypeResolvable<T, U, C>,
    value: T,
    message: Message,
  ): Promise<U> {
    const resolver = typeof type === 'function' ? type.bind(this) : this.get(type);

    if (!resolver) {
      throw new TypeResolverError(`Type ${type} doesn't exist`);
    }

    const resolvedValue = await resolver(value, message, this.client);

    if (resolvedValue === null) {
      throw new TypeResolverError(`Expected "${value}" to be of type "${type}"`);
    }

    return resolvedValue;
  }
}

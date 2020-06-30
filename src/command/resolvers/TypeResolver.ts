import { Collection, Message } from 'discord.js';
import { toNumber, toInteger } from 'lodash';
import { URL } from 'url';

import type { TypeResolverFunction } from '../../types';
import type { Client } from '../../client/Client';
import { ParameterType } from '../../types';
import { TypeResolverError } from '../../errors/TypeResolverError';

export class TypeResolver extends Collection<ParameterType, TypeResolverFunction> {
  client: Client;

  constructor(client: Client, entries?: ReadonlyArray<readonly [ParameterType, TypeResolverFunction]> | null) {
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

  addDefaultTypes(): this {
    const defaultTypes: Record<ParameterType, TypeResolverFunction> = {
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
    };

    Object.entries(defaultTypes).forEach(([key, resolver]: [ParameterType, TypeResolverFunction]) => {
      this.set(key, resolver);
    });

    return this;
  }

  async resolve<T>(type: ParameterType | TypeResolverFunction<T>, value: string, message: Message): Promise<T> {
    const resolver = typeof type === 'function' ? type : this.get(type);

    if (!resolver) {
      throw new TypeResolverError(`Type ${type} doesn't exist`);
    }

    const resolvedValue = await resolver(value, message);

    if (resolvedValue === null) {
      throw new TypeResolverError(`Expected "${value}" to be of type "${type}"`);
    }

    return resolvedValue as T;
  }
}

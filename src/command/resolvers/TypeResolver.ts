import { Collection } from 'discord.js';
import { toNumber, toInteger } from 'lodash';
import { URL } from 'url';

import type { TypeResolverFunction, TypeResolvable, TypeResolverContext } from '../../types';
import type { Client } from '../../client/Client';
import { ParameterType } from '../../types';
import { TypeResolverError } from '../../errors/TypeResolverError';

type DefaultTypes<C> = Record<ParameterType, TypeResolverFunction<TypeResolverContext & { value: string, client: C }>>;

export class TypeResolver<C extends Client> extends Collection<string, TypeResolverFunction> {
  client: C;

  constructor(client: C, entries?: ReadonlyArray<readonly [string, TypeResolverFunction]> | null) {
    super(entries);

    this.client = client;

    this.addDefaultTypes();
  }

  static get Types(): typeof ParameterType {
    return ParameterType;
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

  static isURL(value: string): boolean {
    try {
      return !!new URL(value);
    } catch (err) {
      return false;
    }
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

  static toURL(value: string): URL {
    return new URL(value);
  }

  static oneOfType<T extends TypeResolverContext, U = T['value']>(
    types: TypeResolvable<T, U>[],
  ): TypeResolverFunction<T, U> {
    return async function (this: TypeResolver<T['client']>, context) {
      return types.reduce(async (accumP, type, i) => {
        const accum = await accumP;

        if (accum !== null) return accum;

        try {
          const resolved = await this.resolve(type, context);

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

  static oneOf<T extends TypeResolverContext, U = T['value']>(
    type: TypeResolvable<T, U>,
    expected: U[],
  ): TypeResolverFunction<T, U> {
    return async function (this: TypeResolver<T['client']>, context) {
      const resolved = await this.resolve(type, context);

      if (!expected.includes(resolved)) {
        throw new TypeResolverError(
          `Expected "${context.value}" to match "${expected.join(' | ').trim()}" of type "${type}"`
        );
      }

      return resolved;
    }
  }

  static validate<T extends TypeResolverContext, U = T['value']>(
    predicate: (
      this: TypeResolver<T['client']>,
      context: T & { resolved: U },
    ) => boolean | Promise<boolean>,
    type: string | TypeResolverFunction<T, U> = ParameterType.STRING,
  ): TypeResolverFunction<T, U> {
    return async function (this: TypeResolver<T['client']>, context) {
      const resolved = await this.resolve(type, context);

      if (!await predicate.call(this, { ...context, resolved })) {
        throw new TypeResolverError(`Value "${context.value}" of type "${type}" failed validation`);
      }

      return resolved;
    }
  }

  static compose<T extends TypeResolverContext, U = T['value']>(
    ...types: TypeResolvable<T, U>[]
  ): TypeResolverFunction<T, U> {
    return async function (this: TypeResolver<T['client']>, context) {
      return types.reduce(
        async (acc: Promise<any>, type) => acc.then((resolved) => this.resolve(type, { ...context, value: resolved })),
        Promise.resolve(context.value),
      );
    }
  }

  static catch<T extends TypeResolverContext, U = T['value']>(
    onRejected: (context: T) => Promise<U | null>,
    type: TypeResolvable<T, U>,
  ): TypeResolverFunction<T, U> {
    return async function (this: TypeResolver<T['client']>, context) {
      let resolved: U | null;

      try {
        resolved = await this.resolve(type, context);
      } catch (err) {
        resolved = await onRejected.call(this, context);

        if (resolved === null) {
          throw err;
        }
      }

      return resolved;
    }
  }

  addDefaultTypes(): this {
    const defaultTypes: DefaultTypes<C> = {
      [ParameterType.STRING]: ({ value }) => TypeResolver.isString(value) ? value : null,
      [ParameterType.STRING_LOWER]: ({ value }) => TypeResolver.isString(value) ? value.toLowerCase() : null,
      [ParameterType.STRING_UPPER]: ({ value }) => TypeResolver.isString(value) ? value.toUpperCase() : null,
      [ParameterType.NUMBER]: ({ value }) => TypeResolver.isNumber(value) ? TypeResolver.toNumber(value) : null,
      [ParameterType.INTEGER]: ({ value }) => TypeResolver.isNumber(value) ? TypeResolver.toInteger(value) : null,
      [ParameterType.FLOAT]: ({ value }) => TypeResolver.isNumber(value) ? TypeResolver.toFloat(value) : null,
      [ParameterType.BOOLEAN]: ({ value }) => TypeResolver.isBoolean(value) ? TypeResolver.toBoolean(value) : null,
      [ParameterType.DATE]: ({ value }) => TypeResolver.isDate(value) ? TypeResolver.toDate(value) : null,
      [ParameterType.URL]: ({ value }) => TypeResolver.isURL(value) ? TypeResolver.toURL(value) : null,
      [ParameterType.USER]: ({ value }) => this.client.resolver.resolveUser(value) || null,
      [ParameterType.MEMBER]: ({ value, message }) => this.client.resolver.resolveMember(
        value,
        message.guild?.members.cache,
      ) || null,
      [ParameterType.CHANNEL]: ({ value, message }) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
      ) || null,
      [ParameterType.TEXT_CHANNEL]: ({ value, message }) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'text' },
      ) || null,
      [ParameterType.VOICE_CHANNEL]: ({ value, message }) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'voice' },
      ) || null,
      [ParameterType.CATEGORY_CHANNEL]: ({ value, message }) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'category' },
      ) || null,
      [ParameterType.NEWS_CHANNEL]: ({ value, message }) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'news' },
      ) || null,
      [ParameterType.STORE_CHANNEL]: ({ value, message }) => this.client.resolver.resolveChannel(
        value,
        message.guild?.channels.cache,
        { type: 'store' },
      ) || null,
      [ParameterType.ROLE]: ({ value, message }) => this.client.resolver.resolveRole(
        value,
        message.guild?.roles.cache,
      ) || null,
      [ParameterType.COMMAND]: ({ value }) => this.client.resolver.resolveCommand(value, this.client.commands) || null,
    };

    Object.entries(defaultTypes).forEach(([key, resolver]) => {
      this.set(key, resolver);
    });

    return this;
  }

  async resolve<T extends TypeResolverContext, U>(
    type: TypeResolvable<T, U>,
    context: T,
  ): Promise<U> {
    const { client = this.client } = context;

    const resolver = typeof type === 'function' ? type.bind(this) : this.get(type);

    if (!resolver) {
      throw new TypeResolverError(`Type ${type} doesn't exist`);
    }

    const resolvedValue = await resolver({ ...context, client });

    if (resolvedValue === null) {
      throw new TypeResolverError(`Expected "${context.value}" to be of type "${type}"`);
    }

    return resolvedValue;
  }
}

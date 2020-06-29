import { Collection, Message } from 'discord.js';
import { toNumber, toInteger } from 'lodash';

import { ParameterType } from '../../types';
import { TypeResolverError } from '../../errors/TypeResolverError';

export interface TypeResolverFunction <T extends unknown = unknown> {
  (value: string, message: Message): null | T | Promise<null | T>;
}

export class TypeResolver extends Collection<ParameterType, TypeResolverFunction> {
  constructor(entries?: ReadonlyArray<readonly [ParameterType, TypeResolverFunction]> | null) {
    super(entries);

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
    };

    Object.entries(defaultTypes).forEach(([key, resolver]: [ParameterType, TypeResolverFunction]) => {
      this.set(key, resolver);
    });

    return this;
  }

  async resolve<T>(type: ParameterType, value: string, message: Message): Promise<T> {
    const resolver = this.get(type);

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

import stringArgv from 'string-argv';
import { Message } from 'discord.js';

import type { Client } from '../../client/Client';
import type { ParsedParameter } from '../../types';
import { ArgumentParserError } from '../../errors/ArgumentParserError';
import { isNil } from '../../utils/common';

export class ArgumentParser<C extends Client> {
  constructor(public client: C) {}

  async parse(
    rules: ParsedParameter[],
    args: string,
    message: Message,
  ): Promise<Record<string, unknown>> {
    const delimited = stringArgv(args);
    const parsed: Record<string, unknown> = {};

    for (let i = 0; i < rules.length; ++i) {
      const rule = rules[i];
      const arg = delimited[i];
      if (!rule.optional && isNil(arg)) {
        throw new ArgumentParserError(`Missing a value for required argument: "${rule.name}"`);
      }

      if (rule.repeatable || rule.literal) {
        if (isNil(arg)) {
          return {
            ...parsed,
            [rule.name]: await ArgumentParser.resolveDefaultValue(rule, message),
          };
        } else if (rule.repeatable) {
          const rest: unknown[] = [];

          for (let j = i; j < delimited.length; ++j) {
            rest.push(
              await this.client.types.resolve(rule.type, { value: delimited[j], message, client: this.client })
            );
          }

          return {
            ...parsed,
            [rule.name]: rest,
          };
        } else if (rule.literal) {
          return {
            ...parsed,
            [rule.name]: args,
          };
        }
      }

      // get the arg or default value if no arg is given
      try {
        parsed[rule.name] = isNil(arg)
        ? await ArgumentParser.resolveDefaultValue(rule, message)
        : await this.client.types.resolve(rule.type, { value: arg, client: this.client, message });
      } catch (err) {
        err.rule = rule;
        throw err;
      }
    }

    return parsed;
  }

  static resolveDefaultValue<T>(rule: ParsedParameter, message: Message): T {
    return typeof rule.defaultValue === 'function' ? rule.defaultValue(message) : rule.defaultValue;
  }
}

import stringArgv from 'string-argv';
import { Message } from 'discord.js';

import { ParsedParameter } from './ParsedParameter';
import { isNil } from '../../utils/common';
import { ArgumentParserError } from '../../errors/ArgumentParserError';
import type { Client } from '../../client/Client';

export class ArgumentParser {
  constructor(public client: Client) {}

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
            [rule.name]: rule.defaultValue,
          };
        } else if (rule.repeatable) {
          const rest: unknown[] = [];

          for (let j = i; j < delimited.length; ++j) {
            rest.push(await this.client.types.resolve(rule.type, delimited[j], message));
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
      parsed[rule.name] = isNil(arg)
        ? rule.defaultValue
        : await this.client.types.resolve(rule.type, arg, message);
    }

    return parsed;
  }
}

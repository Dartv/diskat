import stringArgv from 'string-argv';

import { ParsedParameter } from './ParsedParameter';
import { isNil } from '../../utils/common';
import { ArgumentParserError } from '../../errors/ArgumentParserError';
import { isType, convertType } from './Types';
import { ParameterType } from '../../types';

export class ArgumentParser {
  static parse(rules: ParsedParameter[], args: string) {
    const delimited = stringArgv(args);
    const parsed = {};

    rules.forEach((rule, i) => {
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
          const rest: ReturnType<typeof ArgumentParser.normalizeArgumentType>[] = [];
          // TODO: refactor to remove for loop
          for (let j = i; j < delimited.length; ++j) {
            rest.push(ArgumentParser.normalizeArgumentType(rule.type as ParameterType, delimited[j]));
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
        : ArgumentParser.normalizeArgumentType(rule.type as ParameterType, arg);
    });

    return parsed;
  }

  static normalizeArgumentType(type: ParameterType, argument: string): ReturnType<typeof convertType> {
    if (!isType(argument, type)) {
      throw new ArgumentParserError(`Expected argument "${argument}" to be of type "${type}"`);
    }

    return convertType(argument, type);
  }
}

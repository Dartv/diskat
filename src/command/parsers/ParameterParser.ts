import { trimStart, trimEnd, isPlainObject } from 'lodash';
import parseArgsStringToArgv from 'string-argv';

import { ParsedParameter } from './ParsedParameter';
import { ParameterDefinition, ParameterType } from '../../types';
import { ParameterParserError } from '../../errors/ParameterParserError';
import { resolveType, isType, convertType } from './Types';

export class ParameterParser {
  static validate(...parameters: (ParameterDefinition | string)[]): ParsedParameter[] {
    const parsed = ParameterParser.parse(...parameters);
    let seenRepeatable = false;
    let seenOptional = false;

    parsed.forEach((parameter) => {
      if (parameter.literal && parsed.length > 1) {
        throw new ParameterParserError('Literal parameters must be the only parameter in a command');
      } else if (seenRepeatable) {
        throw new ParameterParserError('Repeatable parameters must be the last parameter in a command.');
      } else if (seenOptional && !parameter.optional) {
        throw new ParameterParserError('Cannot have required parameters after optional parameters in a command.');
      }

      seenRepeatable = seenRepeatable || !!parameter.repeatable;
      seenOptional = seenOptional || !!parameter.optional;
    });

    return parsed;
  }

  static parse(...parameters: (ParameterDefinition | string)[]): ParsedParameter[] {
    return parameters.map((parameter) => {
      if (typeof parameter === 'string') {
        return new ParsedParameter(ParameterParser.parseParameter(parameter));
      } else if (isPlainObject(parameter)) {
        return new ParsedParameter(parameter);
      }

      throw new ParameterParserError('Expected parameter definition to be a plain object or string');
    });
  }

  static parseParameter(parameter: string): ParameterDefinition {
    const trimmed = parameter.trim();

    if (!trimmed) {
      throw new ParameterParserError('Parameter cannot be empty');
    }

    const parsed = { description: '' };
    // description?
    const matched = trimmed.match(/^(.+?)\s*:\s*(.+)$/);

    if (matched) {
      parsed.description = matched[2];
    }

    return {
      ...parsed,
      ...ParameterParser.parseDefinition(matched ? matched[1] : trimmed),
    };
  }

  static parseDefinition(definition: string): ParameterDefinition {
    const parsed: Required<ParameterDefinition> = {
      name: '',
      description: '',
      optional: false,
      type: ParameterType.STRING,
      repeatable: false,
      literal: false,
      defaultValue: null,
    };

    let temp = definition;

    // optional parameter?
    if (temp.startsWith('-')) {
      parsed.optional = true;
      temp = trimStart(temp, '- ');
    } else if (temp.startsWith('+')) {
      temp = trimStart(temp, '+ ');
    }

    let matched = temp.match(/\(\s*(\w+)\s*\)\s*(.+)/);

    if (matched) {
      const declaredType = matched[1];
      const actualType = resolveType(declaredType as ParameterType);

      if (!actualType) {
        throw new ParameterParserError(`Unrecognized parameter type declaration: "${definition}"`);
      }

      parsed.type = actualType;
      temp = matched[2];
    }

    // name, repeatable, literal, default value?
    matched = temp.match(/(\w+\s*?[*+]?)\s*=\s*(.+)/);
    const name = matched ? matched[1] : temp;

    if (name.endsWith('*')) {
      parsed.name = trimEnd(name, '* ');
      parsed.repeatable = true;
      parsed.defaultValue = [] as any;
    } else if (name.endsWith('...')) {
      if (parsed.type !== ParameterType.STRING) {
        throw new ParameterParserError(`Literals can only be used with string parameters: "${definition}"`);
      }

      parsed.name = trimEnd(name, '. ');
      parsed.literal = true;
    } else if (name.includes(' ')) {
      throw new ParameterParserError(`Parameter name must not contain spaces: "${definition}"`);
    } else {
      parsed.name = name;
    }

    if (matched) {
      const defaults = parseArgsStringToArgv(matched[2]);
      // default value automatically makes it optional
      parsed.optional = true;

      if (!parsed.repeatable && defaults.length > 1) {
        throw new ParameterParserError(
          `Cannot provide more than one default argument for non-repeatable parameters: "${definition}"`
        );
      }

      const typedDefaults = defaults.map((value) => {
        if (!isType(value, parsed.type)) {
          throw new ParameterParserError(`Given default value "${value}" is not of the correct type: "${definition}"`);
        }

        return convertType(value, parsed.type);
      });

      parsed.defaultValue = parsed.repeatable ? typedDefaults : typedDefaults[0];
    }

    return parsed;
  }
}

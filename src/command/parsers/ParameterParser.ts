import { isPlainObject } from 'lodash';

import { ParameterDefinition, ParsedParameter, ParameterType } from '../../types';
import { ParameterParserError } from '../../errors/ParameterParserError';

export class ParameterParser {
  static validate(...parameters: ParameterDefinition[]): ParsedParameter[] {
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

  static parse(...parameters: ParameterDefinition[]): ParsedParameter[] {
    return parameters.map((parameter) => {
      if (isPlainObject(parameter)) {
        return ParameterParser.applyDefaults(parameter);
      }

      throw new ParameterParserError('Expected parameter definition to be a plain object');
    });
  }

  static applyDefaults(parameter: ParameterDefinition): ParsedParameter {
    const {
      name,
      description = '',
      optional = false,
      type = ParameterType.STRING,
      repeatable = false,
      literal = false,
      defaultValue = null,
    } = parameter;

    return {
      name,
      description,
      optional,
      type,
      repeatable,
      literal,
      defaultValue,
    };
  }
}

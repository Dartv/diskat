import { ParameterDefinition, ParameterType } from '../../types';

export class ParsedParameter {
  name: string;
  description: string;
  optional: boolean;
  type: ParameterType;
  repeatable: boolean;
  literal: boolean;
  defaultValue: unknown;

  constructor(options: ParameterDefinition) {
    const {
      name,
      description = '',
      optional = false,
      type = ParameterType.STRING,
      repeatable = false,
      literal = false,
      defaultValue = null,
    } = options;

    this.name = name;
    this.description = description;
    this.optional = optional;
    this.type = type;
    this.repeatable = repeatable;
    this.literal = literal;
    this.defaultValue = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  }
}

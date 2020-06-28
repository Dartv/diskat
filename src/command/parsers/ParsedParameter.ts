import { ParameterDefinition } from '../../types';

export class ParsedParameter {
  name: ParameterDefinition['name'];
  description: ParameterDefinition['description'];
  optional: ParameterDefinition['optional'];
  type: ParameterDefinition['type'];
  repeatable: ParameterDefinition['repeatable'];
  literal: ParameterDefinition['literal'];
  defaultValue: ParameterDefinition['defaultValue'];

  constructor(options: ParameterDefinition) {
    const {
      name,
      description = '',
      optional,
      type,
      repeatable,
      literal,
      defaultValue = null,
    } = options;

    this.name = name;
    this.description = description;
    this.optional = optional;
    this.type = type;
    this.repeatable = repeatable;
    this.literal = literal;
    this.defaultValue = defaultValue;
  }
}

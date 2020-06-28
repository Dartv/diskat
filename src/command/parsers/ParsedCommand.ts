import { ParsedCommandOptions } from '../../types';

export class ParsedCommand {
  raw: ParsedCommandOptions['raw'];
  trimmed: ParsedCommandOptions['trimmed'];
  identifier: ParsedCommandOptions['identifier'];
  args: ParsedCommandOptions['args'];
  rawArgs: ParsedCommandOptions['rawArgs'];

  constructor(options: ParsedCommandOptions) {
    Object.assign(this, options);
  }
}

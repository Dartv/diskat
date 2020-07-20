import { DiskatError } from './DiskatError';
import { ParsedParameter } from '../types';

export class ArgumentParserError extends DiskatError {
  public rule: ParsedParameter;
}

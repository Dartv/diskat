import { Message } from 'discord.js';

import { CommandParserError } from '../../errors/CommandParserError';
import { ParsedCommand } from './ParsedCommand';

export class CommandParser {
  static parse(message: Message, prefix: string | RegExp): ParsedCommand {
    const trimmed = message.content.replace(prefix, '').trim();
    const split = trimmed.split(' ').filter(Boolean);

    if (!split.length) {
      throw new CommandParserError('Message does not contain enough words to specify a command');
    }

    const [identifier, ...args] = split;

    return new ParsedCommand({
      raw: message.content,
      trimmed,
      identifier,
      args,
      rawArgs: args.join(' '),
    });
  }
}

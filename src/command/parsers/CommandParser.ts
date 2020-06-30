import { Message } from 'discord.js';

import type { ParsedCommand } from '../../types';
import { CommandParserError } from '../../errors/CommandParserError';

export class CommandParser {
  static parse(message: Message, prefix: string | RegExp): ParsedCommand {
    const trimmed = message.content.replace(prefix, '').trim();
    const split = trimmed.split(' ').filter(Boolean);

    if (!split.length) {
      throw new CommandParserError('Message does not contain enough words to specify a command');
    }

    const [identifier, ...args] = split;

    return {
      trimmed,
      identifier,
      args,
      rawArgs: args.join(' '),
      raw: message.content,
    };
  }
}

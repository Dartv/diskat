import { Collection } from 'discord.js';

import { CommandOptions, Middleware, CommandHandler, Context, CommandResponse } from '../types';
import { composeMiddleware } from '../utils/middleware';
import { CommandGroup } from './CommandGroup';
import { ParameterParser } from './parsers/ParameterParser';
import { ParsedParameter } from './parsers/ParsedParameter';

export class Command {
  handler: CommandHandler;
  originalHandler: CommandHandler;
  name: string;
  aliases: string[];
  parameters: ParsedParameter[];
  group: string;
  description: string;
  dependencies: Collection<string, any>;
  middleware: Middleware[];

  constructor(options: CommandOptions) {
    const {
      triggers,
      handler,
      parameters = [],
      dependencies = [],
      group = '',
      description = '',
      middleware = [],
    } = options;
    const [name, ...aliases] = triggers;

    this.name = name;
    this.aliases = aliases;
    this.group = group;
    this.description = description;

    this.parameters = ParameterParser.validate(...parameters);

    this.dependencies = Array.isArray(dependencies)
      ? new Collection(dependencies.map(serviceName => [serviceName, serviceName]))
      : new Collection(Object.entries(dependencies));

    this.handler = Command.generateHandler(handler, middleware);

    this.originalHandler = handler;

    this.middleware = middleware;
  }

  static generateHandler(
    handler: CommandHandler,
    middleware: Middleware[],
  ): (context: Context) => Promise<CommandResponse> {
    return composeMiddleware(...middleware, handler);
  }

  async handle(context: Context): Promise<CommandResponse> {
    return this.handler(context);
  }

  linkGroup(commandGroup: CommandGroup): this {
    commandGroup.on('middlewareUpdate', (layers) => {
      this.handler = Command.generateHandler(this.originalHandler, [
        ...layers,
        ...this.middleware,
      ]);
    });

    return this;
  }
}

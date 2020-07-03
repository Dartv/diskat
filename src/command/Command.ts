import { Collection } from 'discord.js';

import type {
  CommandOptions,
  Middleware,
  CommandHandler,
  Context,
  CommandResponse,
  ParsedParameter,
} from '../types';
import type { CommandGroup } from './CommandGroup';
import { composeMiddleware } from '../utils/middleware';
import { ParameterParser } from './parsers/ParameterParser';

export class Command {
  handler: CommandHandler<any, any>;
  originalHandler: CommandHandler;
  name: string;
  aliases: string[];
  parameters: ParsedParameter[];
  group: string;
  description: string;
  dependencies: Collection<string, string>;
  middleware: Middleware[];
  meta: Record<string, unknown>;

  constructor(options: CommandOptions) {
    const {
      triggers,
      handler,
      parameters = [],
      dependencies = [],
      group = '',
      description = '',
      middleware = [],
      meta = {},
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

    this.originalHandler = handler;
    this.middleware = middleware;
    this.meta = meta;
    this.handler = Command.generateHandler(handler, middleware);
  }

  static generateHandler(
    handler: CommandHandler,
    middleware: Middleware[],
  ): (context: Context) => Promise<CommandResponse<unknown>> {
    return composeMiddleware(...middleware, handler);
  }

  async handle<T>(context: Context): Promise<CommandResponse<T>> {
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

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

export class Command<T extends Context, R> {
  handler: CommandHandler<T, R>;
  originalHandler: CommandHandler<T, R>;
  name: string;
  aliases: string[];
  parameters: ParsedParameter[];
  group: string;
  description: string;
  dependencies: Collection<string, string>;
  middleware: Middleware[];

  constructor(options: CommandOptions<T, R>) {
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

    this.originalHandler = handler;
    this.middleware = middleware;
    this.handler = composeMiddleware(...middleware, handler);
  }

  async handle<Context extends T = T, Result extends R = R>(context: Context): Promise<CommandResponse<Result>> {
    return this.handler(context);
  }

  linkGroup(commandGroup: CommandGroup<Command<T, R>>): this {
    commandGroup.on('middlewareUpdate', (layers) => {
      this.handler = composeMiddleware(...[...layers, ...this.middleware], this.originalHandler);
    });

    return this;
  }
}

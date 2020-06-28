import { Collection } from 'discord.js';

import { CommandOptions, Middleware, CommandHandler } from '../types';
import { composeMiddleware } from '../utils/middleware';
import { CommandGroup } from './CommandGroup';

export class Command {
  handler: CommandOptions['handler'];
  originalHandler: CommandOptions['handler'];
  name: string;
  aliases: string[];
  parameters: CommandOptions['parameters'];
  group: CommandOptions['group'];
  description: CommandOptions['description'];
  dependencies: CommandOptions['dependencies'];
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
    this.parameters = parameters;
    this.group = group;
    this.description = description;

    this.dependencies = Array.isArray(dependencies)
      ? new Collection(dependencies.map(serviceName => [serviceName, serviceName]))
      : new Collection(Object.entries(dependencies));

    this.handler = Command.generateHandler(handler, middleware);

    this.originalHandler = handler;

    this.middleware = middleware;
  }

  static generateHandler(handler: CommandHandler<any>, middleware: Middleware[]): ReturnType<typeof composeMiddleware> {
    return composeMiddleware(...middleware, handler);
  }

  handle(context: any): any {
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

export interface ServiceOptions {
  aliases: string[];
  builder?: any;
  instance?: any;
}

export abstract class Service {
  aliases: ServiceOptions['aliases'];
  builder?: ServiceOptions['builder'];
  instance?: ServiceOptions['instance'];

  constructor(options: ServiceOptions) {
    const {
      aliases,
      builder,
      instance,
    } = options;

    this.aliases = aliases;
    this.builder = builder;
    this.instance = instance;
  }

  abstract get service(): any;
}

import { Collection } from 'discord.js';

import type { ServiceInstance } from '../types';

export class ServiceContainer extends Collection<string, ServiceInstance> {
  aliases: Collection<string, string> = new Collection();

  set<T>(identifier: string | string[], value: T): this {
    const [name, ...aliases] = Array.isArray(identifier) ? identifier : [identifier];

    super.set(name, {
      aliases,
      instance: value,
    });

    aliases.forEach((alias) => {
      this.aliases.set(alias, name);
    });

    return this;
  }

  delete(identifier: string): boolean {
    const mainBinding = this.getMainBinding(identifier);

    if (!mainBinding || !this.has(mainBinding)) {
      return false;
    }

    const entry = super.get(mainBinding);

    if (!entry) return false;

    entry.aliases.forEach((alias) => {
      this.aliases.delete(alias);
    });

    return super.delete(mainBinding);
  }

  has(identifier: string): boolean {
    return this.aliases.has(identifier) || super.has(identifier);
  }

  get<T>(identifier: string): ServiceInstance<T>['instance'] | undefined {
    const mainBinding = this.getMainBinding(identifier);

    if (!mainBinding || !this.has(mainBinding)) {
      return undefined;
    }

    return super.get(mainBinding)?.instance as T;
  }

  getMainBinding(alias: string): string | undefined {
    return this.has(alias) ? alias : this.aliases.get(alias);
  }
}

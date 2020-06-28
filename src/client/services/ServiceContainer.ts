import { Collection } from 'discord.js';
import { Service } from './Service';
import { ServiceType } from '../../types';
import { ConstructedService } from './ConstructedService';
import { SingletonService } from './SingletonService';
import { InstanceService } from './InstanceService';

export class ServiceContainer {
  services: Collection<string, Service> = new Collection();
  aliases: Collection<string, string> = new Collection;

  get mainBindings(): IterableIterator<string> {
    return this.services.keys();
  }

  construct(identifier: string | string[], builder: any): this {
    return this.addService(ServiceType.CONSTRUCTED, identifier, builder);
  }

  singleton(identifier: string | string[], builder): this {
    return this.addService(ServiceType.SINGLETON, identifier, builder);
  }

  instance(identifier: string | string[], value: any): this {
    return this.addService(ServiceType.INSTANCE, identifier, value);
  }

  bindProviders(...providers): this {
    providers.forEach((provider) => {
      provider({ container: this });
    });

    return this;
  }

  unbind(identifier: string): this {
    const mainBinding = this.getMainBinding(identifier);

    if (!mainBinding || !this.services.has(mainBinding)) {
      return this;
    }

    const entry = this.services.get(mainBinding);

    entry?.aliases.forEach((alias) => {
      this.aliases.delete(alias);
    });

    return this;
  }

  has(identifier: string): boolean {
    return this.aliases.has(identifier) || this.services.has(identifier);
  }

  get(identifier: string): Service | null {
    const mainBinding = this.getMainBinding(identifier);

    if (!mainBinding || !this.services.has(mainBinding)) {
      return null;
    }

    const service = this.services.get(mainBinding);

    if (!service) return null;

    return service.service;
  }

  getMainBinding(alias: string): string | undefined {
    return this.services.has(alias) ? alias : this.aliases.get(alias);
  }

  addService(type: ServiceType, identifier: string | string[], service: Service): this {
    const [name, ...aliases] = Array.isArray(identifier) ? identifier : [identifier];

    switch (type) {
      case ServiceType.CONSTRUCTED: {
        this.services.set(name, new ConstructedService(aliases, service));
        break;
      }
      case ServiceType.SINGLETON: {
        this.services.set(name, new SingletonService(aliases, service));
        break;
      }
      case ServiceType.INSTANCE: {
        this.services.set(name, new InstanceService(aliases, service));
        break;
      }
      default:
        throw new Error('Unrecognized service type');
    }

    aliases.forEach((alias) => {
      this.aliases.set(alias, name);
    });

    return this;
  }
}

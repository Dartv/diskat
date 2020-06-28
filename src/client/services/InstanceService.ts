import { Service } from './Service';

export class InstanceService extends Service {
  instance: Service['instance'];

  constructor(aliases: Service['aliases'], instance: Service['instance']) {
    super({ aliases, instance });
  }

  get service(): any {
    return this.instance;
  }
}

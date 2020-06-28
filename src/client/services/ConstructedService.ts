import { Service } from './Service';

export class ConstructedService extends Service {
  builder: (...args: any[]) => any;
  
  constructor(aliases: Service['aliases'], builder: Service['builder']) {
    super({ aliases, builder });
  }

  get service() {
    return this.builder();
  }
}

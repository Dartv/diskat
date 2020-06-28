import { Service } from './Service';

export class SingletonService extends Service {
  builder: (...args: any[]) => any;
  aliases: Service['aliases'];

  constructor(aliases: Service['aliases'], builder: Service['builder']) {
    super({ aliases, builder });
  }

  get service() {
    if (!this.instance) {
      this.instance = this.builder();
    }

    return this.instance;
  }
}

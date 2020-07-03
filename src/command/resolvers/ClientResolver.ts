import { User, Collection, GuildMember, Channel, Role } from 'discord.js';

import type { Client } from '../../client/Client';
import type { Command } from '../Command';
import { CommandRegistry } from '../CommandRegistry';

export class ClientResolver {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  resolveUser(resolvable: string, users = this.client.users.cache): User | undefined {
    return users.get(resolvable) || users.find((user) => ClientResolver.checkUser(resolvable, user));
  }

  resolveUsers(resolvable: string, users = this.client.users.cache): Collection<string, User> {
    return users.filter((user) => ClientResolver.checkUser(resolvable, user));
  }

  resolveMember(
    resolvable: string,
    members: Collection<string, GuildMember> = new Collection(),
  ): GuildMember | undefined {
    return members.get(resolvable) || members.find((member) => ClientResolver.checkMember(resolvable, member));
  }

  resolveMembers(
    resolvable: string,
    members: Collection<string, GuildMember> = new Collection(),
  ): Collection<string, GuildMember> {
    return members.filter((member) => ClientResolver.checkMember(resolvable, member));
  }

  resolveChannel(
    resolvable: string,
    channels: Collection<string, Channel> = new Collection(),
    options?: { type: keyof typeof ChannelType },
  ): Channel | undefined {
    const channel = channels.get(resolvable)
      || channels.find((channel) => ClientResolver.checkChannel(resolvable, channel));

    if (options?.type && options.type !== channel?.type) {
      return undefined;
    }

    return channel;
  }

  resolveRole(
    resolvable: string,
    roles: Collection<string, Role> = new Collection(),
  ): Role | undefined {
    return roles.get(resolvable) || roles.find((role) => ClientResolver.checkRole(resolvable, role));
  }

  resolveCommand(
    resolvable: string,
    commands: CommandRegistry = new CommandRegistry(this.client),
  ): Command | undefined {
    return commands.get(resolvable);
  }

  static checkUser(resolvable: string, user: User): boolean {
    if (user.id === resolvable) return true;

    const userId = ClientResolver.getUserIdFromMention(resolvable);

    if (userId === user.id) return true;

    const username = `${user.username.toLowerCase()}#${user.discriminator}`;

    return resolvable.toLowerCase() === username;
  }

  static checkMember(resolvable: string, member: GuildMember): boolean {
    return ClientResolver.checkUser(resolvable, member.user);
  }

  static checkChannel(resolvable: string, channel: Channel & { name?: string }): boolean {
    if (channel.id === resolvable) return true;

    const channelId = ClientResolver.getChannelIdFromMention(resolvable);

    if (channelId === channel.id) return true;

    return resolvable.toLowerCase() === (channel.name || '').toLowerCase();
  }

  static checkRole(resolvable: string, role: Role): boolean {
    if (role.id === resolvable) return true;

    const roleId = ClientResolver.getRoleIdFromMention(resolvable);

    if (roleId === role.id) return true;

    return resolvable.toLowerCase() === role.name.toLowerCase();
  }

  static getRoleIdFromMention(mention: string): string | undefined {
    return mention.match(/<@&(\d{17,19})>/)?.[1];
  }

  static getChannelIdFromMention(mention: string): string | undefined {
    return mention.match(/<#(\d{17,19})>/)?.[1];
  }

  static getUserIdFromMention(mention: string): string | undefined {
    return mention.match(/<@!?(\d{17,19})>/)?.[1];
  }
}

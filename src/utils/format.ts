import { User, GuildMember } from 'discord.js';

export function formatUser(user: User, member?: GuildMember | null): string {
  const tag = user.discriminator !== '0'
    ? `${user.username}#${user.discriminator}`
    : user.username;
  return member?.nickname ? `${tag} (${member.nickname})` : tag;
}

export function snowflakeToMs(snowflake: string): number {
  return Number(BigInt(snowflake) >> 22n) + 1420070400000;
}

export function dt(ms: number, format: 'F' | 'R' | 'f' | 'd' | 'D' | 't' | 'T' = 'F'): string {
  return `<t:${Math.floor(ms / 1000)}:${format}>`;
}

export function intToHex(num: number): string {
  return `#${(num >>> 0).toString(16).padStart(6, '0').toUpperCase()}`;
}

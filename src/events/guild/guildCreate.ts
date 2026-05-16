import { Events, Guild } from 'discord.js';
import { BotClient } from '../../types';
import { createGuild } from '../../database';
import { cacheGuildInvites } from '../../utils/inviteCache';
import { logger } from '../../utils/logger';

export const name = Events.GuildCreate;
export const once = false;

export async function execute(_client: BotClient, guild: Guild): Promise<void> {
  createGuild(guild.id, guild.ownerId);
  await cacheGuildInvites(guild);
  logger.info(`Joined guild: ${guild.name} (${guild.id})`);
}

import { Events, ActivityType } from 'discord.js';
import { BotClient } from '../../types';
import { getOrCreateGuild, cleanOldMessages } from '../../database';
import { cacheGuildInvites } from '../../utils/inviteCache';
import { logger } from '../../utils/logger';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: BotClient): Promise<void> {
  logger.info(`Logged in as ${client.user!.tag}`);

  client.user!.setActivity('your server', { type: ActivityType.Watching });

  for (const guild of client.guilds.cache.values()) {
    getOrCreateGuild(guild.id, guild.ownerId);
    await cacheGuildInvites(guild);
  }

  // Clean up old messages every hour
  cleanOldMessages();
  setInterval(cleanOldMessages, 60 * 60 * 1000);

  logger.info(`Ready! Serving ${client.guilds.cache.size} guilds`);
}

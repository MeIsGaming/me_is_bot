import { EmbedBuilder, TextChannel, NewsChannel, BufferResolvable } from 'discord.js';
import { BotClient, LogEventName } from '../types';
import { getOrCreateGuild } from '../database';
import { logger } from './logger';

interface SendOptions {
  embeds: EmbedBuilder[];
  files?: { attachment: BufferResolvable | Buffer; name: string }[];
}

export async function sendLog(
  client: BotClient,
  guildId: string,
  eventName: LogEventName,
  opts: SendOptions,
): Promise<void> {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const settings = getOrCreateGuild(guildId, guild.ownerId);
  if (settings.disabledEvents.includes(eventName)) return;

  const channelId = settings.eventLogs[eventName];
  if (!channelId) return;

  const channel = client.channels.cache.get(channelId);
  if (!channel || !(channel instanceof TextChannel || channel instanceof NewsChannel)) return;

  await channel.send(opts).catch(e => {
    logger.warn(`Failed to send log for ${eventName} in guild ${guildId}: ${e.message}`);
  });
}

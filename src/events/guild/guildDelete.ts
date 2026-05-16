import { Events, Guild } from 'discord.js';
import { BotClient } from '../../types';
import { deleteGuild } from '../../database';
import { removeGuild } from '../../utils/inviteCache';
import { logger } from '../../utils/logger';

export const name = Events.GuildDelete;
export const once = false;

export async function execute(_client: BotClient, guild: Guild): Promise<void> {
  deleteGuild(guild.id);
  removeGuild(guild.id);
  logger.info(`Left guild: ${guild.name} (${guild.id}) — data cleaned up`);
}

import { Events, Message } from 'discord.js';
import { BotClient } from '../../types';
import { cacheMessage, getOrCreateGuild } from '../../database';

export const name = Events.MessageCreate;
export const once = false;

export async function execute(_client: BotClient, message: Message): Promise<void> {
  if (!message.guild || !message.author) return;

  const settings = getOrCreateGuild(message.guild.id, message.guild.ownerId);
  if (!settings.logBots && message.author.bot) return;

  cacheMessage({
    id: message.id,
    authorId: message.author.id,
    guildId: message.guild.id,
    channelId: message.channel.id,
    content: message.content || '',
    createdAt: message.createdTimestamp,
  });
}

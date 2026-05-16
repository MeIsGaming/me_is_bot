import { Events, Collection, Message, PartialMessage, GuildTextBasedChannel, EmbedBuilder, Snowflake } from 'discord.js';
import { BotClient } from '../../types';
import { getMessagesByIds, deleteMessage, getOrCreateGuild } from '../../database';
import { sendLog } from '../../utils/sender';

export const name = Events.MessageBulkDelete;
export const once = false;

export async function execute(client: BotClient, messages: Collection<Snowflake, Message | PartialMessage>, channel: GuildTextBasedChannel): Promise<void> {
  const settings = getOrCreateGuild(channel.guild.id, channel.guild.ownerId);
  if (settings.ignoredChannels.includes(channel.id)) return;

  const ids = [...messages.keys()];
  const cached = getMessagesByIds(ids);

  for (const id of ids) deleteMessage(id);

  const embed = new EmbedBuilder()
    .setDescription(`**${messages.size}** messages bulk-deleted in <#${channel.id}>`)
    .setColor(0xED4245)
    .setTimestamp();

  if (cached.length === 0) {
    embed.addFields({ name: 'Note', value: 'No messages were in cache.' });
    await sendLog(client, channel.guild.id, 'messageDeleteBulk', { embeds: [embed] });
    return;
  }

  embed.addFields({ name: 'Cached', value: `${cached.length} of ${messages.size} messages recovered from cache` });

  const pasteContent = cached
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(m => {
      const user = client.users.cache.get(m.authorId);
      const username = user ? user.username : `Unknown (${m.authorId})`;
      return `[${new Date(m.createdAt).toUTCString()}] ${username}: ${m.content || '<no content>'}`;
    })
    .join('\n');

  await sendLog(client, channel.guild.id, 'messageDeleteBulk', {
    embeds: [embed],
    files: [{ attachment: Buffer.from(pasteContent, 'utf-8'), name: 'deleted-messages.txt' }],
  });
}

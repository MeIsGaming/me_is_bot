import { Events, Message, PartialMessage, EmbedBuilder } from 'discord.js';
import { BotClient } from '../../types';
import { getMessage, deleteMessage, getOrCreateGuild } from '../../database';
import { sendLog } from '../../utils/sender';
import { chunkify } from '../../utils/chunkify';
import { dt, snowflakeToMs } from '../../utils/format';

export const name = Events.MessageDelete;
export const once = false;

export async function execute(client: BotClient, message: Message | PartialMessage): Promise<void> {
  if (!message.guild) return;

  const settings = getOrCreateGuild(message.guild.id, message.guild.ownerId);
  if (settings.ignoredChannels.includes(message.channelId)) return;

  const cached = getMessage(message.id);
  if (!cached) return;

  deleteMessage(message.id);

  const guild = client.guilds.cache.get(cached.guildId);
  const author = guild?.members.cache.get(cached.authorId)?.user
    ?? client.users.cache.get(cached.authorId);

  if (!settings.logBots && author?.bot) return;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: author ? `${author.username} ${guild?.members.cache.get(author.id)?.nickname ? `(${guild.members.cache.get(author.id)?.nickname})` : ''}`.trim() : `Unknown (<@${cached.authorId}>)`,
      iconURL: author?.displayAvatarURL() ?? undefined,
    })
    .setDescription(`Message deleted in <#${cached.channelId}>`)
    .setColor(0x8B0000)
    .setTimestamp();

  const content = cached.content || '<no content>';
  const chunks = chunkify(content);
  chunks.forEach((chunk, i) => {
    embed.addFields({ name: i === 0 ? 'Content' : 'Continued', value: chunk });
  });

  embed.addFields(
    { name: 'Sent', value: dt(snowflakeToMs(message.id)) },
    { name: 'IDs', value: `\`\`\`ini\nUser = ${cached.authorId}\nMessage = ${cached.id}\nChannel = ${cached.channelId}\`\`\`` },
  );

  await sendLog(client, message.guild.id, 'messageDelete', { embeds: [embed] });
}

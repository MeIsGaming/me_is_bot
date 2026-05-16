import { Events, Message, PartialMessage, EmbedBuilder } from 'discord.js';
import { BotClient } from '../../types';
import { getMessage, updateMessageContent, getOrCreateGuild } from '../../database';
import { sendLog } from '../../utils/sender';
import { chunkify } from '../../utils/chunkify';

export const name = Events.MessageUpdate;
export const once = false;

export async function execute(client: BotClient, _old: Message | PartialMessage, newMsg: Message | PartialMessage): Promise<void> {
  if (!newMsg.guild || !newMsg.author) return;
  if (!newMsg.content) return;

  const settings = getOrCreateGuild(newMsg.guild.id, newMsg.guild.ownerId);
  if (!settings.logBots && newMsg.author.bot) return;
  if (settings.ignoredChannels.includes(newMsg.channelId)) return;

  const cached = getMessage(newMsg.id);
  if (!cached) return;
  if (cached.content === newMsg.content) return;

  const member = newMsg.guild.members.cache.get(newMsg.author.id);
  const displayName = member?.nickname
    ? `${newMsg.author.username} (${member.nickname})`
    : newMsg.author.username;

  const embed = new EmbedBuilder()
    .setAuthor({ name: displayName, iconURL: newMsg.author.displayAvatarURL() })
    .setDescription(`**${displayName}** edited a message in <#${newMsg.channelId}>`)
    .setColor(0xE67E22)
    .setTimestamp();

  const nowChunks = chunkify(newMsg.content);
  const wasChunks = chunkify(cached.content || '<no content>');

  nowChunks.forEach((c, i) => embed.addFields({ name: i === 0 ? 'Now' : 'Now (cont.)', value: c }));
  wasChunks.forEach((c, i) => embed.addFields({ name: i === 0 ? 'Previously' : 'Previously (cont.)', value: c }));
  embed.addFields(
    { name: 'Jump', value: `[Go to message](https://discord.com/channels/${newMsg.guild.id}/${newMsg.channelId}/${newMsg.id})` },
    { name: 'IDs', value: `\`\`\`ini\nUser = ${newMsg.author.id}\nMessage = ${newMsg.id}\`\`\`` },
  );

  updateMessageContent(newMsg.id, newMsg.content);
  await sendLog(client, newMsg.guild.id, 'messageUpdate', { embeds: [embed] });
}

import { Events, GuildEmoji, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog } from '../../utils/auditlog';

export const name = Events.GuildEmojiDelete;
export const once = false;

export async function execute(client: BotClient, emoji: GuildEmoji): Promise<void> {
  const { guild } = emoji;
  const log = await fetchAuditLog(guild, AuditLogEvent.EmojiDelete, emoji.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;

  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`Emoji deleted: \`:${emoji.name}:\``)
    .setColor(0xED4245)
    .setTimestamp()
    .addFields(
      { name: 'Name', value: emoji.name ?? 'Unknown', inline: true },
      { name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
      { name: 'IDs', value: `\`\`\`ini\nEmoji = ${emoji.id}\nPerpetrator = ${executor?.id ?? 'Unknown'}\`\`\`` },
    );

  await sendLog(client, guild.id, 'guildEmojisUpdate', { embeds: [embed] });
}

import { Events, GuildEmoji, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';
import { fetchAuditLog } from '../../utils/auditlog';

export const name = Events.GuildEmojiUpdate;
export const once = false;

export async function execute(client: BotClient, oldEmoji: GuildEmoji, newEmoji: GuildEmoji): Promise<void> {
  const { guild } = newEmoji;
  if (oldEmoji.name === newEmoji.name) return;

  const log = await fetchAuditLog(guild, AuditLogEvent.EmojiUpdate, newEmoji.id, { maxAgeMs: 5000, delayMs: 1000 });
  const executor = log?.executor;

  const embed = new EmbedBuilder()
    .setAuthor({ name: executor?.username ?? 'Unknown', iconURL: executor?.displayAvatarURL() ?? undefined })
    .setDescription(`Emoji updated: ${newEmoji.toString()}`)
    .setColor(0xFEE75C)
    .setTimestamp()
    .setThumbnail(newEmoji.url)
    .addFields(
      { name: 'Name', value: `Now: \`:${newEmoji.name}:\`\nWas: \`:${oldEmoji.name}:\`` },
      { name: 'IDs', value: `\`\`\`ini\nEmoji = ${newEmoji.id}\nPerpetrator = ${executor?.id ?? 'Unknown'}\`\`\`` },
    );

  await sendLog(client, guild.id, 'guildEmojisUpdate', { embeds: [embed] });
}

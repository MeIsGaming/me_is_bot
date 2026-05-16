import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
} from 'discord.js';
import { BotClient } from '../../types';

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export const data = new SlashCommandBuilder()
  .setName('botinfo')
  .setDescription('Show information about this bot');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const client = interaction.client as BotClient;

  const embed = new EmbedBuilder()
    .setTitle(client.user?.username ?? 'meisbot')
    .setThumbnail(client.user?.displayAvatarURL() ?? null)
    .setColor(0x5865F2)
    .addFields(
      { name: 'Uptime', value: formatUptime(client.uptime ?? 0), inline: true },
      { name: 'Guilds', value: client.guilds.cache.size.toString(), inline: true },
      { name: 'Commands', value: client.commands.size.toString(), inline: true },
      { name: 'Node.js', value: process.version, inline: true },
      { name: 'discord.js', value: `v14`, inline: true },
      { name: 'WebSocket ping', value: `${client.ws.ping}ms`, inline: true },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

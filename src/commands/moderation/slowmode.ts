import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags, ChannelType, TextChannel,
} from 'discord.js';
import { parseDuration, formatDuration } from '../../utils/duration';

export const data = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('Set slowmode for the current channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addStringOption(opt => opt
    .setName('duration')
    .setDescription('Slowmode interval e.g. 5s, 30s, 1m. Use "off" or "0" to disable.')
    .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild || interaction.channel?.type !== ChannelType.GuildText) {
    await interaction.reply({ content: 'This command can only be used in a text channel.', flags: MessageFlags.Ephemeral });
    return;
  }

  const channel = interaction.channel as TextChannel;
  const input = interaction.options.getString('duration', true).toLowerCase().trim();

  let seconds = 0;

  if (input !== 'off' && input !== '0') {
    const ms = parseDuration(input);
    if (!ms) {
      await interaction.reply({ content: 'Invalid duration. Examples: `5s`, `30s`, `1m`. Max is 6h.', flags: MessageFlags.Ephemeral });
      return;
    }
    seconds = Math.floor(ms / 1000);
    if (seconds > 21600) {
      await interaction.reply({ content: 'Maximum slowmode is 6 hours (21600 seconds).', flags: MessageFlags.Ephemeral });
      return;
    }
  }

  await channel.setRateLimitPerUser(seconds, `Set by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTimestamp();

  if (seconds === 0) {
    embed.setTitle('Slowmode disabled').setDescription(`Slowmode has been turned off in ${channel}.`);
  } else {
    embed.setTitle('Slowmode set').setDescription(`Slowmode set to **${formatDuration(seconds * 1000)}** in ${channel}.`);
  }

  await interaction.reply({ embeds: [embed] });
}

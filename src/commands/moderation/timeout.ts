import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';
import { parseDuration, formatDuration } from '../../utils/duration';

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('Timeout (or remove timeout from) a member')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt => opt.setName('user').setDescription('Member to timeout').setRequired(true))
  .addStringOption(opt => opt
    .setName('duration')
    .setDescription('Duration e.g. 10m, 1h, 2d, 7d. Omit to remove timeout.')
    .setRequired(false))
  .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser('user', true);
  const durationStr = interaction.options.getString('duration');
  const reason = interaction.options.getString('reason') ?? 'No reason provided';

  const member = interaction.guild.members.cache.get(target.id)
    ?? await interaction.guild.members.fetch(target.id).catch(() => null);

  if (!member) {
    await interaction.reply({ content: 'That user is not in this server.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!member.moderatable) {
    await interaction.reply({ content: 'I cannot timeout that member (role hierarchy or permissions).', flags: MessageFlags.Ephemeral });
    return;
  }

  const executorMember = interaction.guild.members.cache.get(interaction.user.id);
  if (executorMember && member.roles.highest.position >= executorMember.roles.highest.position) {
    await interaction.reply({ content: 'You cannot timeout someone with an equal or higher role.', flags: MessageFlags.Ephemeral });
    return;
  }

  if (!durationStr) {
    await member.disableCommunicationUntil(null, `Timeout removed | by ${interaction.user.tag}`);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('Timeout removed')
        .addFields({ name: 'User', value: `${target.username} (<@${target.id}>)` })
        .setColor(0x57F287)
        .setTimestamp()],
    });
    return;
  }

  const ms = parseDuration(durationStr);
  if (!ms) {
    await interaction.reply({ content: 'Invalid duration. Examples: `10m`, `1h`, `2d`', flags: MessageFlags.Ephemeral });
    return;
  }

  if (ms > MAX_TIMEOUT_MS) {
    await interaction.reply({ content: 'Maximum timeout duration is 28 days.', flags: MessageFlags.Ephemeral });
    return;
  }

  await member.disableCommunicationUntil(Date.now() + ms, `${reason} | by ${interaction.user.tag}`);

  const embed = new EmbedBuilder()
    .setTitle('Member timed out')
    .addFields(
      { name: 'User', value: `${target.username} (<@${target.id}>)`, inline: true },
      { name: 'Moderator', value: interaction.user.username, inline: true },
      { name: 'Duration', value: formatDuration(ms), inline: true },
      { name: 'Reason', value: reason },
    )
    .setColor(0xFFA500)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

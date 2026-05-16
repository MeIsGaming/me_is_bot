import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionFlagsBits, MessageFlags,
} from 'discord.js';
import { getWarnings, clearWarnings } from '../../database';
import { dt } from '../../utils/format';

export const data = new SlashCommandBuilder()
  .setName('warnings')
  .setDescription('View or clear warnings for a user')
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
  .addBooleanOption(opt => opt.setName('clear').setDescription('Clear all warnings for this user').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser('user', true);
  const shouldClear = interaction.options.getBoolean('clear') ?? false;

  if (shouldClear) {
    const count = clearWarnings(interaction.guild.id, target.id);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle('Warnings cleared')
        .setDescription(`Cleared **${count}** warning(s) for ${target.username} (<@${target.id}>).`)
        .setColor(0x57F287)
        .setTimestamp()],
    });
    return;
  }

  const warns = getWarnings(interaction.guild.id, target.id);

  const embed = new EmbedBuilder()
    .setTitle(`Warnings for ${target.username}`)
    .setThumbnail(target.displayAvatarURL())
    .setColor(warns.length === 0 ? 0x57F287 : 0xFFA500)
    .setTimestamp();

  if (warns.length === 0) {
    embed.setDescription('No warnings found.');
  } else {
    const lines = warns.slice(0, 20).map(w =>
      `**#${w.id}** — <@${w.moderatorId}> — ${dt(w.createdAt)}\n${w.reason}`
    );
    embed.setDescription(lines.join('\n\n').slice(0, 4000));
    embed.setFooter({ text: `${warns.length} warning(s) total` });
  }

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

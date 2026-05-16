import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
  PermissionsBitField, MessageFlags,
} from 'discord.js';
import { intToHex } from '../../utils/format';

const NOTABLE_PERMS: (keyof typeof PermissionsBitField.Flags)[] = [
  'Administrator', 'KickMembers', 'BanMembers', 'ManageChannels',
  'ManageGuild', 'ManageMessages', 'ManageRoles', 'ManageWebhooks',
  'MentionEveryone', 'ModerateMembers',
];

export const data = new SlashCommandBuilder()
  .setName('roleinfo')
  .setDescription('Show information about a role')
  .addRoleOption(opt => opt.setName('role').setDescription('Role to inspect').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const role = interaction.options.getRole('role', true);
  const fullRole = interaction.guild.roles.cache.get(role.id);

  if (!fullRole) {
    await interaction.reply({ content: 'Role not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const memberCount = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;

  const perms = NOTABLE_PERMS
    .filter(p => fullRole.permissions.has(PermissionsBitField.Flags[p]))
    .map(p => `\`${p}\``);

  const embed = new EmbedBuilder()
    .setTitle(fullRole.name)
    .setColor(fullRole.color || 0x99aab5)
    .addFields(
      { name: 'ID', value: fullRole.id, inline: true },
      { name: 'Color', value: fullRole.color ? `#${intToHex(fullRole.color)}` : 'None', inline: true },
      { name: 'Members', value: memberCount.toString(), inline: true },
      { name: 'Position', value: fullRole.position.toString(), inline: true },
      { name: 'Hoisted', value: fullRole.hoist ? 'Yes' : 'No', inline: true },
      { name: 'Mentionable', value: fullRole.mentionable ? 'Yes' : 'No', inline: true },
      { name: 'Managed (bot/integration)', value: fullRole.managed ? 'Yes' : 'No', inline: true },
      { name: 'Notable permissions', value: perms.length > 0 ? perms.join(', ') : 'None' },
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

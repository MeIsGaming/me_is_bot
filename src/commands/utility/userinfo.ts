import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, MessageFlags } from 'discord.js';
import { dt } from '../../utils/format';

const NOTABLE_PERMS: (keyof typeof PermissionsBitField.Flags)[] = [
  'Administrator', 'KickMembers', 'BanMembers', 'ManageChannels',
  'ManageGuild', 'ManageMessages', 'ManageRoles', 'ManageWebhooks',
  'MentionEveryone', 'ModerateMembers',
];

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Show information about a user')
  .addUserOption(opt => opt.setName('user').setDescription('User to look up (default: yourself)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return;
  }

  const target = interaction.options.getUser('user') ?? interaction.user;
  const member = interaction.guild.members.cache.get(target.id)
    ?? await interaction.guild.members.fetch(target.id).catch(() => null);

  const roles = member
    ? [...member.roles.cache.values()].filter(r => r.id !== interaction.guild!.id).sort((a, b) => b.position - a.position)
    : [];

  const perms = member
    ? NOTABLE_PERMS.filter(p => member.permissions.has(PermissionsBitField.Flags[p])).map(p => `\`${p}\``)
    : [];

  const embed = new EmbedBuilder()
    .setAuthor({ name: target.username, iconURL: target.displayAvatarURL() })
    .setThumbnail(member?.displayAvatarURL() ?? target.displayAvatarURL())
    .setColor(roles[0]?.color || 0x5865F2)
    .setTimestamp()
    .addFields(
      { name: 'User', value: `${target.username} (<@${target.id}>)${target.bot ? ' `BOT`' : ''}` },
      { name: 'Account created', value: dt(target.createdTimestamp) },
    );

  if (member) {
    embed.addFields(
      { name: 'Joined server', value: member.joinedTimestamp ? dt(member.joinedTimestamp) : 'Unknown' },
      { name: 'Roles', value: roles.length > 0 ? roles.slice(0, 20).map(r => `\`${r.name}\``).join(', ') : 'None' },
      { name: 'Notable permissions', value: perms.length > 0 ? perms.join(', ') : 'None' },
    );
  }

  embed.addFields({ name: 'ID', value: `\`${target.id}\`` });

  await interaction.reply({ embeds: [embed] });
}

import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('avatar')
  .setDescription('Show a user\'s avatar')
  .addUserOption(opt => opt.setName('user').setDescription('User (default: yourself)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser('user') ?? interaction.user;

  const member = interaction.guild?.members.cache.get(target.id)
    ?? await interaction.guild?.members.fetch(target.id).catch(() => null);

  const globalUrl = target.displayAvatarURL({ size: 1024 });
  const guildUrl = member?.displayAvatarURL({ size: 1024 });

  const embed = new EmbedBuilder()
    .setTitle(`${target.username}'s avatar`)
    .setImage(guildUrl ?? globalUrl)
    .setColor(0x5865F2)
    .setTimestamp();

  if (guildUrl && guildUrl !== globalUrl) {
    embed.setThumbnail(globalUrl);
    embed.setFooter({ text: 'Large: server avatar · Small: global avatar' });
  }

  await interaction.reply({ embeds: [embed] });
}

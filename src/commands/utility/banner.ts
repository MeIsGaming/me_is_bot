import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('banner')
  .setDescription('Show a user\'s profile banner')
  .addUserOption(opt => opt.setName('user').setDescription('User (default: yourself)').setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const target = interaction.options.getUser('user') ?? interaction.user;

  // Must fetch to get banner — it's not cached by default
  const fetched = await target.fetch().catch(() => null);
  const bannerUrl = fetched?.bannerURL({ size: 1024 });

  if (!bannerUrl) {
    await interaction.reply({ content: `${target.username} does not have a banner.`, flags: MessageFlags.Ephemeral });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${target.username}'s banner`)
    .setImage(bannerUrl)
    .setColor(fetched?.accentColor ?? 0x5865F2)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

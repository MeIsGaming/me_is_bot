import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('coinflip')
  .setDescription('Flip a coin');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const heads = Math.random() < 0.5;

  const embed = new EmbedBuilder()
    .setTitle(heads ? 'Heads!' : 'Tails!')
    .setDescription(heads ? '🪙 Heads' : '🪙 Tails')
    .setColor(heads ? 0xFEE75C : 0x5865F2)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

import {
  SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a yes/no poll (or custom options)')
  .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
  .addStringOption(opt => opt
    .setName('options')
    .setDescription('Custom options separated by | (leave empty for yes/no)')
    .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const question = interaction.options.getString('question', true);
  const rawOptions = interaction.options.getString('options');

  const OPTION_EMOJIS = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯'];

  let options: string[];
  let emojis: string[];

  if (rawOptions) {
    options = rawOptions.split('|').map(s => s.trim()).filter(s => s.length > 0);
    if (options.length < 2 || options.length > 10) {
      await interaction.reply({ content: 'Please provide 2-10 options separated by `|`.', flags: MessageFlags.Ephemeral });
      return;
    }
    emojis = OPTION_EMOJIS.slice(0, options.length);
  } else {
    options = ['Yes', 'No'];
    emojis = ['👍', '👎'];
  }

  const description = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('📊 ' + question)
    .setDescription(description)
    .setColor(0x5865F2)
    .setFooter({ text: `Poll by ${interaction.user.username}` })
    .setTimestamp();

  const { resource } = await interaction.reply({ embeds: [embed], withResponse: true });
  const message = resource?.message;

  if (message) {
    for (const emoji of emojis) {
      await message.react(emoji).catch(() => {});
    }
  }
}

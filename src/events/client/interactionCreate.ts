import { Events, Interaction, MessageFlags } from 'discord.js';
import { BotClient } from '../../types';
import { logger } from '../../utils/logger';

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(client: BotClient, interaction: Interaction): Promise<void> {
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction);
    } catch (e) {
      logger.error(`Autocomplete error for ${interaction.commandName}:`, e);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (e) {
    logger.error(`Error executing command ${interaction.commandName}:`, e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'An error occurred while executing this command.', flags: MessageFlags.Ephemeral }).catch(() => {});
    } else {
      await interaction.reply({ content: 'An error occurred while executing this command.', flags: MessageFlags.Ephemeral }).catch(() => {});
    }
  }
}

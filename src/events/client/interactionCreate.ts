import { Events, Interaction } from 'discord.js';
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
    const msg = { content: 'An error occurred while executing this command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg).catch(() => {});
    } else {
      await interaction.reply(msg).catch(() => {});
    }
  }
}

import { readdirSync } from 'fs';
import { join } from 'path';
import { BotClient } from '../types';
import { logger } from '../utils/logger';

export function loadCommands(client: BotClient): void {
  const commandsPath = join(__dirname, '..', 'commands');
  const categories = readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const files = readdirSync(categoryPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
      const command = require(join(categoryPath, file));
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        logger.debug(`Loaded command: ${command.data.name}`);
      } else {
        logger.warn(`Skipping invalid command file: ${file}`);
      }
    }
  }

  logger.info(`Loaded ${client.commands.size} commands`);
}

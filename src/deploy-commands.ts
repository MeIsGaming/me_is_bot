import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { logger } from './utils/logger';

const commands: unknown[] = [];
const commandsPath = join(__dirname, 'commands');
const categories = readdirSync(commandsPath);

for (const category of categories) {
  const categoryPath = join(commandsPath, category);
  const files = readdirSync(categoryPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  for (const file of files) {
    const command = require(join(categoryPath, file));
    if ('data' in command) commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.BOT_TOKEN!);

(async () => {
  const guildId = process.env.DEV_GUILD_ID;
  const clientId = process.env.CLIENT_ID!;

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    logger.info(`Deployed ${commands.length} commands to guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    logger.info(`Deployed ${commands.length} commands globally`);
  }
})().catch(e => {
  logger.error('Failed to deploy commands:', e);
  process.exit(1);
});

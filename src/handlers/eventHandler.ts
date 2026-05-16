import { readdirSync } from 'fs';
import { join } from 'path';
import { BotClient } from '../types';
import { logger } from '../utils/logger';

export function loadEvents(client: BotClient): void {
  const eventsPath = join(__dirname, '..', 'events');
  const folders = readdirSync(eventsPath);
  let count = 0;

  for (const folder of folders) {
    const folderPath = join(eventsPath, folder);
    const files = readdirSync(folderPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
      const event = require(join(folderPath, file));
      if (!event.name || !event.execute) {
        logger.warn(`Skipping invalid event file: ${file}`);
        continue;
      }
      const handler = (...args: unknown[]) => event.execute(client, ...args);
      event.once ? client.once(event.name, handler) : client.on(event.name, handler);
      count++;
      logger.debug(`Loaded event: ${event.name}`);
    }
  }

  logger.info(`Loaded ${count} events`);
}

# meisbot

A modular Discord bot with comprehensive logging, moderation, and utility features. Started as a fork/rewrite of [curtisf/logger](https://github.com/curtisf/logger).

## Features

### Logging — 24 events, fully configurable

Route each event to a different channel. Use presets for quick setup or mix and match individual events.

| Preset | What it covers |
|--------|---------------|
| `voice` | joins, leaves, switches, server mute/deafen |
| `message` | deletes, edits, bulk deletes |
| `member` | role changes, nicknames, boosts, verification |
| `moderation` | bans, unbans, kicks |
| `joinlog` | joins and leaves |
| `server` | server setting changes |
| `role` | role created/deleted/updated |
| `channel` | channel created/deleted/updated |
| `all` | everything (all 24 events) |

### Moderation

| Command | Description |
|---------|-------------|
| `/kick <user> [reason]` | Kick a member (DMs them first, checks role hierarchy) |
| `/ban <user> [reason] [delete_days]` | Ban a user — works on members and non-members by ID |
| `/unban <user_id> [reason]` | Unban a user by ID |
| `/timeout <user> [duration] [reason]` | Timeout a member (`10m`, `1h`, `2d` — max 28 days). Omit duration to remove. |
| `/warn <user> [reason]` | Warn a member (saved to DB, DMs them) |
| `/warnings <user> [clear]` | View or clear a user's warnings |
| `/delwarn <id>` | Delete a specific warning by ID |
| `/purge <count> [user]` | Bulk delete up to 100 messages (<14 days old), optionally filter by user |
| `/lock [reason]` | Lock the current channel (deny @everyone from sending) |
| `/unlock [reason]` | Unlock the current channel |
| `/slowmode <duration>` | Set slowmode (`5s`, `30s`, `1m`) — use `off` to disable |

### Utility

| Command | Description |
|---------|-------------|
| `/ping` | Bot latency (roundtrip + WebSocket) |
| `/userinfo [user]` | Account age, server join date, roles, notable permissions |
| `/serverinfo` | Member/channel/role counts, boost level, features |
| `/avatar [user]` | Global and server avatar (shows both if different) |
| `/banner [user]` | Profile banner |
| `/roleinfo <role>` | Color, member count, permissions, position, hoisted |
| `/botinfo` | Uptime, guild count, Node.js version, WebSocket ping |
| `/archive [count]` | Save 5–100 recent messages to a `.txt` file |
| `/help [command]` | Command overview, or detailed info for a specific command |

### Fun

| Command | Description |
|---------|-------------|
| `/8ball <question>` | Ask the magic 8-ball |
| `/coinflip` | Heads or tails |
| `/choose <options>` | Pick randomly from a comma-separated list |
| `/poll <question> [options]` | Create a poll — yes/no by default, or up to 10 custom options (separated by `\|`) |

### Logging config commands

| Command | Permission |
|---------|-----------|
| `/log set <channel> [events]` | Route events to a channel — preset or comma-separated names, default: all | Manage Server |
| `/log remove [events]` | Remove log routing for events | Manage Server |
| `/log list` | Show current logging config | Manage Server |
| `/log events [event]` | List all events, or get info on a specific one | Manage Server |
| `/log ignorechannel [channel]` | Toggle a channel from being excluded from logging | Manage Server |
| `/log logbots` | Toggle whether bot actions are logged | Manage Server |
| `/log reset` | Reset all logging settings | Manage Server |

---

## Setup

### Prerequisites

- **Node.js 26+** (uses the built-in `node:sqlite`)
- A Discord bot application with these **privileged intents** enabled in the [Developer Portal](https://discord.com/developers/applications):
  - Server Members Intent
  - Message Content Intent

### Install

```bash
git clone https://github.com/MeIsGaming/me_is_bot.git
cd me_is_bot
npm install
```

### Configure

Create a `.env` file in the project root:

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
DEV_GUILD_ID=your_test_guild_id   # optional — guild-scoped commands deploy instantly during dev
DATABASE_PATH=./data/meisbot.db
LOG_LEVEL=info                     # debug | info | warn | error
```

### First run

```bash
# Register slash commands with Discord (run once, and again after adding new commands)
npm run deploy-commands

# Start with hot reload for development
npm run dev
```

### Production

```bash
npm run build   # compile TypeScript → dist/
npm start       # run compiled bot
```

Recommended: manage with `pm2` or a `systemd` service.

---

## Auto-deploy (webhook)

The `deploy/webhook.js` script listens on port 9001 and triggers a pull + rebuild on every push to `main`. Set it up on your server:

```bash
# Allow the port
ufw allow 9001/tcp

# Start the webhook receiver with pm2
WEBHOOK_SECRET=yourSecret pm2 start ~/meisbot/deploy/webhook.js --name meisbot-webhook
pm2 save
```

Then add a webhook in your GitHub repo settings:
- **Payload URL:** `http://<your-server-ip>:9001/hook`
- **Content type:** `application/json`
- **Secret:** same value as `WEBHOOK_SECRET`
- **Events:** Just the push event

---

## Project structure

```
src/
├── index.ts                   bot entry point, client setup, intents + partials
├── deploy-commands.ts         registers slash commands with Discord
├── types/index.ts             BotClient, Command, LogEventName, GuildSettings, Warning
├── database/index.ts          SQLite via node:sqlite — guild/message/warning helpers
├── utils/
│   ├── logger.ts              colored console logger (respects LOG_LEVEL)
│   ├── format.ts              formatUser, dt (Discord timestamps), snowflakeToMs, intToHex
│   ├── sender.ts              sendLog() — central dispatch to configured log channels
│   ├── chunkify.ts            splits long text into Discord-safe chunks
│   ├── auditlog.ts            fetchAuditLog(), executorInfo() (safe for PartialUser)
│   ├── inviteCache.ts         in-memory invite tracking for join events
│   └── duration.ts            parseDuration(), formatDuration() — "10m", "1h30m", "7d"
├── handlers/
│   ├── commandHandler.ts      auto-loads all commands from src/commands/**
│   └── eventHandler.ts        auto-loads all events from src/events/**
├── events/
│   ├── client/
│   │   ├── ready.ts           startup: guild init, invite cache, hourly DB cleanup
│   │   └── interactionCreate.ts  dispatches slash commands + autocomplete
│   └── guild/                 one file per Discord event (24 total)
└── commands/
    ├── logging/log.ts         /log subcommands
    ├── moderation/            kick, ban, unban, timeout, warn, warnings, delwarn, purge, lock, unlock, slowmode
    ├── utility/               ping, userinfo, serverinfo, avatar, banner, roleinfo, botinfo, archive, help
    └── fun/                   8ball, coinflip, choose, poll
```

---

## Extending the bot

### Adding a new log event

1. Create `src/events/guild/myEvent.ts`:

```typescript
import { Events } from 'discord.js';
import { BotClient } from '../../types';
import { sendLog } from '../../utils/sender';

export const name = Events.SomeEvent;
export const once = false;

export async function execute(client: BotClient, /* ...discord params */): Promise<void> {
  // build your embed, then:
  await sendLog(client, guild.id, 'myEventName', { embeds: [embed] });
}
```

2. Add `'myEventName'` to `LogEventName` in `src/types/index.ts`, and add it to `ALL_LOG_EVENTS` and `EVENT_DESCRIPTIONS`.

The event is picked up automatically — no imports or registrations needed.

### Adding a new command

Create `src/commands/<category>/myCommand.ts`:

```typescript
import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mycommand')
  .setDescription('Does something cool');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply('Hello!');
}
```

Then add it to `COMMAND_CATEGORIES` in `src/commands/utility/help.ts` and re-run `npm run deploy-commands`.

---

## Credits

Based on [curtisf/logger](https://github.com/curtisf/logger) by curtisf — licensed under [GPL-3.0](LICENSE).  
This project is also released under GPL-3.0.

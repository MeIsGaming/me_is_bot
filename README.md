# meisbot

A modular Discord logging bot. Fork/rewrite of [curtisf/logger](https://github.com/curtisf/logger) with extended features and a modern stack.

## Stack

- **[discord.js v14](https://discord.js.org/)** — Discord API wrapper
- **TypeScript 5.7** — fully typed throughout
- **Node.js 26+** with **`node:sqlite`** built-in — no native addon compilation, no better-sqlite3
- `tsx watch` for development, `tsc` for production

## Features

### 24 log events, all configurable per channel

Every event can be routed to a different channel. Use presets for quick setup or configure individual events.

| Preset | Events |
|--------|--------|
| `voice` | voiceChannelJoin, voiceChannelLeave, voiceChannelSwitch, voiceStateUpdate |
| `message` | messageDelete, messageDeleteBulk, messageUpdate |
| `member` | guildMemberUpdate, guildMemberNickUpdate, guildMemberVerify, guildMemberBoostUpdate |
| `moderation` | guildBanAdd, guildBanRemove, guildMemberKick |
| `joinlog` | guildMemberAdd, guildMemberRemove |
| `server` | guildUpdate |
| `role` | guildRoleCreate, guildRoleDelete, guildRoleUpdate |
| `channel` | channelCreate, channelDelete, channelUpdate |
| `all` | all 24 events |

### Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/log set <channel> [events]` | Route events to a channel (preset or comma-separated names, default: all) | Manage Server |
| `/log remove [events]` | Remove log channel for events | Manage Server |
| `/log list` | Show current logging configuration | Manage Server |
| `/log events [event]` | List all events, or describe a specific one | Manage Server |
| `/log ignorechannel [channel]` | Toggle a channel being excluded from logging | Manage Server |
| `/log logbots` | Toggle whether bot actions are logged | Manage Server |
| `/log reset` | Reset all logging settings for this server | Manage Server |
| `/archive [count]` | Save 5–100 recent messages as a `.txt` file | Manage Messages |
| `/ping` | Show bot latency (roundtrip + WebSocket) | — |
| `/userinfo [user]` | Show user info: roles, permissions, timestamps | — |
| `/serverinfo` | Show server info: member/channel/role counts | — |
| `/help [command]` | List all commands, or show details for one | — |

## Setup

### Prerequisites

- Node.js 26 or newer
- A Discord bot application with these **privileged intents** enabled in the Developer Portal:
  - **Server Members Intent**
  - **Message Content Intent**

### Install

```bash
git clone https://github.com/MeIsGaming/me_is_bot.git
cd me_is_bot
npm install
```

### Configure

```bash
cp .env.example .env
```

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id
DEV_GUILD_ID=your_test_guild_id   # only needed for dev (guild-scoped commands deploy instantly)
DATABASE_PATH=./data/meisbot.db
LOG_LEVEL=info                     # debug | info | warn | error
```

### First run

```bash
npm run deploy-commands   # register slash commands with Discord (run once, or after adding commands)
npm run dev               # start with hot reload
```

### Production

```bash
npm run build   # compile TypeScript → dist/
npm start       # run compiled bot
```

Recommended: manage with `pm2` or a `systemd` unit.

## Development

```bash
node_modules/.bin/tsc --noEmit   # type check without emitting files
npm run build                    # full compile
npm run dev                      # tsx watch (hot reload on file changes)
```

## Project structure

```
src/
├── index.ts                  — bot entry point, client setup, intents
├── deploy-commands.ts        — registers slash commands with Discord
├── types/index.ts            — BotClient, Command, LogEventName, PRESET_EVENT_MAP, GuildSettings
├── database/index.ts         — node:sqlite, all guild/message helpers, in-memory cache
├── utils/
│   ├── logger.ts             — colored console logger (respects LOG_LEVEL)
│   ├── format.ts             — formatUser, dt (Discord timestamps), snowflakeToMs, intToHex
│   ├── sender.ts             — sendLog(): dispatches embeds to the configured log channel
│   ├── chunkify.ts           — splits long text into Discord field-safe chunks
│   ├── auditlog.ts           — fetchAuditLog(), executorInfo() (safe for PartialUser)
│   └── inviteCache.ts        — in-memory invite cache for join tracking
├── handlers/
│   ├── commandHandler.ts     — auto-loads all commands from src/commands/**
│   └── eventHandler.ts       — auto-loads all events from src/events/**
├── events/
│   ├── client/
│   │   ├── ready.ts          — startup: guild init, invite cache, hourly DB cleanup
│   │   └── interactionCreate.ts — dispatches slash commands + autocomplete
│   └── guild/                — one file per Discord event (see list above)
└── commands/
    ├── logging/log.ts        — /log (set/remove/list/events/ignorechannel/logbots/reset)
    └── utility/              — /ping, /userinfo, /serverinfo, /archive, /help
```

## Adding a new log event

1. Create `src/events/guild/myEvent.ts`:

```typescript
import { Events } from 'discord.js';
import { BotClient } from '../../types';
export const name = Events.SomeEvent;
export const once = false;
export async function execute(client: BotClient, /* discord params */): Promise<void> {
  // build embed, then:
  await sendLog(client, guild.id, 'myEventName', { embeds: [embed] });
}
```

2. Add `'myEventName'` to `LogEventName` in `src/types/index.ts` and add it to `ALL_LOG_EVENTS` and `EVENT_DESCRIPTIONS`.

The event is picked up automatically — no import or registration needed.

## Credits

Based on [curtisf/logger](https://github.com/curtisf/logger) by curtisf, licensed under [GPL-3.0](LICENSE).
This project is also released under GPL-3.0.

import {
  ActivityType,
  ChannelType,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  GuildMember,
  Interaction,
  Message,
  PermissionFlagsBits,
  Presence,
  REST,
  Routes,
  TextChannel,
} from "discord.js";
import { rulesCommand, rulesExecute } from "./commands/rules.js";
import { startCommand, startExecute } from "./commands/start.js";
import { timeoutCommand, timeoutExecute } from "./commands/timeout.js";
import { kickCommand, kickExecute } from "./commands/kick.js";
import { banCommand, banExecute } from "./commands/ban.js";
import { revokeCommand, revokeExecute } from "./commands/revoke.js";
import { resetCommand, resetExecute } from "./commands/reset.js";
import { embedCommand, embedExecute } from "./commands/embed.js";
import { announceCommand, announceExecute } from "./commands/announce.js";
import { incrementPing, scheduleDailyReset } from "./pingTracker.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) throw new Error("DISCORD_BOT_TOKEN is not set");
if (!clientId) throw new Error("DISCORD_CLIENT_ID is not set");
if (!guildId) throw new Error("DISCORD_GUILD_ID is not set");

const commands = [
  rulesCommand,
  startCommand,
  timeoutCommand,
  kickCommand,
  banCommand,
  revokeCommand,
  resetCommand,
  embedCommand,
  announceCommand,
];

async function deployCommands(): Promise<void> {
  const rest = new REST().setToken(token!);
  await rest.put(Routes.applicationGuildCommands(clientId!, guildId), {
    body: commands.map((c) => c.toJSON()),
  });
  console.log("✅ Slash commands registered to guild.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("clientReady", async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  try {
    await deployCommands();
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
  scheduleDailyReset();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function tryDelete(message: Message): Promise<void> {
  try {
    await message.delete();
  } catch {
    console.error(`Could not delete message from ${message.author.tag}`);
  }
}

async function kickOrBan(
  member: GuildMember,
  reason: string,
): Promise<"kicked" | "banned" | "failed"> {
  if (member.kickable) {
    try {
      await member.kick(reason);
      return "kicked";
    } catch {
      // fall through to ban
    }
  }
  if (member.bannable) {
    try {
      await member.ban({ reason });
      return "banned";
    } catch {
      // nothing worked
    }
  }
  return "failed";
}

// ─── Exempted users — never punished by auto-moderation ──────────────────────

const EXEMPT_USER_IDS = new Set(["1282650997084262423"]);
// Only this role may use @here, @everyone, and bot commands.
const ALLOWED_ROLE_ID = "1494999337288339608";

function isExempt(member: GuildMember | null, guild: import("discord.js").Guild): boolean {
  if (!member) return false;
  if (EXEMPT_USER_IDS.has(member.id)) return true;
  if (guild.ownerId === member.id) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return false;
}

function hasAllowedRole(member: GuildMember | null): boolean {
  if (!member) return false;
  return member.roles.cache.has(ALLOWED_ROLE_ID);
}

// ─── Ping tracking ────────────────────────────────────────────────────────────

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;
  if (message.guildId !== guildId) return;
  if (message.reference !== null) return;

  const content = message.content;
  const hasHere = content.includes("@here");
  const hasEveryone = content.includes("@everyone");

  if (!hasHere && !hasEveryone) return;

  const userId = message.author.id;
  const member = message.member as GuildMember | null;

  // Server owner, administrators, and explicitly exempted IDs are never punished.
  if (isExempt(member, message.guild!)) return;

  const allowed = hasAllowedRole(member);

  try {
    if (hasEveryone) {
      // Allowed role may use @everyone freely — no action.
      if (allowed) return;
      await tryDelete(message);
      let action = "could not be removed";
      if (member) {
        const result = await kickOrBan(member, "Used @everyone");
        action =
          result === "kicked"
            ? "kicked"
            : result === "banned"
              ? "banned"
              : "could not be removed";
      }
      const embed = new EmbedBuilder()
        .setTitle("User Removed")
        .setDescription(
          [
            `**User:** <@${userId}>`,
            `**Reason:** Used @everyone`,
            `**Action:** ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          ].join("\n"),
        );
      await message.channel.send({ embeds: [embed] });
      console.log(`⚠️ @everyone by ${message.author.tag} — ${action}.`);
      return;
    }

    // @here — members without the allowed role cannot ping; delete silently.
    if (!allowed) {
      await tryDelete(message);
      return;
    }

    const newCount = incrementPing(userId);

    if (newCount === 1) {
      const embed = new EmbedBuilder().setDescription(
        `<@${userId}> — Ping **1/3**`,
      );
      await message.channel.send({ embeds: [embed] });
    } else if (newCount === 2) {
      const embed = new EmbedBuilder().setDescription(
        `<@${userId}> — Ping **2/3**`,
      );
      await message.channel.send({ embeds: [embed] });
    } else if (newCount === 3) {
      const embed = new EmbedBuilder().setDescription(
        `<@${userId}> — Ping **3/3 — limit reached**`,
      );
      await message.channel.send({ embeds: [embed] });
    } else {
      // 4th+ @here within the same 24-hour cycle
      await tryDelete(message);

      let action = "could not be removed";
      if (member) {
        const result = await kickOrBan(
          member,
          "4th @here ping — slot revoked",
        );
        action =
          result === "kicked"
            ? "kicked"
            : result === "banned"
              ? "banned"
              : "could not be removed";
      }

      const embed = new EmbedBuilder()
        .setTitle("Slot Revoked + User Kicked")
        .setDescription(
          [
            `**User:** <@${userId}>`,
            `**Reason:** 4th @here exceeded`,
            `**Action:** ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          ].join("\n"),
        );
      await message.channel.send({ embeds: [embed] });
      console.log(
        `⚠️ Slot revoked for ${message.author.tag} — 4th @here, ${action}.`,
      );
    }
  } catch (err) {
    console.error("Error in ping tracking:", err);
  }
});

// ─── !slot command ────────────────────────────────────────────────────────────

const SLOT_ROLE_NAME = "Slot";

client.on("messageCreate", async (message: Message) => {
  if (message.author.bot) return;
  if (message.guildId !== guildId) return;
  if (!message.content.trim().toLowerCase().startsWith("!slot")) return;

  if (
    !message.member?.permissions.has(PermissionFlagsBits.ManageChannels) &&
    !message.member?.permissions.has(PermissionFlagsBits.ManageRoles)
  ) {
    await message.reply("You do not have permission to use this command.");
    return;
  }

  const targetUser = message.mentions.users.first();
  const targetChannel = message.mentions.channels.first();

  if (!targetUser || !targetChannel) {
    await message.reply("Usage: `!slot @user #channel`");
    return;
  }

  if (
    targetChannel.type !== ChannelType.GuildText &&
    targetChannel.type !== ChannelType.GuildVoice
  ) {
    await message.reply("Please mention a valid text channel.");
    return;
  }

  const guild = message.guild!;

  try {
    let slotRole = guild.roles.cache.find((r) => r.name === SLOT_ROLE_NAME);
    if (!slotRole) {
      slotRole = await guild.roles.create({
        name: SLOT_ROLE_NAME,
        permissions: [PermissionFlagsBits.MentionEveryone],
        reason: "Auto-created by !slot command",
      });
      console.log(`✅ Created "${SLOT_ROLE_NAME}" role.`);
    }

    const targetMember = await guild.members.fetch(targetUser.id);
    await targetMember.roles.add(slotRole, "Granted via !slot command");

    const ch = targetChannel as TextChannel;
    await ch.permissionOverwrites.create(targetUser, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    const embed = new EmbedBuilder()
      .setTitle("Slot Granted")
      .setDescription(
        [
          `**User:** <@${targetUser.id}>`,
          `**Channel:** <#${targetChannel.id}>`,
          `**Role:** ${SLOT_ROLE_NAME}`,
          `Ping tracking active — 3 @here pings per day.`,
        ].join("\n"),
      );
    await message.channel.send({ embeds: [embed] });
    console.log(
      `✅ Slot granted to ${targetUser.tag} in #${ch.name} by ${message.author.tag}.`,
    );
  } catch (err) {
    console.error("Error in !slot command:", err);
    await message.reply("Failed to grant slot. Check bot permissions.");
  }
});

// ─── Vanity role — custom status tracking ─────────────────────────────────────

const VANITY_ROLE_ID = "1494999337288339609";
const VANITY_STATUS_TEXT = ".gg/trusted-mp";

async function syncVanityRole(presence: Presence): Promise<void> {
  if (presence.guild?.id !== guildId) return;

  const member = presence.member;
  if (!member || member.user.bot) return;

  const customActivity = presence.activities.find(
    (a) => a.type === ActivityType.Custom,
  );
  const hasVanityStatus =
    customActivity?.state?.includes(VANITY_STATUS_TEXT) ?? false;

  const hasRole = member.roles.cache.has(VANITY_ROLE_ID);

  // Only ever add the role — never remove it automatically under any condition.
  if (hasVanityStatus && !hasRole) {
    await member.roles.add(VANITY_ROLE_ID, "Custom status includes .gg/trusted-mp");
    console.log(`✅ Vanity role granted to ${member.user.tag}.`);
  }
}

client.on("presenceUpdate", async (_oldPresence: Presence | null, newPresence: Presence) => {
  try {
    await syncVanityRole(newPresence);
  } catch (err) {
    console.error("Error in vanity role sync:", err);
  }
});

// ─── Slash commands ───────────────────────────────────────────────────────────

const handlers: Record<string, (interaction: never) => Promise<void>> = {
  rules: rulesExecute,
  start: startExecute,
  timeout: timeoutExecute,
  kick: kickExecute,
  ban: banExecute,
  revoke: revokeExecute,
  reset: resetExecute,
  embed: embedExecute,
  announce: announceExecute,
};

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.guildId !== guildId) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "This bot is only available in the configured server.",
        ephemeral: true,
      });
    }
    return;
  }

  const handler = handlers[interaction.commandName];
  if (!handler) return;

  const interactionMember = interaction.member as GuildMember | null;

  // Only the server owner (1495075988571422790) can use bot commands.
  if (interactionMember?.id !== "1495075988571422790") {
    await interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await handler(interaction as never);
  } catch (err) {
    console.error(`Error handling /${interaction.commandName}:`, err);
    const msg = {
      content: "There was an error running this command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

client.login(M);

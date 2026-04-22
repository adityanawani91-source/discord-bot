import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const timeoutCommand = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Timeout a member")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to timeout").setRequired(true),
  )
  .addIntegerOption((option) =>
    option
      .setName("duration")
      .setDescription("Timeout duration in minutes")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(40320),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for the timeout").setRequired(false),
  );

export async function timeoutExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const duration = interaction.options.getInteger("duration", true);
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!target) {
    await interaction.reply({ content: "User not found in this server.", ephemeral: true });
    return;
  }

  if (!target.moderatable) {
    await interaction.reply({ content: "I cannot timeout this user.", ephemeral: true });
    return;
  }

  await target.timeout(duration * 60 * 1000, reason);

  const embed = new EmbedBuilder()
    .setTitle("Member Timed Out")
    .setDescription(
      [
        `**User:** ${target.user.tag}`,
        `**Duration:** ${duration} minute(s)`,
        `**Reason:** ${reason}`,
      ].join("\n"),
    );

  await interaction.reply({ embeds: [embed] });
}

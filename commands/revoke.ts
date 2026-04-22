import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const revokeCommand = new SlashCommandBuilder()
  .setName("revoke")
  .setDescription("Revoke a member's slot access")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to revoke").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for the revoke").setRequired(false),
  );

export async function revokeExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!target) {
    await interaction.reply({ content: "User not found in this server.", ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("Slot Access Revoked")
    .setDescription(
      [
        `**User:** ${target.user.tag}`,
        `**Reason:** ${reason}`,
      ].join("\n"),
    );

  await interaction.reply({ embeds: [embed] });
}

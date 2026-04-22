import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const kickCommand = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a member from the server")
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to kick").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for the kick").setRequired(false),
  );

export async function kickExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const reason = interaction.options.getString("reason") ?? "No reason provided";

  if (!target) {
    await interaction.reply({ content: "User not found in this server.", ephemeral: true });
    return;
  }

  if (!target.kickable) {
    await interaction.reply({ content: "I cannot kick this user.", ephemeral: true });
    return;
  }

  await target.kick(reason);

  const embed = new EmbedBuilder()
    .setTitle("Member Kicked")
    .setDescription(
      [
        `**User:** ${target.user.tag}`,
        `**Reason:** ${reason}`,
      ].join("\n"),
    );

  await interaction.reply({ embeds: [embed] });
}

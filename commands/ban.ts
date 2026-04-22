import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const banCommand = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a member from the server")
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to ban").setRequired(true),
  )
  .addStringOption((option) =>
    option.setName("reason").setDescription("Reason for the ban").setRequired(false),
  )
  .addIntegerOption((option) =>
    option
      .setName("delete_days")
      .setDescription("Number of days of messages to delete (0-7)")
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false),
  );

export async function banExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getMember("user") as GuildMember | null;
  const reason = interaction.options.getString("reason") ?? "No reason provided";
  const deleteDays = interaction.options.getInteger("delete_days") ?? 0;

  if (!target) {
    await interaction.reply({ content: "User not found in this server.", ephemeral: true });
    return;
  }

  if (!target.bannable) {
    await interaction.reply({ content: "I cannot ban this user.", ephemeral: true });
    return;
  }

  await target.ban({ reason, deleteMessageDays: deleteDays });

  const embed = new EmbedBuilder()
    .setTitle("Member Banned")
    .setDescription(
      [
        `**User:** ${target.user.tag}`,
        `**Reason:** ${reason}`,
        `**Messages Deleted:** ${deleteDays} day(s)`,
      ].join("\n"),
    );

  await interaction.reply({ embeds: [embed] });
}

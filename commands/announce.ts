import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const announceCommand = new SlashCommandBuilder()
  .setName("announce")
  .setDescription("Send an embedded announcement")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addStringOption((option) =>
    option.setName("title").setDescription("Announcement title").setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("Announcement description")
      .setRequired(true),
  );

export async function announceExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const title = interaction.options.getString("title", true);
  const description = interaction.options.getString("description", true);

  const embed = new EmbedBuilder().setTitle(title).setDescription(description);

  await interaction.deferReply({ ephemeral: true });
  await interaction.channel?.send({ embeds: [embed] });
  await interaction.editReply({ content: "Announcement sent." });
}

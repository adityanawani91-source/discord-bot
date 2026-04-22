import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { resetUserPings } from "../pingTracker.js";

export const resetCommand = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("Reset a member's ping count")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addUserOption((option) =>
    option.setName("user").setDescription("The user to reset").setRequired(true),
  );

export async function resetExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const target = interaction.options.getMember("user") as GuildMember | null;

  if (!target) {
    await interaction.reply({ content: "User not found in this server.", ephemeral: true });
    return;
  }

  resetUserPings(target.id);

  const embed = new EmbedBuilder()
    .setTitle("Ping Count Reset")
    .setDescription(`**${target.user.tag}**'s ping count has been reset to 0/3.`);

  await interaction.reply({ embeds: [embed] });
}

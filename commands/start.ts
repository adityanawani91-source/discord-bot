import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export const startCommand = new SlashCommandBuilder()
  .setName("start")
  .setDescription("Start the slot session");

export async function startExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("Slot Session Started")
    .setDescription("The slot session has been started. Use your pings wisely!");

  await interaction.reply({ embeds: [embed] });
}

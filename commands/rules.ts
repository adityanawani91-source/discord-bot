import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export const rulesCommand = new SlashCommandBuilder()
  .setName("rules")
  .setDescription("View the slot rules");

export async function rulesExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("Slot Rules")
    .setDescription(
      [
        "• 3 pings allowed per day",
        "• 1st Ping = 1/3",
        "• 2nd Ping = 2/3",
        "• 3rd Ping = 3/3 limit reached",
        "• 4th Ping = Slot Revoked",
        "• Promotion is not allowed",
      ].join("\n"),
    );

  await interaction.reply({ embeds: [embed] });
}

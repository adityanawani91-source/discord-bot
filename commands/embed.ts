import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";

export const embedCommand = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Send the trusted MP rules embed");

export async function embedExecute(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle("TRUSTED MP RULES")
    .setDescription(
      [
        "> - **Community Behavior**",
        ">   - Respect all members at all times.",
        ">   - Do not post disturbing, explicit, or harmful content (NSFW, gore, extreme violence, etc.).",
        ">   - Harassment, bullying, hate speech, or discriminatory language is strictly forbidden.",
        ">   - Do not insult, threaten, or intentionally provoke other users.",
        ">   - Spamming messages, reactions, or mentions is not allowed.",
        ">   - Mass pinging members, staff, or roles is prohibited.",
        ">   - Sharing personal or private information (yours or others) is not allowed.",
        ">   - Trolling, baiting, or intentionally disruptive behavior may result in punishment.",
        "",
        "> - **Promotion & Advertising**",
        ">   - Advertising is not allowed without prior approval from staff.",
        ">   - Sending unsolicited promotions or server invites through direct messages is prohibited.",
        ">   - Posting advertisements, referral links, or sales content in chat is not permitted.",
        ">   - Repeated promotion attempts may result in an instant ban.",
        "",
        "> - **Language & Communication**",
        ">   - Keep language appropriate and respectful at all times.",
        ">   - Excessive swearing or vulgar language is not allowed.",
        ">   - Offensive, targeted, or discriminatory remarks will result in disciplinary action.",
        ">   - Threatening or aggressive language is strictly forbidden.",
        "",
        "> - **General Guidelines**",
        ">   - Use of bots, macros, or automated tools without permission is not allowed.",
        ">   - Do not abuse support systems, tickets, or staff time.",
        ">   - Follow all instructions provided by moderators and administrators.",
        ">   - Attempting to bypass rules, moderation systems, or punishments will result in penalties.",
        ">   - Staff decisions are final — if you disagree, open a ticket and discuss the issue respectfully.",
      ].join("\n"),
    );

  await interaction.reply({ embeds: [embed] });
}

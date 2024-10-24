const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const activeSessions = new Map();
const TARGET_CHANNEL_ID = '1180956991775064069'; // Replace with your target channel ID

class SessionVote {
  constructor(channel, voteRequirement) {
    this.channel = channel;
    this.voteRequirement = voteRequirement;
    this.voters = new Set();
    this.message = null;
  }

  async startVote() {
    const initialDescription = this.voters.size === 0 ? "Click the buttons below to vote!\n\nNo Pings yet" : "Click the buttons below to vote!";
    const embed = new EmbedBuilder()
      .setTitle("SSV")
      .setDescription(initialDescription)
      .setColor(0x00ff00);

    const view = this.getVoteView();
    this.message = await this.channel.send({ content: "No Pings Yet", embeds: [embed], components: [view] });
  }

  getVoteView() {
    const voteButton = new ButtonBuilder()
      .setCustomId('vote')
      .setLabel(`Vote (${this.voters.size})`)
      .setStyle(ButtonStyle.Primary);

    const showVotesButton = new ButtonBuilder()
      .setCustomId('show_votes')
      .setLabel('Show Votes')
      .setStyle(ButtonStyle.Secondary);

    return new ActionRowBuilder().addComponents(voteButton, showVotesButton);
  }

  async handleVote(interaction) {
    const userId = interaction.user.id;
    if (this.voters.has(userId)) {
      this.voters.delete(userId);
      await interaction.reply({ content: `<@${userId}> Your vote has been removed.`, ephemeral: true });
    } else {
      this.voters.add(userId);
      await interaction.reply({ content: `<@${userId}> Your vote has been counted.`, ephemeral: true });
    }
    await this.updateVoteCount();
  }

  async showVotes(interaction) {
    const voterMentions = Array.from(this.voters).map(voterId => `<@${voterId}>`);
    const votersText = voterMentions.length > 0 ? voterMentions.join(', ') : "No votes yet.";
    await interaction.reply({ content: `Current voters: ${votersText}`, ephemeral: true });
  }

  async updateVoteCount() {
    const view = this.getVoteView();
    view.components[0].setLabel(`Vote (${this.voters.size})`);

    if (this.voters.size >= this.voteRequirement) {
      view.components[0].setDisabled(true);
    }

    await this.message.edit({ components: [view] });
  }
}

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'ssv') {
    const voteRequirement = parseInt(args[0]) || 5;
    const channel = client.channels.cache.get(TARGET_CHANNEL_ID);
    const session = new SessionVote(channel, voteRequirement);
    activeSessions.set(channel.id, session);
    await session.startVote();
  } else if (command === 'ssu') {
    const channelId = TARGET_CHANNEL_ID;
    if (!activeSessions.has(channelId)) {
      await message.reply("No active voting session found in this channel.");
      return;
    }

    const session = activeSessions.get(channelId);
    const voterMentions = Array.from(session.voters).map(voterId => `<@${voterId}>`);
    const votersText = voterMentions.length > 0 ? voterMentions.join('\n') : "No votes yet.";

    const embed = new EmbedBuilder()
      .setTitle("Session Started!")
      .setDescription("Join up and participate!")
      .setColor(0x3498db);

    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    await targetChannel.send({ content: "No Pings Yet", embeds: [embed] });
  } else if (command === 'ssb') {
    const boostMessage = "We need more players to join up! Come and participate in the session!";
    const embed = new EmbedBuilder()
      .setTitle("Session Boost")
      .setDescription(boostMessage)
      .setColor(0xff9900);

    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    await targetChannel.send({ content: "No Pings Yet", embeds: [embed] });
  } else if (command === 'ssd') {
    const channelId = TARGET_CHANNEL_ID;
    activeSessions.delete(channelId);

    const shutdownMessage = "The session is now closed. Please leave the server. Thank you for participating!";
    const embed = new EmbedBuilder()
      .setTitle("Session Shutdown")
      .setDescription(shutdownMessage)
      .setColor(0xff0000);

    const targetChannel = client.channels.cache.get(TARGET_CHANNEL_ID);
    await targetChannel.send({ content: "No Pings Yet", embeds: [embed] });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const session = activeSessions.get(interaction.channelId);
  if (!session) return;

  if (interaction.customId === 'vote') {
    await session.handleVote(interaction);
  } else if (interaction.customId === 'show_votes') {
    await session.showVotes(interaction);
  }
});

client.login('MTE4MDk1NDk5NDI2Mjk0MTgzNg.GKEugH.tJPfKMNOT6WsA4sxz1kNbqHWngqVK66J8GDu24');
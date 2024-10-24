import discord
from discord.ext import commands
from discord import ButtonStyle, Embed
from discord.ui import Button, View

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

# Store active sessions
active_sessions = {}

# Set the channel ID where all messages will be sent
TARGET_CHANNEL_ID = 1180956991775064069  # Replace with your target channel ID

class SessionVote:
    def __init__(self, channel, vote_requirement):
        self.channel = channel
        self.vote_requirement = vote_requirement
        self.voters = set()
        self.message = None

    async def start_vote(self):
        # Create the initial message with "No Pings yet" if no voters
        initial_description = "Click the buttons below to vote!\n\nNo Pings yet" if not self.voters else "Click the buttons below to vote!"
        response_message = ("No Pings Yet")
        embed = Embed(title="SSV", description=initial_description, color=0x00ff00)
        view = self.get_vote_view()
        self.message = await self.channel.send(response_message, embed=embed, view=view)

    def get_vote_view(self):
        view = View()
        
        vote_button = Button(style=ButtonStyle.primary, label=f"Vote ({len(self.voters)})", custom_id="vote")
        vote_button.callback = self.vote_callback
        view.add_item(vote_button)

        show_votes_button = Button(style=ButtonStyle.secondary, label="Show Votes", custom_id="show_votes")
        show_votes_button.callback = self.show_votes_callback
        view.add_item(show_votes_button)

        return view

    async def vote_callback(self, interaction: discord.Interaction):
        user = interaction.user
        
        if user.id in self.voters:
            self.voters.remove(user.id)
            await interaction.response.send_message(f"{user.mention} Your vote has been removed.", ephemeral=True)
        else:
            self.voters.add(user.id)
            await interaction.response.send_message(f"{user.mention} Your vote has been counted.", ephemeral=True)

        await self.update_vote_count()

    async def show_votes_callback(self, interaction: discord.Interaction):
        voter_mentions = [f"<@{voter_id}>" for voter_id in self.voters]
        voters_text = ", ".join(voter_mentions) if voter_mentions else "No votes yet."
        await interaction.response.send_message(f"Current voters: {voters_text}", ephemeral=True)

    async def update_vote_count(self):
        view = self.get_vote_view()
        
        # Update the button label with the current number of voters
        view.children[0].label = f"Vote ({len(self.voters)})"
        
        # Check if the voting requirement is met and disable the button if so
        if len(self.voters) >= self.vote_requirement:
            view.children[0].disabled = True  # Disable the voting button
        
        # Update the message with the new embed and view
        await self.message.edit(view=view)

@bot.command(name='ssv')
async def session_vote(ctx, vote_requirement: int = 5):
    channel = bot.get_channel(TARGET_CHANNEL_ID)
    session = SessionVote(channel, vote_requirement)
    active_sessions[channel.id] = session  # Store the session in active_sessions
    await session.start_vote()  # Start the voting session

@bot.command(name='ssu')
async def session_start(ctx):
    channel_id = TARGET_CHANNEL_ID

    if channel_id not in active_sessions:
        await ctx.send("No active voting session found in this channel.")
        return

    session = active_sessions[channel_id]

    voter_mentions = [f"<@{voter_id}>" for voter_id in session.voters]
    voters_text = "\n".join(voter_mentions) if voter_mentions else "No votes yet."
    
    response_message = "No Pings Yet"
    embed = Embed(title="Session Started!", description="Join up and participate!", color=0x3498db)
    target_channel = bot.get_channel(TARGET_CHANNEL_ID)
    await target_channel.send(response_message, embed=embed)

@bot.command(name='ssb')
async def session_boost(ctx):
    channel_id = TARGET_CHANNEL_ID


    boost_message = "We need more players to join up! Come and participate in the session!"
    embed = Embed(title="Session Boost", description=boost_message, color=0xff9900)
    response_message = "No Pings Yet"
    target_channel = bot.get_channel(TARGET_CHANNEL_ID)
    await target_channel.send(response_message, embed=embed)

@bot.command(name='ssd')
async def session_shutdown(ctx):
    channel_id = TARGET_CHANNEL_ID

    del active_sessions[channel_id]  # Remove the session from active_sessions

    shutdown_message = "The session is now closed. Please leave the server. Thank you for participating!"
    embed = Embed(title="Session Shutdown", description=shutdown_message, color=0xff0000)
    response_message = "No Pings Yet"
    target_channel = bot.get_channel(TARGET_CHANNEL_ID)
    await target_channel.send(response_message, embed=embed)

bot.run('Token')
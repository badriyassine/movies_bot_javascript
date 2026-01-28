const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const ALLOWED_CHANNEL_ID = process.env.ALLOWED_CHANNEL_ID;

// Set up bot with command prefix and intents
const client = new Client({ 
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] 
});

// Function to get latest movies from TMDb
async function getLatestMovies() {
  const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      return response.data.results.slice(0, 5); // Get top 5 latest movies
    }
    return [];
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

// Restrict bot commands to the allowed channel
async function checkChannel(message) {
  if (message.channel.id !== ALLOWED_CHANNEL_ID) {
    message.channel.send(" This bot only works in the designated channel!");
    return false;
  }
  return true;
}

// Event when the bot is ready
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Start the cron job after the bot is ready
  cron.schedule('*/30 * * * *', async () => {
    try {
      const channel = await client.channels.fetch(ALLOWED_CHANNEL_ID);
      if (channel) {
        const movies = await getLatestMovies();
        if (movies.length === 0) {
          channel.send("Sorry, I couldn't fetch the latest movies at the moment.");
          return;
        }

        movies.forEach(movie => {
          const embed = new EmbedBuilder()
            .setTitle(movie.title)
            .setDescription(movie.overview || 'No description available.')
            .setColor(0x3498db)
            .setImage(`https://image.tmdb.org/t/p/w500${movie.poster_path}`)
            .setFooter({ text: `Release Date: ${movie.release_date}` });
          channel.send({ embeds: [embed] });
        });
      }
    } catch (err) {
      console.error('Error in cron job:', err);
    }
  });
});

client.login(DISCORD_BOT_TOKEN);



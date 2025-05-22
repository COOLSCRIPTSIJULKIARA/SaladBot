const {
  Client,
  GatewayIntentBits,
  Partials,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  Events,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch'); // pour envoyer les messages au webhook

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'formulaire') {
      const modal = new ModalBuilder()
        .setCustomId('formulaireModal')
        .setTitle('🛡️ Formulaire sécurisé');

      const usernameInput = new TextInputBuilder()
        .setCustomId('username')
        .setLabel("Nom d'utilisateur")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('ex : JeanDu75')
        .setRequired(true);

      const messageInput = new TextInputBuilder()
        .setCustomId('message')
        .setLabel('Ton message')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('⚠️ Ne donne pas de mot de passe ni d\'info personnelle.')
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(usernameInput);
      const row2 = new ActionRowBuilder().addComponents(messageInput);

      modal.addComponents(row1, row2);

      await interaction.showModal(modal);
    }
  }

  // Quand le formulaire est soumis
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'formulaireModal') {
      const username = interaction.fields.getTextInputValue('username');
      const message = interaction.fields.getTextInputValue('message');

      // Envoi via Webhook
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Formulaire Anonyme',
          avatar_url: 'https://i.imgur.com/AfFp7pu.png',
          embeds: [{
            title: '📥 Nouveau message reçu',
            color: 0x5865F2,
            fields: [
              { name: 'Nom', value: username, inline: true },
              { name: 'Message', value: message }
            ],
            footer: {
              text: '⚠️ Ne jamais transmettre d\'informations sensibles',
            },
            timestamp: new Date().toISOString()
          }]
        })
      });

      await interaction.reply({
        content: '✅ Ton message a été transmis avec succès !',
        ephemeral: true
      });
    }
  }
});

// Déploiement de la commande slash
const commands = [
  new SlashCommandBuilder().setName('formulaire').setDescription('Ouvre un formulaire sécurisé'),
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('🔁 Déploiement des commandes...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Commandes slash déployées !');
    client.login(process.env.TOKEN);
  } catch (error) {
    console.error(error);
  }
})();

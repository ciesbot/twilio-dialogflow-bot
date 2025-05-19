const express = require('express');
const { SessionsClient } = require('@google-cloud/dialogflow');
const app = express();
app.use(express.json());

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';

const sessionClient = new SessionsClient({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  }
});

// Ruta GET para probar que funciona desde navegador
app.get('/', (req, res) => {
  res.send('Bot funcionando correctamente ✅');
});

app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  const sessionId = req.body.sessionId || 'default-session';

  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'es',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.json({ reply: result.fulfillmentText });
 } catch (error) {
  console.error("ERROR AL CONSULTAR DIALOGFLOW:", error.message, error);
  res.status(500).send('Error procesando Dialogflow');
}
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor listo en puerto ${port}`));

const express = require('express');
const { SessionsClient } = require('@google-cloud/dialogflow');
const app = express();

app.use(express.json());

// Variables de entorno que debes configurar en Render:
const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
// Importante: reemplaza los "\n" en la clave privada para que tenga saltos reales de línea
const privateKey = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : '';

// Validación simple para saber si las variables están cargadas
if (!projectId || !clientEmail || !privateKey) {
  console.error('ERROR: Variables de entorno para Dialogflow no están definidas correctamente.');
  process.exit(1);
}

// Crear cliente de sesión Dialogflow con credenciales explícitas
const sessionClient = new SessionsClient({
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  }
});

app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  const sessionId = req.body.sessionId || 'default-session';

  if (!message) {
    return res.status(400).json({ error: 'Falta el campo "message" en el cuerpo del POST.' });
  }

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
    console.error('Error en detectIntent:', error);
    res.status(500).send('Error procesando Dialogflow');
  }
});

// Puerto que Render asigna automáticamente
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor listo en puerto ${port}`);
});

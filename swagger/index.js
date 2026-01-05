import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readJSON = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf-8'));

const events = readJSON('events.json');

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'HostelApp API',
    version: '1.0.0',
    description:
      'This is the API documentation for the HostelApp backend.\n\n' +
      '⚠️ Notes:\n' +
      '1. There is a **rate limit of 20 requests per 15 minutes per IP** to protect the API from abuse.\n' +
      '2. **Cookies are being set for analytics purposes.**',
  },
  servers: [{ url: 'http://localhost:8000', description: 'Local' }],
  tags: [...events.tags],
  paths: {
    ...events.paths,
  },
  components: {
    schemas: {
      ...events.components.schemas,
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

// Opcional: gerar arquivo JSON final
fs.writeFileSync(path.join(__dirname, 'openapi.json'), JSON.stringify(openApiSpec, null, 2));

export default openApiSpec;

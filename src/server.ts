import http from 'http';

import connectToMongoDB from './db/connect';
import { startAutomaticCheckoutJob } from './jobs/checkout.job';
import app from './app';

const PORT = process.env.PORT || 8000;

// Criando servidor HTTP e instância do Socket.IO
const server = http.createServer(app);

server.listen(PORT, () => {
  connectToMongoDB();
  startAutomaticCheckoutJob();
  console.log(`Server running on port ${PORT}`);
});

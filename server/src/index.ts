import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createRoutes } from './routes.js';
import { setSponsorStatuses } from './store.js';
import { getSponsorStatuses } from './services/sponsors/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());
setSponsorStatuses(getSponsorStatuses());
app.use('/api', createRoutes(io));

io.on('connection', (socket) => {
  socket.on('company:join', (companyId: string) => {
    socket.join(companyId);
  });
});

httpServer.listen(4000, () => {
  console.log('evoler.ai server listening on http://localhost:4000');
});

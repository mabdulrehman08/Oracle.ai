import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createRoutes } from './routes.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());
app.use('/api', createRoutes(io));

io.on('connection', (socket) => {
  socket.on('company:join', (companyId: string) => {
    socket.join(companyId);
  });
});

httpServer.listen(4000, () => {
  console.log('Oracle Evolution server listening on http://localhost:4000');
});

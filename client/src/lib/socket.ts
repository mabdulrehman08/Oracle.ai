import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export const socket = io(API_BASE_URL, {
  autoConnect: false,
});

export const joinCompanyRoom = (companyId: string) => {
  if (!socket.connected) {
    socket.connect();
  }
  socket.emit('company:join', companyId);
};

// Universal socket service hook
import socketService, { type SocketService } from '@/services/socket';

export const useSocketService = (): SocketService => {
  return socketService;
};

export default useSocketService;
// Universal socket service hook - simple pass-through
import socketService from '@/services/socket';

export const useSocketService = () => {
  return socketService;
};

export default useSocketService;
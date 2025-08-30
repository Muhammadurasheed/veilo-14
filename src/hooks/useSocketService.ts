// Universal socket service hook
import socketService from '@/services/socket';

export const useSocketService = () => {
  return socketService;
};

export default useSocketService;
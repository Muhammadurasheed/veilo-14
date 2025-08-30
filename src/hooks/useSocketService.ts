// Universal socket service hook with complete Socket.IO methods
import { io, Socket } from 'socket.io-client';

export class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private isConnected = false;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(userId?: string): void {
    if (this.socket?.connected) return;

    try {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        timeout: 20000,
        autoConnect: true,
        auth: userId ? { userId } : undefined,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('✅ Socket connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('🔴 Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        this.isConnected = false;
      });
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Socket event methods
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  // Additional socket methods for compatibility
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  onNewMessage(callback: (...args: any[]) => void): void {
    this.socket?.on('new-message', callback);
  }

  markMessageDelivered(messageId: string): void {
    this.socket?.emit('mark-delivered', messageId);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Export as hook
export const useSocketService = () => {
  return SocketService.getInstance();
};

export default useSocketService;
// FAANG-level Socket Service - Enterprise grade real-time communication
import { io, Socket } from 'socket.io-client';

export interface SocketServiceInterface {
  connect(userId?: string): void;
  disconnect(): void;
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  removeAllListeners(): void;
  onNewMessage(callback: (...args: any[]) => void): void;
  markMessageDelivered(messageId: string): void;
  getSocket(): Socket | null;
  isSocketConnected(): boolean;
}

class UnifiedSocketService implements SocketServiceInterface {
  private static instance: UnifiedSocketService;
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): UnifiedSocketService {
    if (!UnifiedSocketService.instance) {
      UnifiedSocketService.instance = new UnifiedSocketService();
    }
    return UnifiedSocketService.instance;
  }

  connect(userId?: string): void {
    if (this.socket?.connected) return;

    try {
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
        transports: ['websocket'],
        timeout: 20000,
        autoConnect: true,
        auth: userId ? { userId } : undefined,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('🔴 Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
      this.handleReconnection();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed after maximum attempts');
      this.isConnected = false;
    });
  }

  private handleReconnection(): void {
    if (this.reconnectTimeout) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimeout = setTimeout(() => {
      console.log(`🔄 Attempting socket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.reconnectTimeout = null;
      if (!this.socket?.connected) {
        this.socket?.connect();
      }
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Core socket methods
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    this.socket?.off(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Specialized methods for backwards compatibility
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

  // Health check method
  healthCheck(): { connected: boolean; socketId?: string; transport?: string } {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      transport: this.socket?.io.engine.transport.name
    };
  }
}

// Export singleton instance
export const socketService = UnifiedSocketService.getInstance();

// Export hook for React components
export const useUnifiedSocket = () => {
  return socketService;
};

export default socketService;
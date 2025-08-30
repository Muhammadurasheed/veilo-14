/**
 * FLAGSHIP REAL-TIME SERVICE - Enterprise WebSocket Management
 * 
 * Handles all real-time communication for Veilo platform including:
 * - Live audio sanctuaries
 * - Chat sessions
 * - Expert notifications
 * - Admin monitoring
 * - Crisis detection alerts
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event type safety with TypeScript
 * - Connection state management
 * - Message queuing during disconnects
 * - Heartbeat monitoring
 * - Room-based event namespacing
 */

import { io, Socket } from 'socket.io-client';
import { logger } from './logger';
import { tokenManager } from './tokenManager';

/**
 * Real-time Event Types - Type-safe event definitions
 */
export interface RealTimeEvents {
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'reconnect': (attempt: number) => void;
  'reconnect_error': (error: Error) => void;
  
  // Authentication events
  'authenticated': (data: { userId: string; role: string }) => void;
  'authentication_error': (error: string) => void;
  
  // Chat session events
  'chat_message': (data: { sessionId: string; message: any; sender: any }) => void;
  'chat_typing_start': (data: { sessionId: string; userId: string; alias: string }) => void;
  'chat_typing_stop': (data: { sessionId: string; userId: string }) => void;
  'chat_session_ended': (data: { sessionId: string }) => void;
  
  // Live sanctuary events
  'sanctuary_participant_joined': (data: { sessionId: string; participant: any }) => void;
  'sanctuary_participant_left': (data: { sessionId: string; participantId: string }) => void;
  'sanctuary_participant_muted': (data: { sessionId: string; participantId: string; isMuted: boolean }) => void;
  'sanctuary_hand_raised': (data: { sessionId: string; participantId: string; handRaised: boolean }) => void;
  'sanctuary_session_ended': (data: { sessionId: string }) => void;
  'sanctuary_emergency_alert': (data: { sessionId: string; alert: any }) => void;
  'sanctuary_moderation_action': (data: { sessionId: string; action: any }) => void;
  
  // Expert system events
  'expert_online_status': (data: { expertId: string; isOnline: boolean; lastActive?: string }) => void;
  'expert_new_session_request': (data: { sessionId: string; client: any }) => void;
  'expert_application_update': (data: { expertId: string; status: string; feedback?: string }) => void;
  
  // Admin monitoring events
  'admin_crisis_alert': (data: { type: 'crisis' | 'emergency'; sessionId: string; details: any }) => void;
  'admin_moderation_required': (data: { contentId: string; type: string; priority: 'low' | 'medium' | 'high' | 'critical' }) => void;
  'admin_new_expert_application': (data: { expertId: string; expert: any }) => void;
  'admin_platform_alert': (data: { type: string; message: string; severity: string }) => void;
  
  // System events
  'user_notification': (data: { type: string; title: string; message: string; data?: any }) => void;
  'system_maintenance': (data: { message: string; scheduledTime?: string }) => void;
  'rate_limit_warning': (data: { limit: number; remaining: number; resetTime: string }) => void;
}

/**
 * Connection States
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Real-time Service Configuration
 */
interface RealTimeConfig {
  url: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  timeout: number;
  forceNew: boolean;
}

/**
 * Message Queue Item
 */
interface QueuedMessage {
  event: string;
  data: any;
  timestamp: number;
  retries: number;
}

class RealTimeService {
  private socket: Socket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageQueue: QueuedMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners = new Map<string, Set<Function>>();
  
  private config: RealTimeConfig = {
    url: import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'ws://localhost:3000' : 'wss://api.veilo.com'),
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    forceNew: false
  };

  constructor() {
    this.setupVisibilityHandlers();
  }

  /**
   * Connect to the real-time service
   */
  async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED || this.connectionState === ConnectionState.CONNECTING) {
      return;
    }

    this.setConnectionState(ConnectionState.CONNECTING);
    
    try {
      const token = tokenManager.getToken();
      
      this.socket = io(this.config.url, {
        ...this.config,
        auth: {
          token: token
        },
        extraHeaders: {
          'X-Client-Version': '1.0.0',
          'X-Client-Platform': 'web'
        }
      });

      this.setupSocketEventHandlers();
      
    } catch (error) {
      logger.error('Failed to connect to real-time service', error);
      this.setConnectionState(ConnectionState.ERROR);
      throw error;
    }
  }

  /**
   * Disconnect from the real-time service
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.clearHeartbeat();
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    
    logger.info('Disconnected from real-time service');
  }

  /**
   * Setup socket event handlers
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      logger.info('Connected to real-time service');
      this.setConnectionState(ConnectionState.CONNECTED);
      this.reconnectAttempts = 0;
      this.processMessageQueue();
      this.startHeartbeat();
      this.emitLocal('connect');
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('Disconnected from real-time service', { reason });
      this.setConnectionState(ConnectionState.DISCONNECTED);
      this.clearHeartbeat();
      this.emitLocal('disconnect', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }
      
      this.handleReconnection();
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Connection error', error);
      this.setConnectionState(ConnectionState.ERROR);
      this.handleReconnection();
    });

    this.socket.on('reconnect', (attempt) => {
      logger.info('Reconnected to real-time service', { attempt });
      this.reconnectAttempts = 0;
      this.emitLocal('reconnect', attempt);
    });

    this.socket.on('reconnect_error', (error) => {
      logger.error('Reconnection error', error);
      this.emitLocal('reconnect_error', error);
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      logger.info('Real-time service authenticated', data);
      this.emitLocal('authenticated', data);
    });

    this.socket.on('authentication_error', (error) => {
      logger.error('Real-time authentication failed', error);
      this.emitLocal('authentication_error', error);
    });

    // Generic event forwarding
    this.setupGenericEventHandlers();
  }

  /**
   * Setup generic event handlers for all event types
   */
  private setupGenericEventHandlers(): void {
    if (!this.socket) return;

    const eventTypes = [
      'chat_message',
      'chat_typing_start',
      'chat_typing_stop',
      'chat_session_ended',
      'sanctuary_participant_joined',
      'sanctuary_participant_left',
      'sanctuary_participant_muted',
      'sanctuary_hand_raised',
      'sanctuary_session_ended',
      'sanctuary_emergency_alert',
      'sanctuary_moderation_action',
      'expert_online_status',
      'expert_new_session_request',
      'expert_application_update',
      'admin_crisis_alert',
      'admin_moderation_required',
      'admin_new_expert_application',
      'admin_platform_alert',
      'user_notification',
      'system_maintenance',
      'rate_limit_warning'
    ];

    eventTypes.forEach(eventType => {
      this.socket!.on(eventType, (data) => {
        logger.debug('Real-time event received', { eventType, data });
        this.emitLocal(eventType, data);
      });
    });
  }

  /**
   * Handle reconnection logic with exponential backoff
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.setConnectionState(ConnectionState.ERROR);
      return;
    }

    this.setConnectionState(ConnectionState.RECONNECTING);
    this.reconnectAttempts++;
    
    const delay = Math.min(
      this.config.reconnectionDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.reconnectionDelayMax
    );
    
    logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.connectionState === ConnectionState.RECONNECTING) {
        this.connect().catch(error => {
          logger.error('Reconnection attempt failed', error);
        });
      }
    }, delay);
  }

  /**
   * Set connection state and emit state change events
   */
  private setConnectionState(state: ConnectionState): void {
    const previousState = this.connectionState;
    this.connectionState = state;
    
    if (previousState !== state) {
      this.emitLocal('connectionStateChanged', { previousState, currentState: state });
      
      // Emit connection state to window for other components
      window.dispatchEvent(new CustomEvent('socketConnectionStateChanged', {
        detail: { state }
      }));
    }
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', Date.now());
      }
    }, 30000); // 30 second heartbeat
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Process queued messages after reconnection
   */
  private processMessageQueue(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    // Filter out old messages
    this.messageQueue = this.messageQueue.filter(
      msg => now - msg.timestamp < maxAge && msg.retries < 3
    );
    
    // Send queued messages
    this.messageQueue.forEach(msg => {
      if (this.socket?.connected) {
        this.socket.emit(msg.event, msg.data);
        msg.retries++;
      }
    });
    
    // Clear successfully sent messages
    this.messageQueue = this.messageQueue.filter(msg => msg.retries >= 3);
  }

  /**
   * Setup page visibility handlers to manage connections
   */
  private setupVisibilityHandlers(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, reduce activity
        this.clearHeartbeat();
      } else {
        // Page is visible, resume normal activity
        if (this.socket?.connected) {
          this.startHeartbeat();
        } else if (tokenManager.hasToken()) {
          // Try to reconnect if we have auth
          this.connect().catch(console.error);
        }
      }
    });
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      logger.debug('Emitted real-time event', { event, data });
    } else {
      // Queue message for later
      this.messageQueue.push({
        event,
        data,
        timestamp: Date.now(),
        retries: 0
      });
      logger.debug('Queued real-time event (not connected)', { event, data });
    }
  }

  /**
   * Listen for events (type-safe)
   */
  on<K extends keyof RealTimeEvents>(event: K, listener: RealTimeEvents[K]): void;
  on(event: string, listener: Function): void;
  on(event: any, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  off(event: string, listener?: Function): void {
    if (!listener) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(listener);
    }
  }

  /**
   * Emit to local listeners
   */
  private emitLocal(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          logger.error('Error in event listener', { event, error });
        }
      });
    }
  }

  /**
   * Join a room for namespaced events
   */
  joinRoom(roomId: string): void {
    this.emit('join_room', roomId);
    logger.debug('Joined room', { roomId });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    this.emit('leave_room', roomId);
    logger.debug('Left room', { roomId });
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED && this.socket?.connected === true;
  }

  /**
   * Get connection quality metrics
   */
  getConnectionMetrics(): {
    state: ConnectionState;
    connected: boolean;
    reconnectAttempts: number;
    queuedMessages: number;
    lastConnected?: number;
  } {
    return {
      state: this.connectionState,
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      lastConnected: this.socket?.connected ? Date.now() : undefined
    };
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService();
export default realTimeService;

// Auto-connect when user is authenticated (will be implemented when tokenManager is updated)
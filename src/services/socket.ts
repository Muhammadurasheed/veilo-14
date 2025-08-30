import { io, Socket } from 'socket.io-client';

export class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  connect(token?: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        // Prioritize admin token, then provided token, then regular auth token
        const authToken = token || 
          localStorage.getItem('admin_token') || 
          localStorage.getItem('veilo-auth-token') ||
          localStorage.getItem('token');
        
        console.log('🔌 Socket connecting with token:', { 
          hasToken: !!authToken, 
          tokenPrefix: authToken?.substring(0, 20),
          isAdminToken: !!localStorage.getItem('admin_token')
        });
        
        this.socket = io(serverUrl, {
          auth: {
            token: authToken,
          },
          transports: ['websocket'],
          timeout: 10000,
        });

        this.socket.on('connect', () => {
          console.log('🔌 Socket connected successfully');
          this.isConnected = true;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔌 Socket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Auto-reconnect logic
        this.socket.on('reconnect', (attemptNumber) => {
          console.log('🔌 Socket reconnected after', attemptNumber, 'attempts');
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔌 Socket reconnection attempt', attemptNumber);
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('🔌 Socket reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('🔌 Socket reconnection failed');
        });

      } catch (error) {
        console.error('🔌 Failed to initialize socket:', error);
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('🔌 Socket disconnected manually');
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  // Alias for backwards compatibility
  get isSocketConnected(): boolean {
    return this.isConnected;
  }

  // Chat functionality
  joinRoom(roomId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('join_room', { roomId });
  }

  // Alias for backwards compatibility
  joinChat(roomId: string): void {
    this.joinRoom(roomId);
  }

  leaveRoom(roomId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('leave_room', { roomId });
  }

  // Alias for backwards compatibility  
  leaveChat(roomId: string): void {
    this.leaveRoom(roomId);
  }

  sendMessage(roomId: string, content: string, userAlias: string): void {
    if (!this.socket) return;
    
    this.socket.emit('send_message', {
      roomId,
      content,
      userAlias,
    });
  }

  // Typing indicators
  startTyping(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('start_typing', { roomId });
  }

  stopTyping(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('stop_typing', { roomId });
  }

  // Message delivery
  markMessageDelivered(messageId: string): void {
    if (!this.socket) return;
    this.socket.emit('message_delivered', { messageId });
  }

  // Sanctuary functionality
  joinSanctuaryRoom(sessionId: string, participantAlias: string): void {
    if (!this.socket) return;
    
    this.socket.emit('sanctuary_join', {
      sessionId,
      participantAlias,
    });
  }

  // Alias for backwards compatibility
  joinSanctuary(sessionId: string, participantAlias?: string): void {
    this.joinSanctuaryRoom(sessionId, participantAlias || '');
  }

  leaveSanctuaryRoom(sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('sanctuary_leave', { sessionId });
  }

  // Alias for backwards compatibility
  leaveSanctuary(sessionId: string): void {
    this.leaveSanctuaryRoom(sessionId);
  }

  sendSanctuaryMessage(sessionId: string, participantId: string, participantAlias: string, content: string, type: string = 'text'): void {
    if (!this.socket) return;
    
    this.socket.emit('sanctuary_message', {
      sessionId,
      participantId,
      participantAlias,
      content,
      type
    });
  }

  sendSanctuaryReaction(sessionId: string, participantId: string, participantAlias: string, type: string): void {
    if (!this.socket) return;
    
    this.socket.emit('sanctuary_reaction', {
      sessionId,
      participantId,
      participantAlias,
      type
    });
  }

  // Generic socket methods for hooks compatibility
  on(event: string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  emit(event: string, ...args: any[]): void {
    this.socket?.emit(event, ...args);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  // Voice chat functionality
  requestVoiceChat(targetUserId: string, sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('request_voice_chat', { targetUserId, sessionId });
  }

  respondToVoiceChat(targetUserId: string, accepted: boolean, sessionId: string): void {
    if (!this.socket) return;
    
    this.socket.emit('voice_chat_response', { targetUserId, accepted, sessionId });
  }

  // Event listeners
  onNewMessage(callback: (message: any) => void): void {
    this.socket?.on('new_message', callback);
  }

  onUserJoined(callback: (user: any) => void): void {
    this.socket?.on('user_joined', callback);
  }

  onUserLeft(callback: (user: any) => void): void {
    this.socket?.on('user_left', callback);
  }

  onUserTyping(callback: (data: any) => void): void {
    this.socket?.on('user_typing', callback);
  }

  onMessageStatusUpdate(callback: (data: any) => void): void {
    this.socket?.on('message_status_update', callback);
  }

  onSanctuaryNewMessage(callback: (message: any) => void): void {
    this.socket?.on('sanctuary_new_message', callback);
  }

  onParticipantJoined(callback: (participant: any) => void): void {
    this.socket?.on('participant_joined', callback);
  }

  onParticipantLeft(callback: (participant: any) => void): void {
    this.socket?.on('participant_left', callback);
  }

  onReactionReceived(callback: (reaction: any) => void): void {
    this.socket?.on('reaction_received', callback);
  }

  onSessionStatusUpdate(callback: (data: any) => void): void {
    this.socket?.on('session_status_update', callback);
  }

  onVoiceChatRequested(callback: (data: any) => void): void {
    this.socket?.on('voice_chat_requested', callback);
  }

  onVoiceChatResponse(callback: (data: any) => void): void {
    this.socket?.on('voice_chat_response', callback);
  }

  // Admin-specific events
  onExpertApplicationUpdate(callback: (data: any) => void): void {
    this.socket?.on('expert_application_update', callback);
  }

  onSystemAlert(callback: (alert: any) => void): void {
    this.socket?.on('system_alert', callback);
  }

  onModerationAlert(callback: (alert: any) => void): void {
    this.socket?.on('moderation_alert', callback);
  }

  // Cleanup method
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
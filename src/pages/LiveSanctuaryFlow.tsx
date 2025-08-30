import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SanctuaryAcknowledgment } from '@/components/sanctuary/SanctuaryAcknowledgment';
import { ScheduledSessionWaiting } from '@/components/sanctuary/ScheduledSessionWaiting';
import { EnhancedLiveAudioSpace } from '@/components/sanctuary/EnhancedLiveAudioSpace';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'sonner';
import axios from 'axios';
import type { LiveSanctuarySession } from '@/types/sanctuary';

export const LiveSanctuaryFlow: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  
  const [currentPhase, setCurrentPhase] = useState<'loading' | 'acknowledgment' | 'waiting' | 'active' | 'ended'>('loading');
  const [session, setSession] = useState<LiveSanctuarySession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const socket = useSocket();

  useEffect(() => {
    if (!sessionId) {
      navigate('/sanctuary');
      return;
    }
    
    loadSession();
  }, [sessionId, inviteCode]);

  const loadSession = async () => {
    try {
      const response = await axios.get(
        `/api/flagship-sanctuary/session/${sessionId}${inviteCode ? `?invite=${inviteCode}` : ''}`
      );
      
      const sessionData = response.data.session;
      setSession(sessionData);
      
      // Determine current phase based on session state
      if (sessionData.status === 'ended') {
        setCurrentPhase('ended');
      } else if (sessionData.scheduledDateTime && new Date(sessionData.scheduledDateTime) > new Date()) {
        setCurrentPhase('acknowledgment');
      } else if (sessionData.status === 'active') {
        setCurrentPhase('active');
      } else {
        setCurrentPhase('acknowledgment');
      }
    } catch (error: any) {
      console.error('Failed to load session:', error);
      setError(error.response?.data?.message || 'Session not found');
      toast.error('Failed to load session');
    }
  };

  const handleAcknowledgmentComplete = () => {
    if (session?.scheduledDateTime && new Date(session.scheduledDateTime) > new Date()) {
      setCurrentPhase('waiting');
    } else {
      setCurrentPhase('active');
    }
  };

  const handleSessionStart = () => {
    setCurrentPhase('active');
  };

  const handleSessionEnd = () => {
    setCurrentPhase('ended');
    toast.success('Session has ended');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <span className="text-destructive text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Session Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <button 
            onClick={() => navigate('/sanctuary')}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Sanctuary
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto animate-spin"></div>
          <p className="text-muted-foreground">Loading sanctuary...</p>
        </div>
      </div>
    );
  }

  switch (currentPhase) {
    case 'acknowledgment':
      return (
        <SanctuaryAcknowledgment 
          session={session}
          onComplete={handleAcknowledgmentComplete}
          inviteCode={inviteCode || undefined}
        />
      );
      
    case 'waiting':
      return (
        <ScheduledSessionWaiting 
          session={session}
          onSessionStart={handleSessionStart}
        />
      );
      
    case 'active':
      return (
        <EnhancedLiveAudioSpace 
          session={session}
          onSessionEnd={handleSessionEnd}
        />
      );
      
    case 'ended':
      return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border p-8 max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-primary text-2xl">✨</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Session Completed</h2>
            <p className="text-muted-foreground">Thank you for participating in this sanctuary session.</p>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/sanctuary')}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Sanctuaries
              </button>
              <button 
                onClick={() => navigate('/sanctuary/create')}
                className="w-full bg-secondary text-secondary-foreground py-2 px-4 rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Create New Sanctuary
              </button>
            </div>
          </div>
        </div>
      );
      
    default:
      return null;
  }
};
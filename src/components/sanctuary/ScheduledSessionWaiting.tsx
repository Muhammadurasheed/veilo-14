import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { 
  Calendar, 
  Clock, 
  Users, 
  Crown,
  Loader2,
  RefreshCw,
  Bell,
  CheckCircle,
  Timer,
  Play
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { LiveSanctuarySession } from '@/types';

interface WaitingSessionData {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  hostAlias: string;
  scheduledAt: string;
  estimatedDuration?: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'scheduled' | 'starting' | 'active';
  participantsList: Array<{
    id: string;
    alias: string;
    joinedWaitingAt: string;
    avatarIndex?: number;
  }>;
}

export const ScheduledSessionWaiting = ({
  session,
  onSessionStart
}: {
  session?: LiveSanctuarySession;
  onSessionStart?: () => void;
}) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<WaitingSessionData | null>(null);
  const [timeUntilStart, setTimeUntilStart] = useState(0);
  const [isStartingSoon, setIsStartingSoon] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionData?.scheduledAt) return;

    const updateCountdown = () => {
      const scheduledTime = new Date(sessionData.scheduledAt).getTime();
      const now = new Date().getTime();
      const diff = scheduledTime - now;
      
      setTimeUntilStart(Math.max(0, diff));
      setIsStartingSoon(diff <= 300000 && diff > 0); // 5 minutes
      
      // Auto-redirect when session starts
      if (diff <= 0 && sessionData.status === 'active') {
        toast({
          title: "Session Starting!",
          description: "Redirecting to live session...",
        });
        navigate(`/sanctuary/${sessionId}/live`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [sessionData, sessionId, navigate, toast]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/flagship-sanctuary/${sessionId}/waiting-room`);
      setSessionData(response.data);
    } catch (error: any) {
      console.error('Failed to fetch session data:', error);
      toast({
        title: "Error Loading Session",
        description: error.response?.data?.message || "Failed to load session details",
        variant: "destructive"
      });
      
      // Redirect if session not found
      if (error.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const enableNotifications = async () => {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationEnabled(permission === 'granted');
        
        if (permission === 'granted') {
          toast({
            title: "Notifications Enabled",
            description: "You'll be notified when the session starts",
          });
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return "Starting now";
    
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading waiting room...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-destructive/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-4">This session may have been cancelled or expired.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = sessionData.estimatedDuration 
    ? Math.max(0, Math.min(100, ((sessionData.estimatedDuration * 60 * 1000 - timeUntilStart) / (sessionData.estimatedDuration * 60 * 1000)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Session Header */}
        <Card className="overflow-hidden">
          <div className={`p-6 ${isStartingSoon ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10' : 'bg-gradient-to-r from-primary/10 to-secondary/10'}`}>
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{sessionData.emoji || '🕊️'}</div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{sessionData.topic}</h1>
                {sessionData.description && (
                  <p className="text-muted-foreground mb-3">{sessionData.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <span>Hosted by {sessionData.hostAlias}</span>
                  </div>
                  <Badge variant={isStartingSoon ? 'default' : 'secondary'}>
                    {isStartingSoon ? 'Starting Soon' : 'Scheduled'}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary mb-1">
                  {formatTimeRemaining(timeUntilStart)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {timeUntilStart > 0 ? 'until start' : 'starting now'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Countdown & Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Timer className="h-5 w-5 mr-2" />
                Session Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Scheduled Start</span>
                  <span className="font-medium">
                    {format(new Date(sessionData.scheduledAt), 'PPP p')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Time Remaining</span>
                  <span className={`font-medium ${isStartingSoon ? 'text-amber-600' : ''}`}>
                    {formatTimeRemaining(timeUntilStart)}
                  </span>
                </div>
                {sessionData.estimatedDuration && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Estimated Duration</span>
                    <span className="font-medium">{sessionData.estimatedDuration} minutes</span>
                  </div>
                )}
              </div>

              {timeUntilStart > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress to Start</span>
                    <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {/* Notification Toggle */}
              {!notificationEnabled && timeUntilStart > 60000 && (
                <Button 
                  onClick={enableNotifications}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Start Notifications
                </Button>
              )}

              {notificationEnabled && (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Notifications enabled</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiting Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Waiting Participants
                </div>
                <Badge variant="secondary">
                  {sessionData.currentParticipants}/{sessionData.maxParticipants}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {sessionData.participantsList.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3 p-2 bg-muted/30 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {participant.alias.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.alias}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {formatDistanceToNow(new Date(participant.joinedWaitingAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}

                {sessionData.participantsList.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">You're the first to arrive!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Message */}
        <Card>
          <CardContent className="pt-6">
            {timeUntilStart > 300000 ? (
              <div className="text-center space-y-2">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold">Waiting Room Active</h3>
                <p className="text-muted-foreground">
                  The session will start at {format(new Date(sessionData.scheduledAt), 'p')}. 
                  You can stay here or return later - we'll notify you when it begins.
                </p>
              </div>
            ) : timeUntilStart > 0 ? (
              <div className="text-center space-y-2">
                <div className="relative">
                  <RefreshCw className="h-12 w-12 text-amber-500 mx-auto animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-amber-500 rounded-full animate-pulse opacity-30"></div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-amber-700">Starting Soon!</h3>
                <p className="text-muted-foreground">
                  The session will begin in less than 5 minutes. Please stay on this page.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <Play className="h-12 w-12 text-green-500 mx-auto" />
                <h3 className="text-lg font-semibold text-green-700">Session is Starting!</h3>
                <p className="text-muted-foreground">
                  Redirecting you to the live session now...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
          >
            Leave Waiting Room
          </Button>
          <Button 
            variant="outline"
            onClick={fetchSessionData}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};
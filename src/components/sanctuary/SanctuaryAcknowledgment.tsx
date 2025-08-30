import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { 
  Calendar, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Crown,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import type { LiveSanctuarySession } from '@/types';

interface SessionDetails {
  id: string;
  topic: string;
  description?: string;
  emoji?: string;
  hostAlias: string;
  scheduledAt?: string;
  estimatedDuration?: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'scheduled' | 'active' | 'ended';
  mode: 'public' | 'private' | 'invite-only';
  tags?: string[];
  language?: string;
  allowAnonymous: boolean;
  moderationLevel: 'low' | 'medium' | 'high';
  emergencyProtocols: boolean;
  aiMonitoring: boolean;
}

export const SanctuaryAcknowledgment = ({ 
  session, 
  onComplete, 
  inviteCode 
}: { 
  session?: LiveSanctuarySession; 
  onComplete?: () => void; 
  inviteCode?: string; 
}) => {
  const { sessionId, inviteToken } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [joinAs, setJoinAs] = useState<'registered' | 'anonymous'>('registered');
  const [anonymousAlias, setAnonymousAlias] = useState('');
  const [consentsGiven, setConsentsGiven] = useState({
    participation: false,
    recording: false,
    moderation: false,
    emergency: false
  });
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId, inviteToken]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const endpoint = inviteToken 
        ? `/api/flagship-sanctuary/invitation/${inviteToken}/details`
        : `/api/flagship-sanctuary/${sessionId}/details`;
      
      const response = await api.get(endpoint);
      setSessionDetails(response.data);
      
      // Generate random anonymous alias if needed
      if (!anonymousAlias) {
        const adjectives = ['Silent', 'Gentle', 'Calm', 'Peaceful', 'Quiet', 'Wise', 'Kind'];
        const nouns = ['Soul', 'Heart', 'Voice', 'Spirit', 'Mind', 'Being', 'Light'];
        const randomAlias = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
        setAnonymousAlias(randomAlias);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      toast({
        title: "Session Not Found",
        description: "This session may have expired or been cancelled.",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionDetails) return;
    
    // Validate consents
    const requiredConsents = ['participation', 'moderation'];
    if (sessionDetails.emergencyProtocols) requiredConsents.push('emergency');
    
    const missingConsents = requiredConsents.filter(consent => !consentsGiven[consent as keyof typeof consentsGiven]);
    if (missingConsents.length > 0) {
      toast({
        title: "Consent Required",
        description: "Please acknowledge all required consents to join the session.",
        variant: "destructive"
      });
      return;
    }

    if (joinAs === 'anonymous' && !anonymousAlias.trim()) {
      toast({
        title: "Alias Required",
        description: "Please provide an alias to join anonymously.",
        variant: "destructive"
      });
      return;
    }

    try {
      setJoining(true);
      
      const joinData = {
        sessionId: sessionDetails.id,
        inviteToken,
        joinAs,
        anonymousAlias: joinAs === 'anonymous' ? anonymousAlias : undefined,
        consents: consentsGiven,
        timestamp: new Date().toISOString()
      };

      const response = await api.post('/api/flagship-sanctuary/join', joinData);
      
      if (response.data.acknowledgmentId) {
        // Store acknowledgment for session access
        localStorage.setItem(`sanctuary_ack_${sessionDetails.id}`, response.data.acknowledgmentId);
        
        // Check session status
        if (sessionDetails.status === 'scheduled' && sessionDetails.scheduledAt) {
          const scheduledTime = new Date(sessionDetails.scheduledAt);
          const now = new Date();
          
          if (now < scheduledTime) {
            // Session is scheduled for the future - show waiting room
            navigate(`/sanctuary/${sessionDetails.id}/waiting`);
            return;
          }
        }
        
        // Join active session
        navigate(`/sanctuary/${sessionDetails.id}/live`);
        
        toast({
          title: "Joining Session",
          description: `Welcome to "${sessionDetails.topic}"`,
        });
      }
    } catch (error: any) {
      console.error('Failed to join session:', error);
      toast({
        title: "Join Failed",
        description: error.response?.data?.message || "Unable to join the session at this time.",
        variant: "destructive"
      });
    } finally {
      setJoining(false);
    }
  };

  const isScheduledForFuture = sessionDetails?.scheduledAt && new Date(sessionDetails.scheduledAt) > new Date();
  const timeUntilStart = isScheduledForFuture ? new Date(sessionDetails.scheduledAt!).getTime() - new Date().getTime() : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading session details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-destructive/10 flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
            <p className="text-muted-foreground mb-4">This session may have expired or been cancelled.</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Session Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6">
            <div className="flex items-start space-x-4">
              <div className="text-4xl">{sessionDetails.emoji || '🕊️'}</div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">{sessionDetails.topic}</h1>
                {sessionDetails.description && (
                  <p className="text-muted-foreground mb-3">{sessionDetails.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <span>Hosted by {sessionDetails.hostAlias}</span>
                  </div>
                  <Badge variant={sessionDetails.mode === 'public' ? 'secondary' : 'outline'}>
                    {sessionDetails.mode}
                  </Badge>
                  <Badge variant={sessionDetails.status === 'active' ? 'default' : 'secondary'}>
                    {sessionDetails.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Session Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Session Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessionDetails.scheduledAt && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(sessionDetails.scheduledAt), 'PPP p')}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {sessionDetails.currentParticipants}/{sessionDetails.maxParticipants} participants
                </span>
              </div>
              {sessionDetails.estimatedDuration && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{sessionDetails.estimatedDuration} minutes</span>
                </div>
              )}
              {sessionDetails.language && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{sessionDetails.language.toUpperCase()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Safety Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Monitoring</span>
                {sessionDetails.aiMonitoring ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Moderation Level</span>
                <Badge variant="secondary">{sessionDetails.moderationLevel}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Emergency Protocols</span>
                {sessionDetails.emergencyProtocols ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Anonymous Access</span>
                {sessionDetails.allowAnonymous ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Join Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Join Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Join As Selection */}
            {sessionDetails.allowAnonymous && (
              <div className="space-y-3">
                <label className="text-sm font-medium">Join As</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setJoinAs('registered')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      joinAs === 'registered' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Registered User</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Use your account identity</p>
                  </button>
                  <button
                    onClick={() => setJoinAs('anonymous')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      joinAs === 'anonymous' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Anonymous</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Join with an alias</p>
                  </button>
                </div>
              </div>
            )}

            {/* Anonymous Alias Input */}
            {joinAs === 'anonymous' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Alias</label>
                <input
                  type="text"
                  value={anonymousAlias}
                  onChange={(e) => setAnonymousAlias(e.target.value)}
                  placeholder="Enter a display name..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={30}
                />
              </div>
            )}

            <Separator />

            {/* Consent Checkboxes */}
            <div className="space-y-4">
              <h4 className="font-medium">Required Acknowledgments</h4>
              
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentsGiven.participation}
                  onChange={(e) => setConsentsGiven(prev => ({ ...prev, participation: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Participation Agreement</p>
                  <p className="text-xs text-muted-foreground">
                    I understand this is a supportive space and agree to participate respectfully.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentsGiven.moderation}
                  onChange={(e) => setConsentsGiven(prev => ({ ...prev, moderation: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">AI Moderation Consent</p>
                  <p className="text-xs text-muted-foreground">
                    I consent to AI monitoring for safety and community guidelines enforcement.
                  </p>
                </div>
              </label>

              {sessionDetails.emergencyProtocols && (
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentsGiven.emergency}
                    onChange={(e) => setConsentsGiven(prev => ({ ...prev, emergency: e.target.checked }))}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">Emergency Protocol Agreement</p>
                    <p className="text-xs text-muted-foreground">
                      I understand emergency protocols may be activated if concerning content is detected.
                    </p>
                  </div>
                </label>
              )}

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentsGiven.recording}
                  onChange={(e) => setConsentsGiven(prev => ({ ...prev, recording: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">Recording Policy (Optional)</p>
                  <p className="text-xs text-muted-foreground">
                    I consent to session recording for safety and improvement purposes.
                  </p>
                </div>
              </label>
            </div>

            {/* Scheduled Session Warning */}
            {isScheduledForFuture && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Session Scheduled</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  This session is scheduled to start {format(new Date(sessionDetails.scheduledAt!), 'PPP p')}. 
                  You'll join the waiting room until it begins.
                </p>
                {timeUntilStart > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Time until start: {Math.floor(timeUntilStart / (1000 * 60 * 60))}h {Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60))}m
                  </p>
                )}
              </div>
            )}

            {/* Join Button */}
            <Button 
              onClick={handleJoinSession}
              disabled={joining || !consentsGiven.participation || !consentsGiven.moderation}
              className="w-full"
              size="lg"
            >
              {joining ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isScheduledForFuture ? 'Join Waiting Room' : 'Join Session Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
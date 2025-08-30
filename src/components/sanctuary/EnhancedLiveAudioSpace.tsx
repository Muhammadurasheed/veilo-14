import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSanctuarySocket } from '@/hooks/useSanctuarySocket';
import { VoiceModulationPanel } from './VoiceModulationPanel';
import api from '@/services/api';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Hand, 
  Users, 
  PhoneOff,
  Settings,
  AlertTriangle,
  Shield,
  MessageCircle,
  MoreVertical,
  Crown,
  Eye,
  EyeOff,
  Waves,
  Activity
} from 'lucide-react';
import type { LiveSanctuarySession, LiveParticipant } from '@/types';

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

export interface EnhancedLiveAudioSpaceProps {
  session: LiveSanctuarySession;
  onSessionEnd?: () => void;
  currentUser?: {
    id: string;
    alias: string;
    isHost?: boolean;
    isModerator?: boolean;
  };
  onLeave?: () => void;
}

export const EnhancedLiveAudioSpace = ({ 
  session, 
  currentUser = { id: 'anonymous', alias: 'Anonymous' }, 
  onLeave = () => {},
  onSessionEnd = () => {} 
}: EnhancedLiveAudioSpaceProps) => {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [participants, setParticipants] = useState<LiveParticipant[]>(session.participants || []);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(true);
  const [showChat, setShowChat] = useState(false);
  
  // Voice modulation state
  const [voiceModulationEnabled, setVoiceModulationEnabled] = useState(true);
  const [currentVoiceStyle, setCurrentVoiceStyle] = useState('natural');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 50,
    similarityBoost: 75,
    style: 0,
    useSpeakerBoost: true
  });
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);

  // Socket connection for real-time events
  const {
    onEvent,
    sendEmojiReaction,
    toggleHand,
    promoteToSpeaker,
    muteParticipant,
    kickParticipant,
    sendEmergencyAlert
  } = useSanctuarySocket({
    sessionId: session.id,
    participant: {
      id: currentUser.id,
      alias: currentUser.alias,
      isHost: currentUser.isHost,
      isModerator: currentUser.isModerator
    }
  });

  // Audio context and stream management
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const voicePipelineRef = useRef<any>(null);

  useEffect(() => {
    // Listen for participant events
    const cleanupEvents = [
      onEvent('audio_participant_joined', (data) => {
        setParticipants(prev => [...prev, data.participant]);
        toast({
          title: "Participant Joined",
          description: `${data.participant.alias} joined the audio space`,
        });
      }),

      onEvent('audio_participant_left', (data) => {
        setParticipants(prev => prev.filter(p => p.id !== data.participantId));
        toast({
          title: "Participant Left", 
          description: `${data.participantAlias} left the audio space`,
        });
      }),

      onEvent('hand_raised', (data) => {
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, handRaised: data.isRaised }
            : p
        ));
        
        if (data.isRaised) {
          toast({
            title: "Hand Raised",
            description: `${data.participantAlias} raised their hand`,
          });
        }
      }),

      onEvent('participant_muted', (data) => {
        setParticipants(prev => prev.map(p => 
          p.id === data.participantId 
            ? { ...p, isMuted: true }
            : p
        ));
        
        if (data.participantId === currentUser.id) {
          setIsMuted(true);
        }
      }),

      onEvent('emoji_reaction', (data) => {
        toast({
          title: `${data.emoji} Reaction`,
          description: `From ${data.participantAlias}`,
        });
      }),

      onEvent('emergency_alert', (data) => {
        toast({
          title: "🚨 Emergency Alert",
          description: data.message,
          variant: "destructive"
        });
      })
    ];

    return () => {
      cleanupEvents.forEach(cleanup => cleanup?.());
    };
  }, [onEvent, currentUser.id, toast]);

  // Initialize audio when component mounts
  useEffect(() => {
    initializeAudio();
    return () => {
      cleanup();
    };
  }, []);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      
      // Initialize audio context for level monitoring and voice processing
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      micAnalyserRef.current = audioContextRef.current.createAnalyser();
      micAnalyserRef.current.fftSize = 256;
      source.connect(micAnalyserRef.current);
      
      // Initialize voice processing pipeline
      await initializeVoicePipeline();
      
      // Start audio level monitoring
      monitorAudioLevel();
      
      toast({
        title: "Audio Initialized",
        description: "Microphone access granted with voice modulation ready",
      });
    } catch (error) {
      console.error('Audio initialization failed:', error);
      toast({
        title: "Audio Access Denied",
        description: "Please allow microphone access to participate in audio",
        variant: "destructive"
      });
    }
  };

  const initializeVoicePipeline = async () => {
    if (!audioContextRef.current || !streamRef.current) return;
    
    try {
      // Create voice processing pipeline with real-time capabilities
      const workletUrl = '/js/voice-processor-worklet.js';
      await audioContextRef.current.audioWorklet.addModule(workletUrl);
      
      const voiceProcessor = new AudioWorkletNode(audioContextRef.current, 'voice-processor', {
        processorOptions: {
          voiceStyle: currentVoiceStyle,
          settings: voiceSettings,
          enabled: voiceModulationEnabled
        }
      });
      
      voicePipelineRef.current = voiceProcessor;
      
      // Connect processing pipeline
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(voiceProcessor);
      
      console.log('✅ Voice processing pipeline initialized');
    } catch (error) {
      console.warn('⚠️ Voice processing not available, falling back to standard audio:', error);
    }
  };

  const monitorAudioLevel = () => {
    if (!micAnalyserRef.current) return;

    const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
    
    const checkLevel = () => {
      if (micAnalyserRef.current) {
        micAnalyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.floor((average / 255) * 100));
      }
      requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleToggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
        
        toast({
          title: isMuted ? "Microphone Unmuted" : "Microphone Muted",
          description: isMuted ? "You can now speak" : "Your microphone is muted",
        });
      }
    }
  };

  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened);
    toast({
      title: isDeafened ? "Audio Enabled" : "Audio Deafened", 
      description: isDeafened ? "You can now hear others" : "Audio output disabled",
    });
  };

  const handleRaiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    toggleHand(newState);
    
    toast({
      title: newState ? "Hand Raised" : "Hand Lowered",
      description: newState ? "Waiting for host permission to speak" : "Hand lowered",
    });
  };

  const handleVoiceModulationToggle = async (enabled: boolean) => {
    setVoiceModulationEnabled(enabled);
    
    if (voicePipelineRef.current) {
      voicePipelineRef.current.port.postMessage({
        type: 'toggle',
        enabled
      });
    }
    
    toast({
      title: enabled ? "Voice Modulation Enabled" : "Voice Modulation Disabled",
      description: enabled ? "Your voice will be modified" : "Using natural voice",
    });
  };

  const handleVoiceStyleChange = async (styleId: string) => {
    setCurrentVoiceStyle(styleId);
    
    if (voicePipelineRef.current) {
      voicePipelineRef.current.port.postMessage({
        type: 'style-change',
        styleId,
        settings: voiceSettings
      });
    }
  };

  const handleVoiceSettingsChange = (settings: VoiceSettings) => {
    setVoiceSettings(settings);
    
    if (voicePipelineRef.current) {
      voicePipelineRef.current.port.postMessage({
        type: 'settings-update',
        settings
      });
    }
  };

  const handleTestVoice = async () => {
    setIsVoiceProcessing(true);
    
    try {
      // Test voice modulation with sample text
      const response = await api.post('/api/flagship-sanctuary/test-voice', {
        text: "Hello, this is a test of your current voice modulation settings.",
        voiceStyle: currentVoiceStyle,
        settings: voiceSettings
      });
      
      // Play the test audio
      if (response.data.audioUrl) {
        const audio = new Audio(response.data.audioUrl);
        await audio.play();
      }
      
      toast({
        title: "Voice Test Complete",
        description: "How does your modulated voice sound?",
      });
    } catch (error) {
      console.error('Voice test failed:', error);
      toast({
        title: "Voice Test Failed",
        description: "Unable to test voice modulation",
        variant: "destructive"
      });
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const handlePromoteToSpeaker = (participantId: string) => {
    promoteToSpeaker(participantId);
    toast({
      title: "Participant Promoted",
      description: "User has been given speaker permissions",
    });
  };

  const handleMuteParticipant = (participantId: string) => {
    muteParticipant(participantId);
    toast({
      title: "Participant Muted",
      description: "User has been muted by moderator",
    });
  };

  const handleKickParticipant = (participantId: string) => {
    kickParticipant(participantId);
    toast({
      title: "Participant Removed",
      description: "User has been removed from the session",
    });
  };

  const handleEmergencyAlert = () => {
    sendEmergencyAlert('help_needed', 'Emergency assistance requested in audio session');
    toast({
      title: "Emergency Alert Sent",
      description: "Help has been requested",
      variant: "destructive"
    });
  };

  const handleEmojiReaction = (emoji: string) => {
    sendEmojiReaction(emoji);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{session.emoji || '🕊️'}</div>
              <div>
                <h1 className="text-xl font-bold">{session.topic}</h1>
                <p className="text-sm text-muted-foreground">
                  {participants.length} participants • {session.hostAlias} hosting
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                <Activity className="h-3 w-3 mr-1" />
                {session.status}
              </Badge>
              {voiceModulationEnabled && (
                <Badge variant="outline" className="bg-primary/5">
                  <Waves className="h-3 w-3 mr-1" />
                  Voice Enhanced
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Audio Controls */}
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex justify-center space-x-4 mb-4">
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={handleToggleMute}
              className="px-6"
            >
              {isMuted ? (
                <MicOff className="h-5 w-5 mr-2" />
              ) : (
                <Mic className="h-5 w-5 mr-2" />
              )}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            
            <Button
              size="lg" 
              variant={isDeafened ? "destructive" : "outline"}
              onClick={handleToggleDeafen}
            >
              {isDeafened ? (
                <VolumeX className="h-5 w-5 mr-2" />
              ) : (
                <Volume2 className="h-5 w-5 mr-2" />
              )}
              {isDeafened ? 'Undeafen' : 'Deafen'}
            </Button>

            {!currentUser.isHost && (
              <Button
                size="lg"
                variant={handRaised ? "default" : "outline"}
                onClick={handleRaiseHand}
                className={handRaised ? "bg-yellow-500 hover:bg-yellow-600" : ""}
              >
                <Hand className="h-5 w-5 mr-2" />
                {handRaised ? 'Lower Hand' : 'Raise Hand'}
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowVoicePanel(!showVoicePanel)}
            >
              <Waves className="h-5 w-5 mr-2" />
              Voice
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={onLeave}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Leave
            </Button>
          </div>

          {/* Audio Level Indicator */}
          {!isMuted && (
            <div className="flex items-center justify-center space-x-2">
              <Mic className="h-4 w-4" />
              <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{audioLevel}%</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Center Content */}
          <div className="flex-1 p-6">
            {showVoicePanel ? (
              <VoiceModulationPanel
                isEnabled={voiceModulationEnabled}
                onToggle={handleVoiceModulationToggle}
                currentVoiceStyle={currentVoiceStyle}
                onVoiceStyleChange={handleVoiceStyleChange}
                voiceSettings={voiceSettings}
                onSettingsChange={handleVoiceSettingsChange}
                isProcessing={isVoiceProcessing}
                onTestVoice={handleTestVoice}
              />
            ) : (
              <div className="space-y-6">
                {/* Emoji Reactions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Reactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center space-x-2">
                      {['👍', '👏', '❤️', '😂', '🤔', '👎', '🙏', '✨'].map((emoji) => (
                        <Button
                          key={emoji}
                          variant="outline"
                          size="sm"
                          onClick={() => handleEmojiReaction(emoji)}
                          className="text-2xl hover:scale-110 transition-transform"
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Emergency Controls */}
                <Card className="border-destructive/20">
                  <CardContent className="pt-6">
                    <div className="flex justify-center">
                      <Button
                        variant="destructive"
                        onClick={handleEmergencyAlert}
                        className="flex items-center"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Request Emergency Help
                      </Button>
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-2">
                      Use only in case of genuine emergencies
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Participants Sidebar */}
          {showParticipantsList && (
            <div className="w-80 border-l bg-muted/20">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Participants ({participants.length})
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowParticipantsList(false)}
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-3 bg-background rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`/avatars/avatar-${participant.avatarIndex || 1}.svg`} />
                        <AvatarFallback>
                          {participant.alias.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{participant.alias}</p>
                          {participant.isHost && (
                            <Crown className="h-4 w-4 text-primary" />
                          )}
                          {participant.isModerator && (
                            <Shield className="h-4 w-4 text-secondary" />
                          )}
                          {participant.handRaised && (
                            <Hand className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${participant.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-muted-foreground">{participant.connectionStatus}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {participant.isMuted ? (
                        <MicOff className="h-4 w-4 text-destructive" />
                      ) : (
                        <Mic className="h-4 w-4 text-green-500" />
                      )}
                      
                      {/* Audio level indicator for active speakers */}
                      {!participant.isMuted && participant.audioLevel && participant.audioLevel > 0 && (
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-3 rounded-full ${
                                (participant.audioLevel || 0) > (i + 1) * 33
                                  ? 'bg-green-500'
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Host/Moderator Controls */}
                      {(currentUser.isHost || currentUser.isModerator) && participant.id !== currentUser.id && (
                        <div className="flex space-x-1">
                          {participant.handRaised && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromoteToSpeaker(participant.id)}
                            >
                              Allow
                            </Button>
                          )}
                          <Button
                            size="sm" 
                            variant="outline"
                            onClick={() => handleMuteParticipant(participant.id)}
                          >
                            Mute
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleKickParticipant(participant.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!showParticipantsList && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowParticipantsList(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Show Participants
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowChat(!showChat)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Session: {session.id} • Quality: Excellent
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
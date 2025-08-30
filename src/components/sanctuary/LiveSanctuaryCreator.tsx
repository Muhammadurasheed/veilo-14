import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, Lock, Globe, Eye, Mic, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { format } from 'date-fns';

interface SanctuarySettings {
  topic: string;
  description: string;
  emoji: string;
  mode: 'public' | 'private' | 'invite-only';
  maxParticipants: number;
  scheduledDateTime?: string;
  estimatedDuration: number;
  language: string;
  allowAnonymous: boolean;
  recordingConsent: boolean;
  aiMonitoring: boolean;
  moderationLevel: 'low' | 'medium' | 'high' | 'strict';
  emergencyProtocols: boolean;
  tags: string[];
}

const EMOJI_OPTIONS = ['💭', '🌅', '🌙', '💚', '🔮', '🎭', '🌊', '🔥', '⭐', '🌸', '🎨', '📚', '🎵', '🧘‍♀️', '💫'];
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ar', label: 'Arabic' }
];

const TAG_SUGGESTIONS = [
  'Mental Health', 'Anxiety', 'Depression', 'Stress Relief', 'Meditation',
  'Self Care', 'Support Group', 'Recovery', 'Mindfulness', 'Wellness',
  'Grief Support', 'Trauma Recovery', 'Addiction Support', 'Sleep Issues',
  'Relationships', 'Career Stress', 'Student Life', 'Parenting'
];

export const LiveSanctuaryCreator: React.FC = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [settings, setSettings] = useState<SanctuarySettings>({
    topic: '',
    description: '',
    emoji: '💭',
    mode: 'public',
    maxParticipants: 10,
    estimatedDuration: 60,
    language: 'en',
    allowAnonymous: true,
    recordingConsent: false,
    aiMonitoring: true,
    moderationLevel: 'medium',
    emergencyProtocols: true,
    tags: []
  });

  const [customTag, setCustomTag] = useState('');

  const handleCreateSanctuary = async () => {
    if (!settings.topic.trim()) {
      toast.error('Please enter a topic for your sanctuary');
      return;
    }

    if (settings.scheduledDateTime && new Date(settings.scheduledDateTime) <= new Date()) {
      toast.error('Scheduled time must be in the future');
      return;
    }

    setIsCreating(true);
    try {
      const response = await axios.post('/api/flagship-sanctuary/create', {
        ...settings,
        hostAlias: `Host_${Math.random().toString(36).substring(2, 8)}`
      });

      const { session, hostToken, inviteLink } = response.data;
      
      toast.success('Sanctuary created successfully!');
      
      // Navigate to the session with host token
      navigate(`/sanctuary/live/${session.id}?host=${hostToken}`);
      
    } catch (error: any) {
      console.error('Failed to create sanctuary:', error);
      toast.error(error.response?.data?.message || 'Failed to create sanctuary');
    } finally {
      setIsCreating(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !settings.tags.includes(tag) && settings.tags.length < 5) {
      setSettings(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCustomTagAdd = () => {
    if (customTag.trim()) {
      addTag(customTag.trim());
      setCustomTag('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Create Live Sanctuary
          </h1>
          <p className="text-muted-foreground">Design a safe space for meaningful conversations</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2">
                    <Label>Emoji</Label>
                    <Select value={settings.emoji} onValueChange={(value) => setSettings(prev => ({ ...prev, emoji: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EMOJI_OPTIONS.map(emoji => (
                          <SelectItem key={emoji} value={emoji}>{emoji}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-10">
                    <Label>Topic *</Label>
                    <Input 
                      placeholder="What's your sanctuary about?"
                      value={settings.topic}
                      onChange={(e) => setSettings(prev => ({ ...prev, topic: e.target.value }))}
                      maxLength={100}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe what participants can expect..."
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    maxLength={500}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Language</Label>
                    <Select value={settings.language} onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max Participants</Label>
                    <Select 
                      value={settings.maxParticipants.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, maxParticipants: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 30, 50].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} people</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy & Access */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Privacy & Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { value: 'public', icon: Globe, label: 'Public' },
                      { value: 'private', icon: Lock, label: 'Private' },
                      { value: 'invite-only', icon: Eye, label: 'Invite Only' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setSettings(prev => ({ ...prev, mode: option.value as any }))}
                        className={`p-3 rounded-lg border text-sm flex flex-col items-center gap-2 transition-colors ${
                          settings.mode === option.value 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Anonymous Participants</Label>
                      <p className="text-sm text-muted-foreground">Let people join without registering</p>
                    </div>
                    <Switch 
                      checked={settings.allowAnonymous}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowAnonymous: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Monitoring</Label>
                      <p className="text-sm text-muted-foreground">Detect and prevent harmful content</p>
                    </div>
                    <Switch 
                      checked={settings.aiMonitoring}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, aiMonitoring: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Emergency Protocols</Label>
                      <p className="text-sm text-muted-foreground">Crisis detection and intervention</p>
                    </div>
                    <Switch 
                      checked={settings.emergencyProtocols}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emergencyProtocols: checked }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Moderation Level</Label>
                  <Select 
                    value={settings.moderationLevel} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, moderationLevel: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Basic filtering</SelectItem>
                      <SelectItem value="medium">Medium - Balanced protection</SelectItem>
                      <SelectItem value="high">High - Strict filtering</SelectItem>
                      <SelectItem value="strict">Strict - Maximum protection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Scheduling (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date & Time</Label>
                    <Input 
                      type="datetime-local"
                      value={settings.scheduledDateTime || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, scheduledDateTime: e.target.value || undefined }))}
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    />
                  </div>
                  <div>
                    <Label>Estimated Duration (minutes)</Label>
                    <Select 
                      value={settings.estimatedDuration.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, estimatedDuration: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[30, 45, 60, 90, 120, 180].map(duration => (
                          <SelectItem key={duration} value={duration.toString()}>{duration} minutes</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {settings.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add custom tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCustomTagAdd()}
                      maxLength={20}
                    />
                    <Button size="sm" onClick={handleCustomTagAdd}>Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Suggested:</Label>
                  <div className="flex flex-wrap gap-1">
                    {TAG_SUGGESTIONS.filter(tag => !settings.tags.includes(tag)).slice(0, 8).map(tag => (
                      <button
                        key={tag}
                        onClick={() => addTag(tag)}
                        className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary/10 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{settings.emoji}</span>
                  <div>
                    <h3 className="font-semibold truncate">{settings.topic || 'Untitled Sanctuary'}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{settings.maxParticipants} max</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{settings.estimatedDuration}min</span>
                    </div>
                  </div>
                </div>
                
                {settings.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{settings.description}</p>
                )}
                
                <div className="flex items-center gap-2">
                  {settings.mode === 'public' && <Globe className="w-3 h-3 text-green-500" />}
                  {settings.mode === 'private' && <Lock className="w-3 h-3 text-orange-500" />}
                  {settings.mode === 'invite-only' && <Eye className="w-3 h-3 text-blue-500" />}
                  <span className="text-xs capitalize text-muted-foreground">{settings.mode.replace('-', ' ')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Create Button */}
            <Button 
              onClick={handleCreateSanctuary}
              disabled={isCreating || !settings.topic.trim()}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Sanctuary'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
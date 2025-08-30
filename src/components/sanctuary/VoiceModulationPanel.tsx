import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  Settings, 
  Volume2, 
  Waves, 
  Zap,
  User,
  Crown,
  Heart,
  Brain,
  Wind,
  Mountain,
  Sun,
  Moon,
  Star,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react';

interface VoiceStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  voiceId: string;
  category: 'natural' | 'character' | 'mood';
}

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

interface VoiceModulationPanelProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  currentVoiceStyle: string;
  onVoiceStyleChange: (styleId: string) => void;
  voiceSettings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  isProcessing: boolean;
  onTestVoice: () => void;
}

const voiceStyles: VoiceStyle[] = [
  {
    id: 'natural',
    name: 'Natural',
    description: 'Your authentic voice with slight enhancement',
    icon: <User className="h-4 w-4" />,
    voiceId: '9BWtsMINqrJLrRacOk9x',
    category: 'natural'
  },
  {
    id: 'deep',
    name: 'Deep',
    description: 'Rich, authoritative tone',
    icon: <Mountain className="h-4 w-4" />,
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
    category: 'character'
  },
  {
    id: 'gentle',
    name: 'Gentle',
    description: 'Soft, calming presence',
    icon: <Heart className="h-4 w-4" />,
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    category: 'mood'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clear, confident delivery',
    icon: <Crown className="h-4 w-4" />,
    voiceId: 'FGY2WhTYpPnrIDTdsKH5',
    category: 'character'
  },
  {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm, approachable tone',
    icon: <Sun className="h-4 w-4" />,
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    category: 'mood'
  },
  {
    id: 'authoritative',
    name: 'Authoritative',
    description: 'Strong, commanding presence',
    icon: <Crown className="h-4 w-4" />,
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    category: 'character'
  },
  {
    id: 'calm',
    name: 'Calm',
    description: 'Peaceful, meditative quality',
    icon: <Moon className="h-4 w-4" />,
    voiceId: 'N2lVS1w4EtoT3dr4eOWO',
    category: 'mood'
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'Vibrant, dynamic tone',
    icon: <Zap className="h-4 w-4" />,
    voiceId: 'SAz9YHcvj6GT2YYXdXww',
    category: 'mood'
  },
  {
    id: 'young',
    name: 'Youthful',
    description: 'Fresh, spirited voice',
    icon: <Star className="h-4 w-4" />,
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    category: 'character'
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Comforting, nurturing tone',
    icon: <Heart className="h-4 w-4" />,
    voiceId: 'XB0fDUnXU5powFXDhCwa',
    category: 'mood'
  }
];

export const VoiceModulationPanel = ({
  isEnabled,
  onToggle,
  currentVoiceStyle,
  onVoiceStyleChange,
  voiceSettings,
  onSettingsChange,
  isProcessing,
  onTestVoice
}: VoiceModulationPanelProps) => {
  const { toast } = useToast();
  const [expandedCategory, setExpandedCategory] = useState<string>('natural');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentStyle = voiceStyles.find(style => style.id === currentVoiceStyle);
  const categories = ['natural', 'character', 'mood'] as const;

  const handleVoiceStyleSelect = (styleId: string) => {
    onVoiceStyleChange(styleId);
    const style = voiceStyles.find(s => s.id === styleId);
    toast({
      title: "Voice Style Updated",
      description: `Switched to ${style?.name} voice`,
    });
  };

  const handleSettingChange = (key: keyof VoiceSettings, value: number | boolean) => {
    onSettingsChange({
      ...voiceSettings,
      [key]: value
    });
  };

  const resetToDefaults = () => {
    onSettingsChange({
      stability: 50,
      similarityBoost: 75,
      style: 0,
      useSpeakerBoost: true
    });
    toast({
      title: "Settings Reset",
      description: "Voice settings restored to defaults",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Waves className="h-5 w-5 mr-2" />
            Voice Modulation
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={onToggle}
            />
            <span className="text-sm text-muted-foreground">
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!isEnabled && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Enable voice modulation to mask your identity and choose from various voice styles
            </p>
          </div>
        )}

        {isEnabled && (
          <>
            {/* Current Voice Style Display */}
            <div className="bg-primary/5 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  {currentStyle?.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{currentStyle?.name}</h4>
                  <p className="text-sm text-muted-foreground">{currentStyle?.description}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onTestVoice}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Test
                </Button>
              </div>
            </div>

            {/* Voice Style Categories */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Choose Voice Style
              </h4>
              
              {categories.map(category => {
                const categoryStyles = voiceStyles.filter(style => style.category === category);
                const isExpanded = expandedCategory === category;
                
                return (
                  <div key={category} className="space-y-2">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? '' : category)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium capitalize">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryStyles.length}
                      </Badge>
                    </button>
                    
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-2 pl-4">
                        {categoryStyles.map(style => (
                          <button
                            key={style.id}
                            onClick={() => handleVoiceStyleSelect(style.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              currentVoiceStyle === style.id
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-border hover:border-primary/50 hover:bg-muted/30'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {style.icon}
                              <span className="font-medium text-sm">{style.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {style.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Advanced Settings</span>
                <Badge variant="outline" className="text-xs">
                  {showAdvanced ? 'Hide' : 'Show'}
                </Badge>
              </button>

              {showAdvanced && (
                <div className="space-y-6 p-4 bg-muted/30 rounded-lg">
                  {/* Stability */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Stability</label>
                      <span className="text-xs text-muted-foreground">{voiceSettings.stability}%</span>
                    </div>
                    <Slider
                      value={[voiceSettings.stability]}
                      onValueChange={([value]) => handleSettingChange('stability', value)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values create more consistent voice patterns
                    </p>
                  </div>

                  {/* Similarity Boost */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Clarity</label>
                      <span className="text-xs text-muted-foreground">{voiceSettings.similarityBoost}%</span>
                    </div>
                    <Slider
                      value={[voiceSettings.similarityBoost]}
                      onValueChange={([value]) => handleSettingChange('similarityBoost', value)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enhances voice clarity and pronunciation
                    </p>
                  </div>

                  {/* Style Intensity */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Style Intensity</label>
                      <span className="text-xs text-muted-foreground">{voiceSettings.style}%</span>
                    </div>
                    <Slider
                      value={[voiceSettings.style]}
                      onValueChange={([value]) => handleSettingChange('style', value)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Controls how strongly the voice style is applied
                    </p>
                  </div>

                  {/* Speaker Boost */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Speaker Boost</label>
                      <p className="text-xs text-muted-foreground">
                        Enhances speaker distinctiveness
                      </p>
                    </div>
                    <Switch
                      checked={voiceSettings.useSpeakerBoost}
                      onCheckedChange={(checked) => handleSettingChange('useSpeakerBoost', checked)}
                    />
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-center pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={resetToDefaults}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-amber-800">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Processing voice modulation...</span>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
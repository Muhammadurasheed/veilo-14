const axios = require('axios');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.defaultVoiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || '9BWtsMINqrJLrRacOk9x';
    
    // Voice mapping for different modulation styles
    this.voiceStyles = {
      'natural': '9BWtsMINqrJLrRacOk9x', // Aria
      'deep': 'CwhRBWXzGAHq8TQ4Fs17', // Roger  
      'gentle': 'EXAVITQu4vr4xnSDxMaL', // Sarah
      'professional': 'FGY2WhTYpPnrIDTdsKH5', // Laura
      'friendly': 'IKne3meq5aSn9XLyUdCD', // Charlie
      'authoritative': 'JBFqnCBsd6RMkjVDRZzb', // George
      'calm': 'N2lVS1w4EtoT3dr4eOWO', // Callum
      'energetic': 'SAz9YHcvj6GT2YYXdXww', // River
      'young': 'TX3LPaxmHKxFdv7VOQHJ', // Liam
      'warm': 'XB0fDUnXU5powFXDhCwa' // Charlotte
    };

    if (!this.apiKey) {
      console.warn('⚠️ ElevenLabs API key not found. Voice modulation will be disabled.');
    }
  }

  isEnabled() {
    return !!this.apiKey;
  }

  getAvailableVoiceStyles() {
    return Object.keys(this.voiceStyles).map(style => ({
      id: style,
      name: this.capitalizeFirst(style),
      voiceId: this.voiceStyles[style]
    }));
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async getVoices() {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      console.log('✅ ElevenLabs voices fetched successfully');
      return response.data.voices;
    } catch (error) {
      console.error('❌ ElevenLabs getVoices error:', error.response?.data || error.message);
      throw new Error('Failed to fetch available voices');
    }
  }

  async generateSpeech(text, voiceStyle = 'natural', options = {}) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.voiceStyles[voiceStyle] || this.defaultVoiceId;
    
    const requestBody = {
      text: text,
      model_id: options.model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: options.stability || 0.5,
        similarity_boost: options.similarity_boost || 0.8,
        style: options.style || 0.0,
        use_speaker_boost: options.use_speaker_boost || true
      }
    };

    try {
      console.log(`🎙️ Generating speech with ElevenLabs (voice: ${voiceStyle})`);
      
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        requestBody,
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer'
        }
      );

      console.log('✅ ElevenLabs speech generated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ ElevenLabs generateSpeech error:', error.response?.data || error.message);
      throw new Error('Failed to generate speech with ElevenLabs');
    }
  }

  async generateVoiceModulation(audioBuffer, targetVoiceStyle = 'natural', options = {}) {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = this.voiceStyles[targetVoiceStyle] || this.defaultVoiceId;

    try {
      console.log(`🎭 Applying voice modulation (style: ${targetVoiceStyle})`);
      
      // This would use ElevenLabs Speech-to-Speech API when available
      // For now, we'll simulate the voice modulation process
      
      const formData = new FormData();
      formData.append('audio', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'input.mp3');
      formData.append('voice_id', voiceId);
      formData.append('model_id', options.model || 'eleven_multilingual_sts_v2');
      
      const response = await axios.post(
        `${this.baseUrl}/speech-to-speech/${voiceId}`,
        formData,
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            ...formData.getHeaders?.()
          },
          responseType: 'arraybuffer'
        }
      );

      console.log('✅ Voice modulation applied successfully');
      return response.data;
    } catch (error) {
      console.error('❌ ElevenLabs voice modulation error:', error.response?.data || error.message);
      // Fallback: return original audio if modulation fails
      console.log('⚠️ Falling back to original audio');
      return audioBuffer;
    }
  }

  async validateVoiceSettings(settings) {
    const validatedSettings = {
      voice_style: settings.voice_style || 'natural',
      stability: Math.max(0, Math.min(1, settings.stability || 0.5)),
      similarity_boost: Math.max(0, Math.min(1, settings.similarity_boost || 0.8)),
      style: Math.max(0, Math.min(1, settings.style || 0.0)),
      use_speaker_boost: Boolean(settings.use_speaker_boost)
    };

    // Validate voice style exists
    if (!this.voiceStyles[validatedSettings.voice_style]) {
      validatedSettings.voice_style = 'natural';
    }

    return validatedSettings;
  }

  async getVoiceModelUsage() {
    if (!this.apiKey) {
      return { usage: 0, limit: 0 };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return {
        usage: response.data.subscription?.character_count || 0,
        limit: response.data.subscription?.character_limit || 0,
        reset_date: response.data.subscription?.next_character_count_reset_unix
      };
    } catch (error) {
      console.error('❌ ElevenLabs usage check error:', error.response?.data || error.message);
      return { usage: 0, limit: 0 };
    }
  }

  // Real-time voice processing for live audio
  async processLiveAudio(audioChunk, participantSettings) {
    if (!this.apiKey || !participantSettings.enableVoiceModulation) {
      return audioChunk; // Return original if not enabled
    }

    try {
      const validatedSettings = await this.validateVoiceSettings(participantSettings);
      
      // For real-time processing, we'd use a faster model
      const modifiedAudio = await this.generateVoiceModulation(
        audioChunk, 
        validatedSettings.voice_style,
        {
          model: 'eleven_turbo_v2_5', // Faster model for real-time
          stability: validatedSettings.stability,
          similarity_boost: validatedSettings.similarity_boost,
          style: validatedSettings.style,
          use_speaker_boost: validatedSettings.use_speaker_boost
        }
      );

      return modifiedAudio;
    } catch (error) {
      console.error('❌ Live audio processing error:', error.message);
      return audioChunk; // Fallback to original
    }
  }

  // Batch process multiple audio segments
  async batchProcessAudio(audioSegments, settings) {
    const results = [];
    
    for (const segment of audioSegments) {
      try {
        const processed = await this.processLiveAudio(segment.audio, settings);
        results.push({
          id: segment.id,
          audio: processed,
          timestamp: segment.timestamp
        });
      } catch (error) {
        console.error(`❌ Error processing segment ${segment.id}:`, error.message);
        results.push({
          id: segment.id,
          audio: segment.audio, // Fallback to original
          timestamp: segment.timestamp,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Singleton instance
const elevenLabsService = new ElevenLabsService();

module.exports = elevenLabsService;
// Voice Processing Audio Worklet for Real-time Voice Modulation
// This worklet handles real-time audio processing for voice modulation

class VoiceProcessorWorklet extends AudioWorkletProcessor {
  constructor(options) {
    super();
    
    this.enabled = options.processorOptions?.enabled || false;
    this.voiceStyle = options.processorOptions?.voiceStyle || 'natural';
    this.settings = options.processorOptions?.settings || {
      stability: 50,
      similarityBoost: 75,
      style: 0,
      useSpeakerBoost: true
    };
    
    // Processing buffers
    this.inputBuffer = [];
    this.outputBuffer = [];
    this.bufferSize = 4096;
    
    // Voice modulation parameters
    this.pitchShift = 1.0;
    this.formantShift = 1.0;
    this.spectralTilt = 0.0;
    this.harmonicEnhancement = 1.0;
    
    // Initialize modulation parameters based on voice style
    this.updateVoiceStyle(this.voiceStyle);
    
    // Listen for control messages
    this.port.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    console.log('🎭 Voice Processor Worklet initialized');
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'toggle':
        this.enabled = data.enabled;
        console.log(`🎭 Voice modulation ${this.enabled ? 'enabled' : 'disabled'}`);
        break;
        
      case 'style-change':
        this.voiceStyle = data.styleId;
        this.settings = data.settings;
        this.updateVoiceStyle(data.styleId);
        console.log(`🎭 Voice style changed to: ${data.styleId}`);
        break;
        
      case 'settings-update':
        this.settings = data.settings;
        this.updateProcessingParameters();
        console.log('🎭 Voice settings updated');
        break;
    }
  }
  
  updateVoiceStyle(styleId) {
    // Define voice style presets
    const styles = {
      'natural': {
        pitchShift: 1.0,
        formantShift: 1.0,
        spectralTilt: 0.0,
        harmonicEnhancement: 1.0
      },
      'deep': {
        pitchShift: 0.85,
        formantShift: 0.9,
        spectralTilt: -0.2,
        harmonicEnhancement: 1.2
      },
      'gentle': {
        pitchShift: 1.1,
        formantShift: 1.05,
        spectralTilt: 0.1,
        harmonicEnhancement: 0.9
      },
      'professional': {
        pitchShift: 0.95,
        formantShift: 1.0,
        spectralTilt: 0.0,
        harmonicEnhancement: 1.1
      },
      'friendly': {
        pitchShift: 1.05,
        formantShift: 1.02,
        spectralTilt: 0.05,
        harmonicEnhancement: 1.0
      },
      'authoritative': {
        pitchShift: 0.9,
        formantShift: 0.95,
        spectralTilt: -0.1,
        harmonicEnhancement: 1.3
      },
      'calm': {
        pitchShift: 0.98,
        formantShift: 1.0,
        spectralTilt: 0.0,
        harmonicEnhancement: 0.8
      },
      'energetic': {
        pitchShift: 1.08,
        formantShift: 1.03,
        spectralTilt: 0.1,
        harmonicEnhancement: 1.2
      },
      'young': {
        pitchShift: 1.15,
        formantShift: 1.08,
        spectralTilt: 0.15,
        harmonicEnhancement: 1.1
      },
      'warm': {
        pitchShift: 1.02,
        formantShift: 1.01,
        spectralTilt: 0.05,
        harmonicEnhancement: 0.95
      }
    };
    
    const style = styles[styleId] || styles['natural'];
    
    this.pitchShift = style.pitchShift;
    this.formantShift = style.formantShift;
    this.spectralTilt = style.spectralTilt;
    this.harmonicEnhancement = style.harmonicEnhancement;
    
    this.updateProcessingParameters();
  }
  
  updateProcessingParameters() {
    // Adjust parameters based on user settings
    const stabilityFactor = this.settings.stability / 100;
    const clarityFactor = this.settings.similarityBoost / 100;
    const styleFactor = this.settings.style / 100;
    
    // Apply user settings to base voice style
    this.pitchShift = this.pitchShift * (1 + (styleFactor - 0.5) * 0.2);
    this.formantShift = this.formantShift * (1 + (clarityFactor - 0.5) * 0.1);
    
    // Stability affects processing consistency
    this.processingStability = stabilityFactor;
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !this.enabled) {
      // Pass-through mode when disabled
      if (input && input[0] && output && output[0]) {
        output[0].set(input[0]);
      }
      return true;
    }
    
    const inputChannel = input[0];
    const outputChannel = output[0];
    
    // Add input to buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.inputBuffer.push(inputChannel[i]);
    }
    
    // Process when we have enough samples
    if (this.inputBuffer.length >= this.bufferSize) {
      const processedSamples = this.processAudioBlock(
        this.inputBuffer.slice(0, this.bufferSize)
      );
      
      // Add processed samples to output buffer
      this.outputBuffer.push(...processedSamples);
      
      // Remove processed samples from input buffer
      this.inputBuffer = this.inputBuffer.slice(this.bufferSize);
    }
    
    // Output processed samples
    for (let i = 0; i < outputChannel.length; i++) {
      if (this.outputBuffer.length > 0) {
        outputChannel[i] = this.outputBuffer.shift();
      } else {
        outputChannel[i] = inputChannel[i]; // Fallback to input
      }
    }
    
    return true;
  }
  
  processAudioBlock(samples) {
    // Simple real-time voice processing
    // In a production system, this would use more sophisticated DSP
    
    let processed = new Float32Array(samples.length);
    
    for (let i = 0; i < samples.length; i++) {
      let sample = samples[i];
      
      // Apply basic transformations
      
      // Pitch shifting (simplified)
      if (this.pitchShift !== 1.0) {
        sample = this.simplePitchShift(sample, i);
      }
      
      // Formant shifting (basic filtering)
      if (this.formantShift !== 1.0) {
        sample = this.simpleFormantShift(sample);
      }
      
      // Spectral tilt (basic EQ)
      if (this.spectralTilt !== 0.0) {
        sample = this.applySpectralTilt(sample, i);
      }
      
      // Harmonic enhancement
      if (this.harmonicEnhancement !== 1.0) {
        sample = this.enhanceHarmonics(sample);
      }
      
      // Apply stability (noise reduction)
      sample = this.applyStability(sample, i);
      
      processed[i] = Math.max(-1, Math.min(1, sample)); // Clamp
    }
    
    return processed;
  }
  
  simplePitchShift(sample, index) {
    // Very basic pitch shifting using time-domain manipulation
    // This is a simplified approach for real-time processing
    const shift = (this.pitchShift - 1.0) * 0.1;
    return sample * (1 + shift * Math.sin(index * 0.01));
  }
  
  simpleFormantShift(sample) {
    // Basic formant shifting using simple filtering
    const shift = (this.formantShift - 1.0) * 0.2;
    return sample * (1 + shift);
  }
  
  applySpectralTilt(sample, index) {
    // Simple spectral tilt using frequency-dependent gain
    const tilt = this.spectralTilt * 0.3;
    const freq = (index % 100) / 100; // Rough frequency approximation
    return sample * (1 + tilt * freq);
  }
  
  enhanceHarmonics(sample) {
    // Basic harmonic enhancement using saturation
    const enhancement = (this.harmonicEnhancement - 1.0) * 0.1;
    return sample + (Math.sign(sample) * Math.pow(Math.abs(sample), 0.7) * enhancement);
  }
  
  applyStability(sample, index) {
    // Noise reduction based on stability setting
    const noiseThreshold = (1 - this.processingStability) * 0.01;
    if (Math.abs(sample) < noiseThreshold) {
      return sample * 0.5; // Reduce low-level noise
    }
    return sample;
  }
}

// Register the processor
registerProcessor('voice-processor', VoiceProcessorWorklet);
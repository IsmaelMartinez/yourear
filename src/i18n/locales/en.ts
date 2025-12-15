/**
 * English translations
 */

import { TranslationDict } from '../index';

export const en: TranslationDict = {
  common: {
    appName: 'YourEar',
    tagline: 'Discover your hearing capabilities',
    back: 'Back',
    next: 'Next',
    start: 'Start',
    done: 'Done',
    skip: 'Skip',
    cancel: 'Cancel',
    save: 'Save',
    reset: 'Reset',
    tryAgain: 'Try Again',
    checkAgain: 'Check Again',
    viewDetails: 'View Details',
    years: 'years',
    minutes: 'min',
    frequencies: 'frequencies',
  },

  home: {
    title: 'YourEar',
    subtitle: 'Discover your hearing capabilities',
    
    assessment: {
      title: 'Hearing Assessment',
      description: 'Test your hearing across different frequencies to create a personal audiogram.',
      
      beforeYouBegin: 'Before you begin',
      instructions: {
        headphones: 'Use headphones for accurate results',
        quiet: 'Find a quiet environment',
        volume: 'Set your device volume to about 50%',
        time: 'The test takes approximately 5-10 minutes',
      },
      
      fullTest: 'Full Test',
      fullTestDesc: '6 frequencies · ~8 min',
      quickTest: 'Quick Test',
      quickTestDesc: '3 frequencies · ~2 min',
      detailedTest: 'Detailed Test',
      detailedTestDesc: '11 frequencies incl. inter-octave · ~15 min',
    },
    
    disclaimer: {
      title: 'Medical Disclaimer:',
      text: 'This is a self-assessment tool for curiosity and general awareness only. It is NOT a medical diagnosis. Always consult a qualified audiologist for professional hearing evaluation.',
    },
    
    latestResult: {
      title: 'Your Latest Result',
      testedOn: 'Tested on',
    },
    
    history: {
      title: 'Test History',
      compare: 'Compare Tests Over Time',
    },
    
    tools: {
      title: 'Other Tools',
      speechNoise: 'Speech-in-Noise Test',
      speechNoiseDesc: 'Test hearing in noisy environments · ~4 min',
      tinnitus: 'Tinnitus Frequency Matcher',
      tinnitusDesc: 'Identify your tinnitus frequency',
    },
    
    about: {
      title: 'About the Technology',
      description: 'YourEar uses the Web Audio API to generate precise pure tones across the standard audiometric frequencies (250 Hz to 8000 Hz). The test follows a simplified Hughson-Westlake procedure to find your hearing thresholds.',
      limitations: 'Note: Due to hardware limitations of consumer devices, this tool cannot test ultrasonic frequencies (>20 kHz) used by bats or infrasonic frequencies (<20 Hz) used by elephants. That would require specialized microphones and speakers!',
    },
    
    footer: {
      openSource: 'Open source project',
    },
  },

  calibration: {
    setup: 'Setup',
    
    age: {
      title: 'Your Age',
      description: 'Enter your age to compare your results with expected values for your age group.',
      placeholder: 'Age',
    },
    
    noiseCheck: {
      title: 'Check Room Noise',
      description: 'For accurate results, test in a quiet environment. We can check your room\'s noise level.',
      checkButton: 'Check Noise Level',
      skipButton: 'Skip this check',
      micPermission: 'Requires microphone permission (optional)',
      listening: 'Listening to room noise...',
      stayQuiet: 'Please stay quiet for a moment',
      skipped: 'Noise check skipped',
      checkAnyway: 'Check anyway',
      levels: {
        veryQuiet: 'Very Quiet',
        quiet: 'Quiet',
        moderate: 'Moderate Noise',
        loud: 'Loud',
        veryLoud: 'Very Loud',
      },
      recommendations: {
        excellent: 'Excellent! Your environment is very quiet - ideal for testing.',
        good: 'Good. Your environment is acceptably quiet for testing.',
        warning: 'Your environment has some background noise. Results may be slightly affected. Consider finding a quieter space if possible.',
        loud: 'Your environment is quite noisy. We recommend finding a quieter space for more accurate results.',
        veryLoud: 'Your environment is very noisy. Testing is not recommended. Please find a quieter location.',
      },
    },
    
    volumeCalibration: {
      title: 'Volume Calibration',
      description: 'Improve accuracy by calibrating to your device\'s volume level.',
      calibrateButton: 'Calibrate Volume',
      skipButton: 'Skip calibration',
      optional: 'Takes about 30 seconds (optional but recommended)',
      instructions: 'Instructions: Play the 1000 Hz tone and adjust until it sounds like normal conversation volume (as if someone is speaking at arm\'s length).',
      playTone: 'Play Tone',
      pause: 'Pause',
      quieter: 'Quieter',
      louder: 'Louder',
      calibrated: 'Calibrated',
      skipped: 'Skipped',
      recalibrate: 'Recalibrate',
      calibrateNow: 'Calibrate now',
      notCalibrated: 'Not calibrated - using default settings',
      closeToAverage: 'Calibrated - your system is close to average',
      systemOffset: 'Calibrated - your system is {{offset}} dB {{direction}} than average',
    },
    
    headphones: {
      title: 'Test Your Headphones',
      description: 'Click each button to play a test tone. Adjust your volume until comfortable.',
      rightEar: 'Right Ear',
      leftEar: 'Left Ear',
      tip: 'Make sure both ears can hear the test tones!',
    },
    
    beginTest: 'I\'m ready - Begin Test',
  },

  test: {
    title: 'Hearing Test',
    listening: 'Listening...',
    listeningHint: 'A tone will play. Listen carefully.',
    didYouHear: 'Did you hear the tone?',
    heardIt: 'Yes, I heard it',
    didNotHear: 'No, I didn\'t hear it',
    keyboardHint: 'Keyboard: Space/Enter for heard, N/Escape for not heard',
    progress: 'Progress',
    frequency: 'Frequency',
    ear: 'Ear',
    right: 'Right',
    left: 'Left',
    level: 'Level',
    testingRightEar: 'Testing right ear',
    testingLeftEar: 'Testing left ear',
  },

  results: {
    title: 'Your Results',
    audiogram: 'Audiogram',
    summary: 'Summary',
    thresholds: 'Hearing Thresholds',
    
    pta: {
      title: 'Pure Tone Average (PTA)',
      description: 'Average threshold at speech frequencies (500, 1000, 2000 Hz)',
    },
    
    classification: {
      normal: 'Normal',
      slight: 'Slight loss',
      mild: 'Mild loss',
      moderate: 'Moderate loss',
      moderatelySevere: 'Moderately severe',
      severe: 'Severe loss',
      profound: 'Profound loss',
    },
    
    export: 'Export PDF',
    newTest: 'Take New Test',
    backHome: 'Back to Home',
  },

  comparison: {
    title: 'Compare Tests',
    selectProfiles: 'Select profiles to compare (2-5)',
    compare: 'Compare Selected',
    ptaChange: 'PTA Change',
    noChange: 'No change',
    improvement: 'Improvement',
    decline: 'Decline',
  },

  tinnitus: {
    title: 'Tinnitus Frequency Matcher',
    description: 'Adjust the tone to match the pitch of your tinnitus. This can help you describe your tinnitus to healthcare providers.',
    frequency: 'Frequency',
    volume: 'Volume',
    fineMode: 'Fine-tuning mode',
    fineModeHint: 'Smaller frequency steps for precise matching',
    play: 'Play Tone',
    stop: 'Stop',
    disclaimer: 'This tool is for informational purposes only. If you experience persistent tinnitus, please consult an audiologist or ENT specialist.',
  },

  speechNoise: {
    title: 'Speech-in-Noise Test',
    description: 'This test measures your ability to understand speech in noisy environments. You will hear words spoken over background noise.',
    instructions: {
      title: 'How it works',
      step1: 'You will hear a word spoken over background noise',
      step2: 'Select the word you heard from the options',
      step3: 'The test adjusts difficulty based on your responses',
      step4: 'Results show your Signal-to-Noise Ratio (SNR-50)',
    },
    start: 'Start Test',
    whatDidYouHear: 'What word did you hear?',
    result: {
      title: 'Your Result',
      snr50: 'SNR-50',
      description: 'This is the signal-to-noise ratio at which you correctly identify 50% of words.',
      interpretation: {
        excellent: 'Excellent - Normal hearing in noise',
        good: 'Good - Slight difficulty in very noisy environments',
        moderate: 'Moderate - May benefit from noise reduction strategies',
        significant: 'Significant - Consider professional hearing evaluation',
      },
    },
  },

  accessibility: {
    skipToContent: 'Skip to main content',
    loading: 'Loading',
    playingTone: 'Playing test tone',
    toneComplete: 'Tone complete',
  },
};


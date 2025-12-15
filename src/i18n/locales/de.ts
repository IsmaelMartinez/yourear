/**
 * German translations
 */

import { TranslationDict } from '../index';

export const de: TranslationDict = {
  common: {
    appName: 'YourEar',
    tagline: 'Entdecken Sie Ihre Hörfähigkeiten',
    back: 'Zurück',
    next: 'Weiter',
    start: 'Starten',
    done: 'Fertig',
    skip: 'Überspringen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    reset: 'Zurücksetzen',
    tryAgain: 'Erneut versuchen',
    checkAgain: 'Erneut prüfen',
    viewDetails: 'Details anzeigen',
    years: 'Jahre',
    minutes: 'Min',
    frequencies: 'Frequenzen',
  },

  home: {
    title: 'YourEar',
    subtitle: 'Entdecken Sie Ihre Hörfähigkeiten',
    
    assessment: {
      title: 'Hörbewertung',
      description: 'Testen Sie Ihr Gehör bei verschiedenen Frequenzen, um ein persönliches Audiogramm zu erstellen.',
      
      beforeYouBegin: 'Bevor Sie beginnen',
      instructions: {
        headphones: 'Verwenden Sie Kopfhörer für genaue Ergebnisse',
        quiet: 'Finden Sie eine ruhige Umgebung',
        volume: 'Stellen Sie die Gerätelautstärke auf etwa 50%',
        time: 'Der Test dauert etwa 5-10 Minuten',
      },
      
      fullTest: 'Vollständiger Test',
      fullTestDesc: '6 Frequenzen · ~8 Min',
      quickTest: 'Schnelltest',
      quickTestDesc: '3 Frequenzen · ~2 Min',
      detailedTest: 'Detaillierter Test',
      detailedTestDesc: '11 Frequenzen inkl. Inter-Oktave · ~15 Min',
    },
    
    disclaimer: {
      title: 'Medizinischer Hinweis:',
      text: 'Dies ist ein Selbstbewertungstool nur für Neugier und allgemeines Bewusstsein. Es ist KEINE medizinische Diagnose. Konsultieren Sie immer einen qualifizierten Audiologen für eine professionelle Hörbewertung.',
    },
    
    latestResult: {
      title: 'Ihr Letztes Ergebnis',
      testedOn: 'Getestet am',
    },
    
    history: {
      title: 'Testverlauf',
      compare: 'Tests im Zeitverlauf Vergleichen',
    },
    
    tools: {
      title: 'Weitere Werkzeuge',
      speechNoise: 'Sprache-im-Rauschen Test',
      speechNoiseDesc: 'Hören in lauten Umgebungen testen · ~4 Min',
      tinnitus: 'Tinnitus-Frequenz-Matcher',
      tinnitusDesc: 'Identifizieren Sie Ihre Tinnitus-Frequenz',
    },
    
    about: {
      title: 'Über die Technologie',
      description: 'YourEar verwendet die Web Audio API, um präzise Sinustöne über die audiometrischen Standardfrequenzen (250 Hz bis 8000 Hz) zu erzeugen. Der Test folgt einem vereinfachten Hughson-Westlake-Verfahren, um Ihre Hörschwellen zu finden.',
      limitations: 'Hinweis: Aufgrund von Hardware-Einschränkungen von Verbrauchergeräten kann dieses Tool keine Ultraschallfrequenzen (>20 kHz) wie bei Fledermäusen oder Infraschallfrequenzen (<20 Hz) wie bei Elefanten testen. Das würde spezialisierte Mikrofone und Lautsprecher erfordern!',
    },
    
    footer: {
      openSource: 'Open-Source-Projekt',
    },
  },

  calibration: {
    setup: 'Einrichtung',
    
    age: {
      title: 'Ihr Alter',
      description: 'Geben Sie Ihr Alter ein, um Ihre Ergebnisse mit den erwarteten Werten für Ihre Altersgruppe zu vergleichen.',
      placeholder: 'Alter',
    },
    
    noiseCheck: {
      title: 'Raumgeräusch Prüfen',
      description: 'Für genaue Ergebnisse testen Sie in einer ruhigen Umgebung. Wir können den Geräuschpegel Ihres Raumes überprüfen.',
      checkButton: 'Geräuschpegel Prüfen',
      skipButton: 'Diese Prüfung überspringen',
      micPermission: 'Erfordert Mikrofonberechtigung (optional)',
      listening: 'Raumgeräusche werden erfasst...',
      stayQuiet: 'Bitte bleiben Sie einen Moment still',
      skipped: 'Geräuschprüfung übersprungen',
      checkAnyway: 'Trotzdem prüfen',
      levels: {
        veryQuiet: 'Sehr Ruhig',
        quiet: 'Ruhig',
        moderate: 'Mäßiger Lärm',
        loud: 'Laut',
        veryLoud: 'Sehr Laut',
      },
      recommendations: {
        excellent: 'Ausgezeichnet! Ihre Umgebung ist sehr ruhig - ideal für den Test.',
        good: 'Gut. Ihre Umgebung ist akzeptabel ruhig für den Test.',
        warning: 'Ihre Umgebung hat einige Hintergrundgeräusche. Die Ergebnisse können leicht beeinträchtigt sein. Erwägen Sie, wenn möglich einen ruhigeren Raum zu finden.',
        loud: 'Ihre Umgebung ist ziemlich laut. Wir empfehlen, einen ruhigeren Raum für genauere Ergebnisse zu finden.',
        veryLoud: 'Ihre Umgebung ist sehr laut. Testen wird nicht empfohlen. Bitte finden Sie einen ruhigeren Ort.',
      },
    },
    
    volumeCalibration: {
      title: 'Lautstärke-Kalibrierung',
      description: 'Verbessern Sie die Genauigkeit durch Kalibrierung auf die Lautstärke Ihres Geräts.',
      calibrateButton: 'Lautstärke Kalibrieren',
      skipButton: 'Kalibrierung überspringen',
      optional: 'Dauert etwa 30 Sekunden (optional aber empfohlen)',
      instructions: 'Anleitung: Spielen Sie den 1000-Hz-Ton ab und passen Sie ihn an, bis er wie normale Gesprächslautstärke klingt (als würde jemand auf Armlänge sprechen).',
      playTone: 'Ton Abspielen',
      pause: 'Pause',
      quieter: 'Leiser',
      louder: 'Lauter',
      calibrated: 'Kalibriert',
      skipped: 'Übersprungen',
      recalibrate: 'Neu kalibrieren',
      calibrateNow: 'Jetzt kalibrieren',
      notCalibrated: 'Nicht kalibriert - Standardeinstellungen werden verwendet',
      closeToAverage: 'Kalibriert - Ihr System liegt nahe am Durchschnitt',
      systemOffset: 'Kalibriert - Ihr System ist {{offset}} dB {{direction}} als der Durchschnitt',
    },
    
    headphones: {
      title: 'Testen Sie Ihre Kopfhörer',
      description: 'Klicken Sie auf jede Taste, um einen Testton abzuspielen. Passen Sie die Lautstärke an, bis sie angenehm ist.',
      rightEar: 'Rechtes Ohr',
      leftEar: 'Linkes Ohr',
      tip: 'Stellen Sie sicher, dass beide Ohren die Testtöne hören können!',
    },
    
    beginTest: 'Ich bin bereit - Test Starten',
  },

  test: {
    title: 'Hörtest',
    listening: 'Höre...',
    listeningHint: 'Ein Ton wird abgespielt. Hören Sie aufmerksam zu.',
    didYouHear: 'Haben Sie den Ton gehört?',
    heardIt: 'Ja, ich habe ihn gehört',
    didNotHear: 'Nein, ich habe ihn nicht gehört',
    keyboardHint: 'Tastatur: Leertaste/Enter für gehört, N/Escape für nicht gehört',
    progress: 'Fortschritt',
    frequency: 'Frequenz',
    ear: 'Ohr',
    right: 'Rechts',
    left: 'Links',
    level: 'Pegel',
    testingRightEar: 'Rechtes Ohr wird getestet',
    testingLeftEar: 'Linkes Ohr wird getestet',
  },

  results: {
    title: 'Ihre Ergebnisse',
    audiogram: 'Audiogramm',
    summary: 'Zusammenfassung',
    thresholds: 'Hörschwellen',
    
    pta: {
      title: 'Reinton-Durchschnitt (PTA)',
      description: 'Durchschnittliche Schwelle bei Sprachfrequenzen (500, 1000, 2000 Hz)',
    },
    
    classification: {
      normal: 'Normal',
      slight: 'Geringfügiger Verlust',
      mild: 'Leichter Verlust',
      moderate: 'Mäßiger Verlust',
      moderatelySevere: 'Mittelgradig schwer',
      severe: 'Schwerer Verlust',
      profound: 'Hochgradiger Verlust',
    },
    
    export: 'PDF Exportieren',
    newTest: 'Neuer Test',
    backHome: 'Zurück zur Startseite',
  },

  comparison: {
    title: 'Tests Vergleichen',
    selectProfiles: 'Profile zum Vergleichen auswählen (2-5)',
    compare: 'Ausgewählte Vergleichen',
    ptaChange: 'PTA-Änderung',
    noChange: 'Keine Änderung',
    improvement: 'Verbesserung',
    decline: 'Verschlechterung',
  },

  tinnitus: {
    title: 'Tinnitus-Frequenz-Matcher',
    description: 'Passen Sie den Ton an die Tonhöhe Ihres Tinnitus an. Dies kann Ihnen helfen, Ihren Tinnitus Gesundheitsdienstleistern zu beschreiben.',
    frequency: 'Frequenz',
    volume: 'Lautstärke',
    fineMode: 'Feinabstimmungsmodus',
    fineModeHint: 'Kleinere Frequenzschritte für präzise Anpassung',
    play: 'Ton Abspielen',
    stop: 'Stopp',
    disclaimer: 'Dieses Tool dient nur zu Informationszwecken. Wenn Sie anhaltenden Tinnitus haben, konsultieren Sie bitte einen Audiologen oder HNO-Spezialisten.',
  },

  speechNoise: {
    title: 'Sprache-im-Rauschen Test',
    description: 'Dieser Test misst Ihre Fähigkeit, Sprache in lauten Umgebungen zu verstehen. Sie werden Wörter über Hintergrundgeräuschen hören.',
    instructions: {
      title: 'So funktioniert es',
      step1: 'Sie hören ein Wort über Hintergrundgeräuschen',
      step2: 'Wählen Sie das Wort aus den Optionen, das Sie gehört haben',
      step3: 'Der Test passt die Schwierigkeit basierend auf Ihren Antworten an',
      step4: 'Die Ergebnisse zeigen Ihr Signal-Rausch-Verhältnis (SNR-50)',
    },
    start: 'Test Starten',
    whatDidYouHear: 'Welches Wort haben Sie gehört?',
    result: {
      title: 'Ihr Ergebnis',
      snr50: 'SNR-50',
      description: 'Dies ist das Signal-Rausch-Verhältnis, bei dem Sie 50% der Wörter korrekt identifizieren.',
      interpretation: {
        excellent: 'Ausgezeichnet - Normales Hören im Lärm',
        good: 'Gut - Leichte Schwierigkeiten in sehr lauten Umgebungen',
        moderate: 'Mäßig - Kann von Lärmreduzierungsstrategien profitieren',
        significant: 'Erheblich - Erwägen Sie eine professionelle Hörbewertung',
      },
    },
  },

  accessibility: {
    skipToContent: 'Zum Hauptinhalt springen',
    loading: 'Wird geladen',
    playingTone: 'Testton wird abgespielt',
    toneComplete: 'Ton abgeschlossen',
  },
};


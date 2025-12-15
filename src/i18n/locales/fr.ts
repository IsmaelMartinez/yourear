/**
 * French translations
 */

import { TranslationDict } from '../index';

export const fr: TranslationDict = {
  common: {
    appName: 'YourEar',
    tagline: 'Découvrez vos capacités auditives',
    back: 'Retour',
    next: 'Suivant',
    start: 'Démarrer',
    done: 'Terminé',
    skip: 'Passer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    reset: 'Réinitialiser',
    tryAgain: 'Réessayer',
    checkAgain: 'Vérifier à nouveau',
    viewDetails: 'Voir les détails',
    years: 'ans',
    minutes: 'min',
    frequencies: 'fréquences',
  },

  home: {
    title: 'YourEar',
    subtitle: 'Découvrez vos capacités auditives',
    
    assessment: {
      title: 'Évaluation Auditive',
      description: 'Testez votre audition sur différentes fréquences pour créer un audiogramme personnel.',
      
      beforeYouBegin: 'Avant de commencer',
      instructions: {
        headphones: 'Utilisez des écouteurs pour des résultats précis',
        quiet: 'Trouvez un environnement calme',
        volume: 'Réglez le volume de votre appareil à environ 50%',
        time: 'Le test dure environ 5-10 minutes',
      },
      
      fullTest: 'Test Complet',
      fullTestDesc: '6 fréquences · ~8 min',
      quickTest: 'Test Rapide',
      quickTestDesc: '3 fréquences · ~2 min',
      detailedTest: 'Test Détaillé',
      detailedTestDesc: '11 fréquences incl. inter-octave · ~15 min',
    },
    
    disclaimer: {
      title: 'Avertissement Médical :',
      text: 'Ceci est un outil d\'auto-évaluation uniquement pour la curiosité et la sensibilisation générale. Ce n\'est PAS un diagnostic médical. Consultez toujours un audiologiste qualifié pour une évaluation auditive professionnelle.',
    },
    
    latestResult: {
      title: 'Votre Dernier Résultat',
      testedOn: 'Testé le',
    },
    
    history: {
      title: 'Historique des Tests',
      compare: 'Comparer les Tests dans le Temps',
    },
    
    tools: {
      title: 'Autres Outils',
      speechNoise: 'Test de Parole dans le Bruit',
      speechNoiseDesc: 'Testez l\'audition dans des environnements bruyants · ~4 min',
      tinnitus: 'Identificateur de Fréquence d\'Acouphène',
      tinnitusDesc: 'Identifiez la fréquence de vos acouphènes',
    },
    
    about: {
      title: 'À Propos de la Technologie',
      description: 'YourEar utilise l\'API Web Audio pour générer des tons purs précis sur les fréquences audiométriques standard (250 Hz à 8000 Hz). Le test suit une procédure simplifiée de Hughson-Westlake pour trouver vos seuils auditifs.',
      limitations: 'Note : En raison des limitations matérielles des appareils grand public, cet outil ne peut pas tester les fréquences ultrasoniques (>20 kHz) utilisées par les chauves-souris ni les fréquences infrasoniques (<20 Hz) utilisées par les éléphants. Cela nécessiterait des microphones et haut-parleurs spécialisés !',
    },
    
    footer: {
      openSource: 'Projet open source',
    },
  },

  calibration: {
    setup: 'Configuration',
    
    age: {
      title: 'Votre Âge',
      description: 'Entrez votre âge pour comparer vos résultats avec les valeurs attendues pour votre groupe d\'âge.',
      placeholder: 'Âge',
    },
    
    noiseCheck: {
      title: 'Vérifier le Bruit Ambiant',
      description: 'Pour des résultats précis, testez dans un environnement calme. Nous pouvons vérifier le niveau de bruit de votre pièce.',
      checkButton: 'Vérifier le Niveau de Bruit',
      skipButton: 'Passer cette vérification',
      micPermission: 'Nécessite l\'autorisation du microphone (optionnel)',
      listening: 'Écoute du bruit ambiant...',
      stayQuiet: 'Veuillez rester silencieux un moment',
      skipped: 'Vérification du bruit passée',
      checkAnyway: 'Vérifier quand même',
      levels: {
        veryQuiet: 'Très Calme',
        quiet: 'Calme',
        moderate: 'Bruit Modéré',
        loud: 'Bruyant',
        veryLoud: 'Très Bruyant',
      },
      recommendations: {
        excellent: 'Excellent ! Votre environnement est très calme - idéal pour le test.',
        good: 'Bon. Votre environnement est suffisamment calme pour le test.',
        warning: 'Votre environnement a un certain bruit de fond. Les résultats peuvent être légèrement affectés. Envisagez de trouver un espace plus calme si possible.',
        loud: 'Votre environnement est assez bruyant. Nous recommandons de trouver un espace plus calme pour des résultats plus précis.',
        veryLoud: 'Votre environnement est très bruyant. Le test n\'est pas recommandé. Veuillez trouver un endroit plus calme.',
      },
    },
    
    volumeCalibration: {
      title: 'Calibration du Volume',
      description: 'Améliorez la précision en calibrant au niveau de volume de votre appareil.',
      calibrateButton: 'Calibrer le Volume',
      skipButton: 'Passer la calibration',
      optional: 'Prend environ 30 secondes (optionnel mais recommandé)',
      instructions: 'Instructions : Jouez le ton de 1000 Hz et ajustez jusqu\'à ce qu\'il ressemble au volume d\'une conversation normale (comme si quelqu\'un parlait à bout de bras).',
      playTone: 'Jouer le Ton',
      pause: 'Pause',
      quieter: 'Plus bas',
      louder: 'Plus fort',
      calibrated: 'Calibré',
      skipped: 'Passé',
      recalibrate: 'Recalibrer',
      calibrateNow: 'Calibrer maintenant',
      notCalibrated: 'Non calibré - utilisation des paramètres par défaut',
      closeToAverage: 'Calibré - votre système est proche de la moyenne',
      systemOffset: 'Calibré - votre système est {{offset}} dB {{direction}} que la moyenne',
    },
    
    headphones: {
      title: 'Testez vos Écouteurs',
      description: 'Cliquez sur chaque bouton pour jouer un ton de test. Ajustez le volume jusqu\'à ce qu\'il soit confortable.',
      rightEar: 'Oreille Droite',
      leftEar: 'Oreille Gauche',
      tip: 'Assurez-vous que les deux oreilles peuvent entendre les tons de test !',
    },
    
    beginTest: 'Je suis prêt - Commencer le Test',
  },

  test: {
    title: 'Test Auditif',
    listening: 'Écoute...',
    listeningHint: 'Un ton va jouer. Écoutez attentivement.',
    didYouHear: 'Avez-vous entendu le ton ?',
    heardIt: 'Oui, je l\'ai entendu',
    didNotHear: 'Non, je ne l\'ai pas entendu',
    keyboardHint: 'Clavier : Espace/Entrée pour entendu, N/Échap pour non entendu',
    progress: 'Progression',
    frequency: 'Fréquence',
    ear: 'Oreille',
    right: 'Droite',
    left: 'Gauche',
    level: 'Niveau',
    testingRightEar: 'Test de l\'oreille droite',
    testingLeftEar: 'Test de l\'oreille gauche',
  },

  results: {
    title: 'Vos Résultats',
    audiogram: 'Audiogramme',
    summary: 'Résumé',
    thresholds: 'Seuils Auditifs',
    
    pta: {
      title: 'Moyenne des Tons Purs (PTA)',
      description: 'Seuil moyen aux fréquences de la parole (500, 1000, 2000 Hz)',
    },
    
    classification: {
      normal: 'Normal',
      slight: 'Perte légère',
      mild: 'Perte légère',
      moderate: 'Perte modérée',
      moderatelySevere: 'Modérément sévère',
      severe: 'Perte sévère',
      profound: 'Perte profonde',
    },
    
    export: 'Exporter PDF',
    newTest: 'Nouveau Test',
    backHome: 'Retour à l\'Accueil',
  },

  comparison: {
    title: 'Comparer les Tests',
    selectProfiles: 'Sélectionnez les profils à comparer (2-5)',
    compare: 'Comparer la Sélection',
    ptaChange: 'Changement PTA',
    noChange: 'Pas de changement',
    improvement: 'Amélioration',
    decline: 'Déclin',
  },

  tinnitus: {
    title: 'Identificateur de Fréquence d\'Acouphène',
    description: 'Ajustez le ton pour correspondre à la hauteur de vos acouphènes. Cela peut vous aider à décrire vos acouphènes aux professionnels de santé.',
    frequency: 'Fréquence',
    volume: 'Volume',
    fineMode: 'Mode de réglage fin',
    fineModeHint: 'Pas de fréquence plus petits pour une correspondance précise',
    play: 'Jouer le Ton',
    stop: 'Arrêter',
    disclaimer: 'Cet outil est uniquement à des fins informatives. Si vous souffrez d\'acouphènes persistants, consultez un audiologiste ou un spécialiste ORL.',
  },

  speechNoise: {
    title: 'Test de Parole dans le Bruit',
    description: 'Ce test mesure votre capacité à comprendre la parole dans des environnements bruyants. Vous entendrez des mots prononcés sur un bruit de fond.',
    instructions: {
      title: 'Comment ça marche',
      step1: 'Vous entendrez un mot prononcé sur un bruit de fond',
      step2: 'Sélectionnez le mot que vous avez entendu parmi les options',
      step3: 'Le test ajuste la difficulté en fonction de vos réponses',
      step4: 'Les résultats montrent votre Rapport Signal-Bruit (SNR-50)',
    },
    start: 'Démarrer le Test',
    whatDidYouHear: 'Quel mot avez-vous entendu ?',
    result: {
      title: 'Votre Résultat',
      snr50: 'SNR-50',
      description: 'C\'est le rapport signal-bruit auquel vous identifiez correctement 50% des mots.',
      interpretation: {
        excellent: 'Excellent - Audition normale dans le bruit',
        good: 'Bon - Légère difficulté dans les environnements très bruyants',
        moderate: 'Modéré - Peut bénéficier de stratégies de réduction du bruit',
        significant: 'Significatif - Envisagez une évaluation auditive professionnelle',
      },
    },
  },

  accessibility: {
    skipToContent: 'Aller au contenu principal',
    loading: 'Chargement',
    playingTone: 'Lecture du ton de test',
    toneComplete: 'Ton terminé',
  },
};


/**
 * Spanish translations
 */

import { TranslationDict } from '../index';

export const es: TranslationDict = {
  common: {
    appName: 'YourEar',
    tagline: 'Descubre tus capacidades auditivas',
    back: 'Atrás',
    next: 'Siguiente',
    start: 'Iniciar',
    done: 'Listo',
    skip: 'Omitir',
    cancel: 'Cancelar',
    save: 'Guardar',
    reset: 'Reiniciar',
    tryAgain: 'Intentar de nuevo',
    checkAgain: 'Verificar de nuevo',
    viewDetails: 'Ver detalles',
    years: 'años',
    minutes: 'min',
    frequencies: 'frecuencias',
  },

  home: {
    title: 'YourEar',
    subtitle: 'Descubre tus capacidades auditivas',
    
    assessment: {
      title: 'Evaluación Auditiva',
      description: 'Prueba tu audición en diferentes frecuencias para crear un audiograma personal.',
      
      beforeYouBegin: 'Antes de comenzar',
      instructions: {
        headphones: 'Usa auriculares para resultados precisos',
        quiet: 'Encuentra un ambiente silencioso',
        volume: 'Ajusta el volumen del dispositivo al 50%',
        time: 'La prueba dura aproximadamente 5-10 minutos',
      },
      
      fullTest: 'Prueba Completa',
      fullTestDesc: '6 frecuencias · ~8 min',
      quickTest: 'Prueba Rápida',
      quickTestDesc: '3 frecuencias · ~2 min',
      detailedTest: 'Prueba Detallada',
      detailedTestDesc: '11 frecuencias incl. inter-octava · ~15 min',
    },
    
    disclaimer: {
      title: 'Aviso Médico:',
      text: 'Esta es una herramienta de autoevaluación solo para curiosidad y conocimiento general. NO es un diagnóstico médico. Siempre consulta a un audiólogo calificado para una evaluación auditiva profesional.',
    },
    
    latestResult: {
      title: 'Tu Último Resultado',
      testedOn: 'Realizado el',
    },
    
    history: {
      title: 'Historial de Pruebas',
      compare: 'Comparar Pruebas en el Tiempo',
    },
    
    tools: {
      title: 'Otras Herramientas',
      speechNoise: 'Prueba de Habla en Ruido',
      speechNoiseDesc: 'Evalúa la audición en ambientes ruidosos · ~4 min',
      tinnitus: 'Identificador de Frecuencia de Tinnitus',
      tinnitusDesc: 'Identifica la frecuencia de tu tinnitus',
    },
    
    about: {
      title: 'Sobre la Tecnología',
      description: 'YourEar usa la API Web Audio para generar tonos puros precisos en las frecuencias audiométricas estándar (250 Hz a 8000 Hz). La prueba sigue un procedimiento simplificado de Hughson-Westlake para encontrar tus umbrales auditivos.',
      limitations: 'Nota: Debido a limitaciones del hardware de dispositivos de consumo, esta herramienta no puede probar frecuencias ultrasónicas (>20 kHz) usadas por murciélagos ni frecuencias infrasónicas (<20 Hz) usadas por elefantes. ¡Eso requeriría micrófonos y altavoces especializados!',
    },
    
    footer: {
      openSource: 'Proyecto de código abierto',
    },
  },

  calibration: {
    setup: 'Configuración',
    
    age: {
      title: 'Tu Edad',
      description: 'Ingresa tu edad para comparar tus resultados con los valores esperados para tu grupo de edad.',
      placeholder: 'Edad',
    },
    
    noiseCheck: {
      title: 'Verificar Ruido Ambiental',
      description: 'Para resultados precisos, realiza la prueba en un ambiente silencioso. Podemos verificar el nivel de ruido de tu habitación.',
      checkButton: 'Verificar Nivel de Ruido',
      skipButton: 'Omitir esta verificación',
      micPermission: 'Requiere permiso de micrófono (opcional)',
      listening: 'Escuchando el ruido ambiental...',
      stayQuiet: 'Por favor, mantén silencio un momento',
      skipped: 'Verificación de ruido omitida',
      checkAnyway: 'Verificar de todos modos',
      levels: {
        veryQuiet: 'Muy Silencioso',
        quiet: 'Silencioso',
        moderate: 'Ruido Moderado',
        loud: 'Ruidoso',
        veryLoud: 'Muy Ruidoso',
      },
      recommendations: {
        excellent: '¡Excelente! Tu ambiente está muy silencioso - ideal para la prueba.',
        good: 'Bien. Tu ambiente es aceptablemente silencioso para la prueba.',
        warning: 'Tu ambiente tiene algo de ruido de fondo. Los resultados pueden verse ligeramente afectados. Considera encontrar un espacio más silencioso si es posible.',
        loud: 'Tu ambiente es bastante ruidoso. Recomendamos encontrar un espacio más silencioso para resultados más precisos.',
        veryLoud: 'Tu ambiente es muy ruidoso. No se recomienda realizar la prueba. Por favor, encuentra un lugar más silencioso.',
      },
    },
    
    volumeCalibration: {
      title: 'Calibración de Volumen',
      description: 'Mejora la precisión calibrando al nivel de volumen de tu dispositivo.',
      calibrateButton: 'Calibrar Volumen',
      skipButton: 'Omitir calibración',
      optional: 'Toma unos 30 segundos (opcional pero recomendado)',
      instructions: 'Instrucciones: Reproduce el tono de 1000 Hz y ajústalo hasta que suene como el volumen de una conversación normal (como si alguien hablara a un brazo de distancia).',
      playTone: 'Reproducir Tono',
      pause: 'Pausar',
      quieter: 'Más bajo',
      louder: 'Más alto',
      calibrated: 'Calibrado',
      skipped: 'Omitido',
      recalibrate: 'Recalibrar',
      calibrateNow: 'Calibrar ahora',
      notCalibrated: 'No calibrado - usando configuración predeterminada',
      closeToAverage: 'Calibrado - tu sistema está cerca del promedio',
      systemOffset: 'Calibrado - tu sistema es {{offset}} dB {{direction}} que el promedio',
    },
    
    headphones: {
      title: 'Prueba tus Auriculares',
      description: 'Haz clic en cada botón para reproducir un tono de prueba. Ajusta el volumen hasta que sea cómodo.',
      rightEar: 'Oído Derecho',
      leftEar: 'Oído Izquierdo',
      tip: '¡Asegúrate de que ambos oídos puedan escuchar los tonos de prueba!',
    },
    
    beginTest: 'Estoy listo - Comenzar Prueba',
  },

  test: {
    title: 'Prueba Auditiva',
    listening: 'Escuchando...',
    listeningHint: 'Se reproducirá un tono. Escucha con atención.',
    didYouHear: '¿Escuchaste el tono?',
    heardIt: 'Sí, lo escuché',
    didNotHear: 'No, no lo escuché',
    keyboardHint: 'Teclado: Espacio/Enter para escuchado, N/Escape para no escuchado',
    progress: 'Progreso',
    frequency: 'Frecuencia',
    ear: 'Oído',
    right: 'Derecho',
    left: 'Izquierdo',
    level: 'Nivel',
    testingRightEar: 'Probando oído derecho',
    testingLeftEar: 'Probando oído izquierdo',
  },

  results: {
    title: 'Tus Resultados',
    audiogram: 'Audiograma',
    summary: 'Resumen',
    thresholds: 'Umbrales Auditivos',
    
    pta: {
      title: 'Promedio de Tono Puro (PTA)',
      description: 'Umbral promedio en frecuencias del habla (500, 1000, 2000 Hz)',
    },
    
    classification: {
      normal: 'Normal',
      slight: 'Pérdida leve',
      mild: 'Pérdida ligera',
      moderate: 'Pérdida moderada',
      moderatelySevere: 'Moderadamente severa',
      severe: 'Pérdida severa',
      profound: 'Pérdida profunda',
    },
    
    export: 'Exportar PDF',
    newTest: 'Nueva Prueba',
    backHome: 'Volver al Inicio',
  },

  comparison: {
    title: 'Comparar Pruebas',
    selectProfiles: 'Selecciona perfiles para comparar (2-5)',
    compare: 'Comparar Seleccionados',
    ptaChange: 'Cambio en PTA',
    noChange: 'Sin cambio',
    improvement: 'Mejora',
    decline: 'Deterioro',
  },

  tinnitus: {
    title: 'Identificador de Frecuencia de Tinnitus',
    description: 'Ajusta el tono para que coincida con el tono de tu tinnitus. Esto puede ayudarte a describir tu tinnitus a los profesionales de la salud.',
    frequency: 'Frecuencia',
    volume: 'Volumen',
    fineMode: 'Modo de ajuste fino',
    fineModeHint: 'Pasos de frecuencia más pequeños para coincidencia precisa',
    play: 'Reproducir Tono',
    stop: 'Detener',
    disclaimer: 'Esta herramienta es solo para fines informativos. Si experimentas tinnitus persistente, consulta a un audiólogo o especialista en otorrinolaringología.',
  },

  speechNoise: {
    title: 'Prueba de Habla en Ruido',
    description: 'Esta prueba mide tu capacidad para entender el habla en ambientes ruidosos. Escucharás palabras habladas sobre ruido de fondo.',
    instructions: {
      title: 'Cómo funciona',
      step1: 'Escucharás una palabra hablada sobre ruido de fondo',
      step2: 'Selecciona la palabra que escuchaste de las opciones',
      step3: 'La prueba ajusta la dificultad según tus respuestas',
      step4: 'Los resultados muestran tu Relación Señal-Ruido (SNR-50)',
    },
    start: 'Iniciar Prueba',
    whatDidYouHear: '¿Qué palabra escuchaste?',
    result: {
      title: 'Tu Resultado',
      snr50: 'SNR-50',
      description: 'Esta es la relación señal-ruido en la que identificas correctamente el 50% de las palabras.',
      interpretation: {
        excellent: 'Excelente - Audición normal en ruido',
        good: 'Bueno - Ligera dificultad en ambientes muy ruidosos',
        moderate: 'Moderado - Puede beneficiarse de estrategias de reducción de ruido',
        significant: 'Significativo - Considere una evaluación auditiva profesional',
      },
    },
  },

  accessibility: {
    skipToContent: 'Saltar al contenido principal',
    loading: 'Cargando',
    playingTone: 'Reproduciendo tono de prueba',
    toneComplete: 'Tono completado',
  },
};


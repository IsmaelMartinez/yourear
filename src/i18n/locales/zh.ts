/**
 * Chinese (Simplified) translations
 */

import { TranslationDict } from '../index';

export const zh: TranslationDict = {
  common: {
    appName: 'YourEar',
    tagline: '探索您的听力能力',
    back: '返回',
    next: '下一步',
    start: '开始',
    done: '完成',
    skip: '跳过',
    cancel: '取消',
    save: '保存',
    reset: '重置',
    tryAgain: '重试',
    checkAgain: '再次检查',
    viewDetails: '查看详情',
    years: '岁',
    minutes: '分钟',
    frequencies: '频率',
  },

  home: {
    title: 'YourEar',
    subtitle: '探索您的听力能力',
    
    assessment: {
      title: '听力评估',
      description: '测试您在不同频率的听力，创建个人听力图。',
      
      beforeYouBegin: '开始之前',
      instructions: {
        headphones: '使用耳机以获得准确结果',
        quiet: '找一个安静的环境',
        volume: '将设备音量设置为约50%',
        time: '测试大约需要5-10分钟',
      },
      
      fullTest: '完整测试',
      fullTestDesc: '6个频率 · 约8分钟',
      quickTest: '快速测试',
      quickTestDesc: '3个频率 · 约2分钟',
      detailedTest: '详细测试',
      detailedTestDesc: '11个频率（含八度间频率）· 约15分钟',
    },
    
    disclaimer: {
      title: '医学声明：',
      text: '这是一个仅供好奇和一般了解的自我评估工具。这不是医学诊断。如需专业听力评估，请咨询有资质的听力师。',
    },
    
    latestResult: {
      title: '您的最新结果',
      testedOn: '测试日期',
    },
    
    history: {
      title: '测试历史',
      compare: '对比历史测试',
    },
    
    tools: {
      title: '其他工具',
      speechNoise: '噪声中言语测试',
      speechNoiseDesc: '测试嘈杂环境中的听力 · 约4分钟',
      tinnitus: '耳鸣频率匹配器',
      tinnitusDesc: '识别您的耳鸣频率',
    },
    
    about: {
      title: '关于技术',
      description: 'YourEar使用Web Audio API在标准听力测试频率（250 Hz至8000 Hz）生成精确的纯音。测试采用简化的Hughson-Westlake程序来确定您的听力阈值。',
      limitations: '注意：由于消费设备的硬件限制，此工具无法测试蝙蝠使用的超声波频率（>20 kHz）或大象使用的次声波频率（<20 Hz）。这需要专门的麦克风和扬声器！',
    },
    
    footer: {
      openSource: '开源项目',
    },
  },

  calibration: {
    setup: '设置',
    
    age: {
      title: '您的年龄',
      description: '输入您的年龄，以便与您年龄组的预期值进行比较。',
      placeholder: '年龄',
    },
    
    noiseCheck: {
      title: '检查环境噪音',
      description: '为获得准确结果，请在安静的环境中测试。我们可以检查您房间的噪音水平。',
      checkButton: '检查噪音水平',
      skipButton: '跳过此检查',
      micPermission: '需要麦克风权限（可选）',
      listening: '正在检测环境噪音...',
      stayQuiet: '请保持安静片刻',
      skipped: '已跳过噪音检查',
      checkAnyway: '仍要检查',
      levels: {
        veryQuiet: '非常安静',
        quiet: '安静',
        moderate: '中等噪音',
        loud: '嘈杂',
        veryLoud: '非常嘈杂',
      },
      recommendations: {
        excellent: '太棒了！您的环境非常安静——是测试的理想环境。',
        good: '良好。您的环境足够安静，可以进行测试。',
        warning: '您的环境有一些背景噪音。结果可能会受到轻微影响。如果可能，请考虑找一个更安静的地方。',
        loud: '您的环境相当嘈杂。我们建议找一个更安静的地方以获得更准确的结果。',
        veryLoud: '您的环境非常嘈杂。不建议进行测试。请找一个更安静的地方。',
      },
    },
    
    volumeCalibration: {
      title: '音量校准',
      description: '通过校准设备的音量水平来提高准确性。',
      calibrateButton: '校准音量',
      skipButton: '跳过校准',
      optional: '大约需要30秒（可选但推荐）',
      instructions: '说明：播放1000 Hz音调并调整，直到它听起来像正常对话音量（就像有人在一臂之遥处说话）。',
      playTone: '播放音调',
      pause: '暂停',
      quieter: '调低',
      louder: '调高',
      calibrated: '已校准',
      skipped: '已跳过',
      recalibrate: '重新校准',
      calibrateNow: '立即校准',
      notCalibrated: '未校准——使用默认设置',
      closeToAverage: '已校准——您的系统接近平均水平',
      systemOffset: '已校准——您的系统比平均水平{{direction}} {{offset}} dB',
    },
    
    headphones: {
      title: '测试您的耳机',
      description: '点击每个按钮播放测试音。调整音量直到舒适。',
      rightEar: '右耳',
      leftEar: '左耳',
      tip: '确保双耳都能听到测试音！',
    },
    
    beginTest: '我准备好了——开始测试',
  },

  test: {
    title: '听力测试',
    listening: '正在聆听...',
    listeningHint: '即将播放音调。请仔细聆听。',
    didYouHear: '您听到音调了吗？',
    heardIt: '是的，我听到了',
    didNotHear: '不，我没有听到',
    keyboardHint: '键盘：空格/回车表示听到，N/Esc表示没听到',
    progress: '进度',
    frequency: '频率',
    ear: '耳朵',
    right: '右',
    left: '左',
    level: '音量',
    testingRightEar: '正在测试右耳',
    testingLeftEar: '正在测试左耳',
  },

  results: {
    title: '您的结果',
    audiogram: '听力图',
    summary: '摘要',
    thresholds: '听力阈值',
    
    pta: {
      title: '纯音平均值 (PTA)',
      description: '言语频率（500、1000、2000 Hz）的平均阈值',
    },
    
    classification: {
      normal: '正常',
      slight: '轻微损失',
      mild: '轻度损失',
      moderate: '中度损失',
      moderatelySevere: '中重度损失',
      severe: '重度损失',
      profound: '极重度损失',
    },
    
    export: '导出PDF',
    newTest: '进行新测试',
    backHome: '返回首页',
  },

  comparison: {
    title: '比较测试',
    selectProfiles: '选择要比较的档案（2-5个）',
    compare: '比较所选项',
    ptaChange: 'PTA变化',
    noChange: '无变化',
    improvement: '改善',
    decline: '下降',
  },

  tinnitus: {
    title: '耳鸣频率匹配器',
    description: '调整音调以匹配您耳鸣的音高。这可以帮助您向医疗保健提供者描述您的耳鸣。',
    frequency: '频率',
    volume: '音量',
    fineMode: '微调模式',
    fineModeHint: '更小的频率步进以进行精确匹配',
    play: '播放音调',
    stop: '停止',
    disclaimer: '此工具仅供参考。如果您有持续性耳鸣，请咨询听力师或耳鼻喉科专家。',
  },

  speechNoise: {
    title: '噪声中言语测试',
    description: '此测试测量您在嘈杂环境中理解言语的能力。您将听到在背景噪音中说出的词语。',
    instructions: {
      title: '测试说明',
      step1: '您将听到在背景噪音中说出的一个词',
      step2: '从选项中选择您听到的词',
      step3: '测试根据您的回答调整难度',
      step4: '结果显示您的信噪比（SNR-50）',
    },
    start: '开始测试',
    whatDidYouHear: '您听到了什么词？',
    result: {
      title: '您的结果',
      snr50: 'SNR-50',
      description: '这是您正确识别50%词语时的信噪比。',
      interpretation: {
        excellent: '优秀——噪音中听力正常',
        good: '良好——在非常嘈杂的环境中有轻微困难',
        moderate: '中等——可能受益于降噪策略',
        significant: '显著——建议进行专业听力评估',
      },
    },
  },

  accessibility: {
    skipToContent: '跳至主要内容',
    loading: '加载中',
    playingTone: '正在播放测试音',
    toneComplete: '音调播放完成',
  },
};


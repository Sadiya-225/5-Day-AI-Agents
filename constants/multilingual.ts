// Multilingual support for VAPI Voice Assistant

// Language-specific greetings for medical assistant
export const LANGUAGE_GREETINGS = {
  en: "Hello, I'm {name}, and I specialize in {subject}. Can you please tell me about the symptoms you're experiencing today?",
  hi: "नमस्ते, मैं {name} हूं और मैं {subject} में विशेषज्ञ हूं। क्या आप मुझे उन लक्षणों के बारे में बता सकते हैं जो आप आज अनुभव कर रहे हैं?",
  ta: "வணக்கம், நான் {name}, மற்றும் நான் {subject} பகுதியில் நிபுணர். தயவுசெய்து இன்று நீங்கள் அனுபவிக்கும் அறிகுறிகளைப் பற்றி என்னிடம் சொல்ல முடியுமா?",
  te: "హలో, నేను {name}, మరియు నేను {subject} లో నైపుణ్యం కలిగి ఉన్నాను. దయచేసి మీరు ఈ రోజు అనుభవిస్తున్న లక్షణాల గురించి నాకు చెప్పగలరా?",
  kn: "ನಮಸ್ಕಾರ, ನಾನು {name}, ಮತ್ತು ನಾನು {subject} ನಲ್ಲಿ ಪರಿಣಿತನಾಗಿದ್ದೇನೆ. ದಯವಿಟ್ಟು ನೀವು ಇಂದು ಅನುಭವಿಸುತ್ತಿರುವ ರೋಗಲಕ್ಷಣಗಳ ಬಗ್ಗೆ ನನಗೆ ಹೇಳಬಹುದೇ?",
  ml: "ഹലോ, ഞാൻ {name} ആണ്, ഞാൻ {subject} ൽ വൈദഗ്ദ്ധ്യം നേടിയിട്ടുണ്ട്. ഇന്ന് നിങ്ങൾ അനുഭവിക്കുന്ന ലക്ഷണങ്ങളെക്കുറിച്ച് ദയവായി എന്നോട് പറയാമോ?",
  bn: "হ্যালো, আমি {name}, এবং আমি {subject} বিষয়ে বিশেষজ্ঞ। আপনি আজ যে লক্ষণগুলি অনুভব করছেন সে সম্পর্কে আমাকে বলতে পারবেন?",
  mr: "नमस্कार, मी {name} आहे आणि मी {subject} मध्ये तज्ञ आहे। आज तुम्हाला होत असलेल्या लक्षणांबद्दल मला सांगू शकाल का?",
  gu: "નમસ્તે, હું {name} છું, અને હું {subject} માં નિષ્ણાત છું. તમે આજે જે લક્ષણો અનુભવી રહ્યા છો તે વિશે મને કહી શકો છો?",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ {name} ਹਾਂ, ਅਤੇ ਮੈਂ {subject} ਵਿੱਚ ਮਾਹਰ ਹਾਂ। ਕੀ ਤੁਸੀਂ ਮੈਨੂੰ ਅੱਜ ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਬਾਰੇ ਦੱਸ ਸਕਦੇ ਹੋ?",
};

// System prompt templates for each language
export const LANGUAGE_SYSTEM_PROMPTS = {
  en: {
    languageInstruction: "You can communicate in English. Respond naturally in English.",
    conversationStyle: "Maintain a professional yet warm conversational tone.",
  },
  hi: {
    languageInstruction: "आप हिंदी में संवाद कर सकते हैं। स्वाभाविक रूप से हिंदी में जवाब दें।",
    conversationStyle: "एक पेशेवर फिर भी गर्म बातचीत का स्वर बनाए रखें।",
  },
  ta: {
    languageInstruction: "நீங்கள் தமிழில் தொடர்பு கொள்ளலாம். இயற்கையாக தமிழில் பதிலளிக்கவும்.",
    conversationStyle: "தொழில்முறை ஆனால் அன்பான உரையாடல் தொனியை பராமரிக்கவும்.",
  },
  te: {
    languageInstruction: "మీరు తెలుగులో సంభాషించవచ్చు। సహజంగా తెలుగులో ప్రతిస్పందించండి.",
    conversationStyle: "వృత్తిపరమైన ఇంకా వెచ్చని సంభాషణ స్వరాన్ని కొనసాగించండి.",
  },
  kn: {
    languageInstruction: "ನೀವು ಕನ್ನಡದಲ್ಲಿ ಸಂವಹನ ಮಾಡಬಹುದು। ಸ್ವಾಭಾವಿಕವಾಗಿ ಕನ್ನಡದಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯಿಸಿ.",
    conversationStyle: "ವೃತ್ತಿಪರ ಆದರೆ ಬೆಚ್ಚಗಿನ ಸಂವಾದ ಧ್ವನಿಯನ್ನು ನಿರ್ವಹಿಸಿ.",
  },
  ml: {
    languageInstruction: "നിങ്ങൾക്ക് മലയാളത്തിൽ ആശയവിനിമയം നടത്താം। സ്വാഭാവികമായി മലയാളത്തിൽ പ്രതികരിക്കുക.",
    conversationStyle: "പ്രൊഫഷണൽ എന്നാൽ ഊഷ്മളമായ സംഭാഷണ സ്വരം നിലനിർത്തുക.",
  },
  bn: {
    languageInstruction: "আপনি বাংলায় যোগাযোগ করতে পারেন। স্বাভাবিকভাবে বাংলায় সাড়া দিন।",
    conversationStyle: "একটি পেশাদার কিন্তু উষ্ণ কথোপকথন টোন বজায় রাখুন।",
  },
  mr: {
    languageInstruction: "तुम्ही मराठीत संवाद साधू शकता. नैसर्गिकरित्या मराठीत प्रतिसाद द्या.",
    conversationStyle: "व्यावसायिक परंतु उबदार संभाषण टोन राखा.",
  },
  gu: {
    languageInstruction: "તમે ગુજરાતીમાં વાતચીત કરી શકો છો. સ્વાભાવિક રીતે ગુજરાતીમાં જવાબ આપો.",
    conversationStyle: "વ્યાવસાયિક છતાં ગરમ વાર્તાલાપ સ્વર જાળવો.",
  },
  pa: {
    languageInstruction: "ਤੁਸੀਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲਬਾਤ ਕਰ ਸਕਦੇ ਹੋ। ਕੁਦਰਤੀ ਤੌਰ 'ਤੇ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ।",
    conversationStyle: "ਇੱਕ ਪੇਸ਼ੇਵਰ ਪਰ ਨਿੱਘਾ ਗੱਲਬਾਤ ਟੋਨ ਬਣਾਈ ਰੱਖੋ।",
  },
};

// Azure TTS voice IDs for Indian languages (Neural voices)
// These are high-quality neural voices from Azure
export const AZURE_MULTILINGUAL_VOICES = {
  en: {
    empathetic: "en-IN-NeerjaNeural", // Indian English female voice
    professional: "en-IN-PrabhatNeural", // Indian English male voice
  },
  hi: {
    empathetic: "hi-IN-SwaraNeural", // Hindi female voice
    professional: "hi-IN-MadhurNeural", // Hindi male voice
  },
  ta: {
    empathetic: "ta-IN-PallaviNeural", // Tamil female voice
    professional: "ta-IN-ValluvarNeural", // Tamil male voice
  },
  te: {
    empathetic: "te-IN-ShrutiNeural", // Telugu female voice
    professional: "te-IN-MohanNeural", // Telugu male voice
  },
  kn: {
    empathetic: "kn-IN-SapnaNeural", // Kannada female voice
    professional: "kn-IN-GaganNeural", // Kannada male voice
  },
  ml: {
    empathetic: "ml-IN-SobhanaNeural", // Malayalam female voice
    professional: "ml-IN-MidhunNeural", // Malayalam male voice
  },
  bn: {
    empathetic: "bn-IN-TanishaaNeural", // Bengali female voice
    professional: "bn-IN-BashkarNeural", // Bengali male voice
  },
  mr: {
    empathetic: "mr-IN-AarohiNeural", // Marathi female voice
    professional: "mr-IN-ManoharNeural", // Marathi male voice
  },
  gu: {
    empathetic: "gu-IN-DhwaniNeural", // Gujarati female voice
    professional: "gu-IN-NiranjanNeural", // Gujarati male voice
  },
  pa: {
    // Using Hindi voices as fallback for Punjabi (Azure doesn't have native Punjabi)
    empathetic: "hi-IN-SwaraNeural",
    professional: "hi-IN-MadhurNeural",
  },
};

// Language display names
export const LANGUAGE_NAMES = {
  en: "English",
  hi: "हिंदी (Hindi)",
  ta: "தமிழ் (Tamil)",
  te: "తెలుగు (Telugu)",
  kn: "ಕನ್ನಡ (Kannada)",
  ml: "മലയാളം (Malayalam)",
  bn: "বাংলা (Bengali)",
  mr: "मराठी (Marathi)",
  gu: "ગુજરાતી (Gujarati)",
  pa: "ਪੰਜਾਬੀ (Punjabi)",
};

// Helper function to get greeting with name and subject placeholders replaced
export function getLocalizedGreeting(
  languageCode: string,
  name: string,
  subject: string
): string {
  const template = LANGUAGE_GREETINGS[languageCode as keyof typeof LANGUAGE_GREETINGS] || LANGUAGE_GREETINGS.en;
  return template.replace("{name}", name).replace("{subject}", subject);
}

// Helper function to get voice ID for language and style
export function getVoiceForLanguage(
  languageCode: string,
  style: string = "empathetic"
): string {
  const voices = AZURE_MULTILINGUAL_VOICES[languageCode as keyof typeof AZURE_MULTILINGUAL_VOICES];
  if (!voices) return AZURE_MULTILINGUAL_VOICES.en.empathetic;

  return style === "professional" ? voices.professional : voices.empathetic;
}

// Map our language codes to Deepgram's supported language codes
// Deepgram only natively supports: en-IN, hi, ta, kn for Indian languages
export function getDeepgramLanguageCode(languageCode: string): "en-IN" | "hi" | "ta" | "kn" | "multi" {
  const deepgramMapping: Record<string, "en-IN" | "hi" | "ta" | "kn" | "multi"> = {
    en: "en-IN", // Indian English (natively supported)
    hi: "hi",    // Hindi (natively supported)
    ta: "ta",    // Tamil (natively supported)
    kn: "kn",    // Kannada (natively supported)
    te: "multi", // Telugu (fallback to multi for auto-detection)
    ml: "multi", // Malayalam (fallback to multi for auto-detection)
    bn: "multi", // Bengali (fallback to multi for auto-detection)
    mr: "multi", // Marathi (fallback to multi for auto-detection)
    gu: "multi", // Gujarati (fallback to multi for auto-detection)
    pa: "multi", // Punjabi (fallback to multi for auto-detection)
  };

  return deepgramMapping[languageCode] || "multi";
}

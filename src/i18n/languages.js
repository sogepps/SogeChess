/**
 * Desteklenen diller.
 *
 * `label` her dilin kendi yazımıyla yazılır (endonym): kullanıcı, uygulama
 * anlamadığı bir dilde açıldığında bile kendi dilini listede tanıyabilmeli.
 * `english` yalnızca arama içindir — "Turkish" yazan biri de Türkçe'yi bulsun.
 * `rtl` sağdan sola yazılan dilleri işaretler.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', english: 'English' },
  { code: 'tr', label: 'Türkçe', english: 'Turkish' },
  { code: 'ar', label: 'العربية', english: 'Arabic', rtl: true },
  { code: 'az', label: 'Azərbaycan dili', english: 'Azerbaijani' },
  { code: 'cs', label: 'Čeština', english: 'Czech' },
  { code: 'da', label: 'Dansk', english: 'Danish' },
  { code: 'de', label: 'Deutsch', english: 'German' },
  { code: 'el', label: 'Ελληνικά', english: 'Greek' },
  { code: 'es', label: 'Español', english: 'Spanish' },
  { code: 'fa', label: 'فارسی', english: 'Persian', rtl: true },
  { code: 'fi', label: 'Suomi', english: 'Finnish' },
  { code: 'fr', label: 'Français', english: 'French' },
  { code: 'he', label: 'עברית', english: 'Hebrew', rtl: true },
  { code: 'hi', label: 'हिन्दी', english: 'Hindi' },
  { code: 'hu', label: 'Magyar', english: 'Hungarian' },
  { code: 'id', label: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'it', label: 'Italiano', english: 'Italian' },
  { code: 'ja', label: '日本語', english: 'Japanese' },
  { code: 'ko', label: '한국어', english: 'Korean' },
  { code: 'nl', label: 'Nederlands', english: 'Dutch' },
  { code: 'no', label: 'Norsk', english: 'Norwegian' },
  { code: 'pl', label: 'Polski', english: 'Polish' },
  { code: 'pt', label: 'Português', english: 'Portuguese' },
  { code: 'ro', label: 'Română', english: 'Romanian' },
  { code: 'ru', label: 'Русский', english: 'Russian' },
  { code: 'sv', label: 'Svenska', english: 'Swedish' },
  { code: 'th', label: 'ไทย', english: 'Thai' },
  { code: 'uk', label: 'Українська', english: 'Ukrainian' },
  { code: 'vi', label: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'zh-Hans', label: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'zh-Hant', label: '繁體中文', english: 'Chinese (Traditional)' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

const BY_CODE = new Map(LANGUAGES.map((l) => [l.code, l]));

export function languageInfo(code) {
  return BY_CODE.get(code) || null;
}

export function isRtl(code) {
  return !!BY_CODE.get(code)?.rtl;
}

/**
 * Cihaz yerel ayarını desteklenen bir dile eşler.
 *
 * `getLocales()` "pt-BR", "zh-Hant-TW" gibi bölgeli etiketler döndürür.
 * Önce tam etiket, sonra Çince için yazı sistemi, en sonda yalın dil kodu
 * denenir; hiçbiri tutmazsa İngilizce'ye düşülür.
 */
export function matchDeviceLanguage(locales) {
  for (const loc of locales || []) {
    const tag = loc?.languageTag || '';
    const lang = loc?.languageCode || '';

    if (BY_CODE.has(tag)) return tag;

    if (lang === 'zh') {
      const script = loc?.languageScriptCode;
      if (script === 'Hant') return 'zh-Hant';
      if (script === 'Hans') return 'zh-Hans';
      // Yazı sistemi bildirilmemişse bölgeye bakarız: TW/HK/MO geleneksel.
      const region = loc?.regionCode;
      return ['TW', 'HK', 'MO'].includes(region) ? 'zh-Hant' : 'zh-Hans';
    }

    if (BY_CODE.has(lang)) return lang;
  }
  return 'en';
}

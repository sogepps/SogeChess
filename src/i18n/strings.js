import en from './locales/en';
import tr from './locales/tr';
import ar from './locales/ar';
import az from './locales/az';
import cs from './locales/cs';
import da from './locales/da';
import de from './locales/de';
import el from './locales/el';
import es from './locales/es';
import fa from './locales/fa';
import fi from './locales/fi';
import fr from './locales/fr';
import he from './locales/he';
import hi from './locales/hi';
import hu from './locales/hu';
import id from './locales/id';
import it from './locales/it';
import ja from './locales/ja';
import ko from './locales/ko';
import nl from './locales/nl';
import no from './locales/no';
import pl from './locales/pl';
import pt from './locales/pt';
import ro from './locales/ro';
import ru from './locales/ru';
import sv from './locales/sv';
import th from './locales/th';
import uk from './locales/uk';
import vi from './locales/vi';
import zhHans from './locales/zh-Hans';
import zhHant from './locales/zh-Hant';

/**
 * Bağımlılıksız i18n sözlükleri.
 *
 * Bütün diller açılışta paketle birlikte yüklenir. Sözlükler düz metinden
 * ibaret olduğu için toplam maliyet birkaç yüz kilobayttır; buna karşılık dil
 * değiştirmek anında olur ve uçak modunda bile çalışır.
 *
 * Anahtar bulunamazsa İngilizce'ye, o da yoksa anahtarın kendisine düşülür.
 * `npm run i18n:check` her dilin İngilizce ile aynı anahtar kümesine sahip
 * olduğunu doğrular, böylece eksik çeviri sessizce üretime sızmaz.
 */
export const DICTS = {
  en,
  tr,
  ar,
  az,
  cs,
  da,
  de,
  el,
  es,
  fa,
  fi,
  fr,
  he,
  hi,
  hu,
  id,
  it,
  ja,
  ko,
  nl,
  no,
  pl,
  pt,
  ro,
  ru,
  sv,
  th,
  uk,
  vi,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
};

export const FALLBACK_LANG = 'en';

/**
 * Çeviri arar ve {param} yer tutucularını doldurur.
 * @param {string} lang dil kodu
 * @param {string} key düz anahtar, ör. 'settings.title'
 * @param {object} [params] yer tutucu değerleri
 */
export function translate(lang, key, params) {
  const dict = DICTS[lang] || DICTS[FALLBACK_LANG];
  let str = dict[key] ?? DICTS[FALLBACK_LANG][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * AdMob sarmalayıcısı.
 *
 * `react-native-google-mobile-ads` native modüldür ve Expo Go'da yoktur; orada
 * import edilirse uygulama açılışta çöker. Bu yüzden modül tembel (lazy) olarak
 * yüklenir: Expo Go'da `available` false döner ve arayüz kendi tanıtım
 * afişine düşer, EAS build'de ise gerçek reklam gösterilir.
 *
 * Karışık kitle (çocuk + yetişkin tek uygulama): yaş bandına göre
 * `ageRestrictedTreatment` + `maxAdContentRating` + NPA ayarlanır. 13 altı
 * kullanıcıya kişiselleştirilmiş reklam ve ATT sorulmaz.
 */

const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

let mod = null;
let loadFailed = false;
/** @type {'under13'|'teen'|'adult'|null} */
let audienceBand = null;

function ads() {
  if (isExpoGo || loadFailed) return null;
  if (mod) return mod;
  try {
    // eslint-disable-next-line global-require
    mod = require('react-native-google-mobile-ads');
    return mod;
  } catch {
    loadFailed = true;
    return null;
  }
}

export function adUnits() {
  const m = ads();
  if (!m) return null;
  const { TestIds } = m;
  return { banner: TestIds.BANNER, interstitial: TestIds.INTERSTITIAL };
}

/** Bu oturumda reklamlar kişiselleştirilmesin mi? (çocuk / ergen) */
export function adsMustBeNonPersonalized() {
  return audienceBand === 'under13' || audienceBand === 'teen' || !audienceBand;
}

/**
 * Yaş bandına göre global AdMob isteği yapılandırması.
 * initialize()'dan ÖNCE çağrılmalı.
 */
async function applyAudienceConfig(m, band) {
  const { MaxAdContentRating, AgeRestrictedTreatment } = m;
  let ageRestrictedTreatment = AgeRestrictedTreatment.UNSPECIFIED;
  let maxAdContentRating = MaxAdContentRating.PG;

  if (band === 'under13' || !band) {
    ageRestrictedTreatment = AgeRestrictedTreatment.CHILD;
    maxAdContentRating = MaxAdContentRating.G;
  } else if (band === 'teen') {
    ageRestrictedTreatment = AgeRestrictedTreatment.TEEN;
    maxAdContentRating = MaxAdContentRating.PG;
  }

  await m.default().setRequestConfiguration({
    maxAdContentRating,
    ageRestrictedTreatment,
    // Eski API'ler bazı cihaz/SDK birleşimlerinde hâlâ okunuyor; çocuk için ikisini de işaretle.
    tagForChildDirectedTreatment: band === 'under13' || !band,
    tagForUnderAgeOfConsent: band === 'under13' || band === 'teen' || !band,
  });
}

// --- Başlatma ------------------------------------------------------------------

let initialized = false;

/**
 * @param {{ ageBand?: 'under13'|'teen'|'adult'|null }} [opts]
 */
export async function initAds(opts = {}) {
  const m = ads();
  if (!m) return false;

  const band = opts.ageBand ?? audienceBand;
  audienceBand = band;

  // Yaş seçilmeden reklam SDK'sını açmayız — aksi halde yanlışlıkla
  // kişiselleştirilmiş istek gidebilir.
  if (!band) return false;

  try {
    await applyAudienceConfig(m, band);
  } catch {
    /* yapılandırma başarısız olsa da denemeye devam */
  }

  if (initialized) {
    // Yaş sonradan değiştiyse interstitial'ı NPA ile yeniden kur.
    resetInterstitial();
    return true;
  }
  initialized = true;

  // Çocuk / ergene ATT (izleme izni) sorma — gereksiz ve Families'e aykırı olabilir.
  const askTracking = band === 'adult';
  if (askTracking && Platform.OS === 'ios') {
    try {
      const { requestTrackingPermissionsAsync } = require('expo-tracking-transparency');
      await requestTrackingPermissionsAsync();
    } catch {
      /* izin alınamazsa kişiselleştirilmemiş reklamla devam */
    }
  }

  // UMP rıza formu: çocukta kişiselleştirme istemediğimiz için formu atlayabiliriz.
  if (band === 'adult') {
    try {
      const { AdsConsent } = m;
      const info = await AdsConsent.requestInfoUpdate();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') {
        await AdsConsent.showForm();
      }
    } catch {
      /* rıza akışı başarısız olsa reklam yine de gösterilir */
    }
  }

  try {
    await m.default().initialize();
    return true;
  } catch {
    return false;
  }
}

/** Yaş bandı ayarlardan değişince çağrılır; bir sonraki istekler yeni kuralla gider. */
export async function updateAdsAudience(ageBand) {
  audienceBand = ageBand;
  const m = ads();
  if (!m || !ageBand) return false;
  try {
    await applyAudienceConfig(m, ageBand);
    resetInterstitial();
    if (!initialized) return initAds({ ageBand });
    return true;
  } catch {
    return false;
  }
}

// --- Geçiş reklamı --------------------------------------------------------------

const MIN_GAP_MS = __DEV__ ? 20 * 1000 : 4 * 60 * 1000;
const WARMUP_EVENTS = __DEV__ ? 0 : 2;
const MAX_PER_SESSION = __DEV__ ? 50 : 4;

let lastShownAt = 0;
let eligibleCount = 0;
let shownThisSession = 0;
let interstitial = null;
let interstitialLoaded = false;

function requestOptions() {
  return { requestNonPersonalizedAdsOnly: adsMustBeNonPersonalized() };
}

function resetInterstitial() {
  interstitial = null;
  interstitialLoaded = false;
}

function ensureInterstitial() {
  const m = ads();
  if (!m) return null;
  if (interstitial) return interstitial;

  const { InterstitialAd, AdEventType } = m;
  interstitial = InterstitialAd.createForAdRequest(adUnits().interstitial, requestOptions());
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    try {
      interstitial.load();
    } catch {
      /* yoksay */
    }
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });
  try {
    interstitial.load();
  } catch {
    /* yoksay */
  }
  return interstitial;
}

export function preloadInterstitial() {
  ensureInterstitial();
}

export function maybeShowInterstitial(isPremium) {
  if (isPremium) return false;
  const m = ads();
  if (!m) return false;

  eligibleCount += 1;
  if (eligibleCount <= WARMUP_EVENTS) return false;
  if (shownThisSession >= MAX_PER_SESSION) return false;
  if (Date.now() - lastShownAt < MIN_GAP_MS) return false;

  const ad = ensureInterstitial();
  if (!ad || !interstitialLoaded) return false;

  try {
    ad.show();
    lastShownAt = Date.now();
    shownThisSession += 1;
    return true;
  } catch {
    return false;
  }
}

export function bannerParts() {
  const m = ads();
  if (!m) return null;
  return {
    BannerAd: m.BannerAd,
    BannerAdSize: m.BannerAdSize,
    unitId: adUnits().banner,
    requestOptions: requestOptions(),
  };
}

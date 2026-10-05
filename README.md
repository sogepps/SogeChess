# Soge Chess

Çevrimdışı çalışan, kapsamlı bir satranç uygulaması. React Native + Expo SDK 54.
Bütün veriler cihazda tutulur; hiçbir sunucuya bağlanmaz.

## Çalıştırma

```bash
npm install
npm start
```

Terminaldeki QR kodu **Expo Go** ile okutun. Telefon ve bilgisayar aynı Wi-Fi
ağında olmalı. Aynı ağda değilseniz:

```bash
npx expo start --tunnel
```

### Sürüm notu — neden SDK 54?

Proje **Expo SDK 54** (React 19.1.0 / React Native 0.81.5) üzerine kuruludur.
En güncel SDK 57 değil, ve bu bilinçli bir tercihtir.

Expo Go'nun App Store / Play Store'daki sürümü **SDK 54'te takılıdır**. Expo'nun
kendi sürüm API'si (`https://api.expo.dev/v2/versions/latest`) bunu
`expoGoSdkVersion: "54.0.0"` olarak bildiriyor; SDK 55, 56 ve 57 için hazırlanan
Expo Go sürümleri Apple onayında bekliyor. Projeyi SDK 55+ ile kurarsanız QR
kodu okuttuğunuzda *"Project is incompatible with this version of Expo Go"*
hatası alırsınız ve Expo Go'yu güncellemek bunu **çözmez** — mağazada daha yeni
sürüm yok.

Sürümü yükseltmeden önce Expo Go > Settings ekranından desteklenen SDK'yı
kontrol edin, ya da:

```bash
curl -s https://api.expo.dev/v2/versions/latest | findstr expoGoSdkVersion
```

`package.json` içindeki `overrides` alanı `react` ve `react-dom`'u aynı sürümde
kilitler. Bu alan olmadan bağımlılık ağacında iki farklı React kopyası oluşup
`npm install` `ERESOLVE` hatası verebilir veya çalışma anında "Invalid hook call"
çıkabilir — o alanı silmeyin.

`npx expo-doctor` SDK/Expo Go uyumunu **kontrol etmez**; 18/18 geçen bir proje
yine de Expo Go'da açılmayabilir. Tek güvenilir gösterge yukarıdaki API alanıdır.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm start` | Geliştirme sunucusu + QR kod |
| `npm test` | Satranç çekirdeği, PGN ve saat matematiği testleri (49 test) |
| `npm run verify` | Açılış hatlarının ve bulmacaların kural geçerliliği |
| `npm run i18n:check` | Tüm dil dosyalarının anahtar bütünlüğü |
| `npm run gen:puzzles` | Bulmaca setini yeniden üretir ve doğrular |
| `npm run gen:icons` | Uygulama ikonlarını SVG kaynağından üretir |
| `npm run doctor` | Expo yapılandırma sağlığı |
| `npm run build:ios` | EAS production build (iOS) |

## Özellikler

**Oyun**
- Motora karşı 5 zorluk seviyesi, arkadaşa karşı (pas-oyna), serbest analiz
- Masa başı (OTB) parti kaydı: hamleler, süreler, oyuncu/etkinlik bilgileri
- Sürükle-bırak veya dokun-oyna, terfi seçimi, geri al/ileri, ipucu
- Değerlendirme çubuğu, açılış tespiti (115 hat, ECO kodlu), açılış gezgini

**Satranç saati**
- Fischer, Bronstein, ABD gecikmesi, eklemesiz ve kum saati modları
- Çok aşamalı turnuva kontrolleri (ör. 40/90+30 → 30+30)
- Oyunculara farklı süre, özel ayar kaydetme, yanlış tarafa basma koruması
- Zaman damgası tabanlı: sayaç gecikse de kalan süre kaymaz
- Hamle sayacı, hamle başına süre istatistikleri, bayrak, duraklat, geri al

**Arşiv**
- Sınırsız parti ve konum kaydı, koleksiyon ve etiketler, favoriler
- PGN içe/dışa aktarma (çok partili dosyalar dahil), `[%clk]` süre etiketleri
- Konum düzenleyici: FEN yapıştırma, rok hakları, geçerken alma, doğrulama
- JSON yedek alma ve geri yükleme
- 26 doğrulanmış mat bulmacası, seri takibi

**Kişiselleştirme**
- 4 uygulama teması, 9 tahta teması, 4 taş seti
- Notasyon: kısa (Nf3), şekilli (♘f3), yerel (Af3 / Sf3 / …)
- **31 dil**: ilk açılışta bir kez dil seçimi, sonra Ayarlar'dan değiştirme;
  Arapça / Farsça / İbranice için RTL yerleşim. Kontrol: `npm run i18n:check`
- **Karışık kitle (her yaş)**: ilk açılışta nötr yaş bandı (13 altı / 13–17 / 18+).
  13 altı → AdMob çocuk muamelesi + G derecesi + kişiselleştirilmemiş reklam;
  ergen → yaşa uygun NPA; 18+ → standart. Play Families / öğretmen programı için
  tek uygulama üzerinden yayınlanabilir.
- **Arkadaşa karşı**: telefonu ortaya koyup karşılıklı oynama — her hamleden sonra
  tahta sıradaki oyuncuya döner.

## Mimari

```
app/                 expo-router ekranları (dosya tabanlı yönlendirme)
src/chess/           saf satranç mantığı — React'ten bağımsız, test edilebilir
  core.js            chess.js sarmalayıcıları, FEN/kare yardımcıları
  engine.js          motor sarmalayıcısı + değerlendirme
  clock.js           süre kontrolü tanımları ve biçimlendirme
  pgn.js             PGN okuma/yazma, çok partili dosyalar
  openings.js        açılış kitaplığı ve tespit
  puzzles.js         ÜRETİLMİŞ — scripts/generate-puzzles.mjs ile yenilenir
src/hooks/           useChessGame, useChessClock
src/store/           AsyncStorage veri katmanı + context'ler
src/components/      tahta, taşlar, UI kiti
scripts/             içerik üreteci ve testler
```

Satranç mantığı bilinçli olarak React'ten ayrıdır: `scripts/test-logic.mjs`
Node'da doğrudan çalışır, emülatör gerekmez.

### Depolama

Liste ekranlarının büyük arşivlerde yavaşlamaması için index'ler kayıtlardan
ayrı tutulur: `soge:v1:games:index` tek okumada tüm kart bilgisini verir, tam
parti yalnızca açıldığında `soge:v1:game:<id>` anahtarından okunur.

## Reklamlar

AdMob (`react-native-google-mobile-ads`) native modüldür ve **Expo Go'da
çalışmaz**. `src/services/ads.js` modülü tembel yükler: Expo Go'da devre dışı
kalır, EAS build'de gerçek reklam gösterir. Böylece tek kod tabanıyla hem QR ile
geliştirme hem de mağaza build'i mümkün.

Şu an her yerde **Google'ın resmî test birimleri** kullanılıyor. Test reklamları
gerçek gelir üretmez ama hesabın askıya alınmasını da önler — geliştirirken
kendi birimlerinize tıklamayın.

**Nerede reklam var**

| Yer | Tür | Not |
| --- | --- | --- |
| Ana sayfa, Oyna, Saat, Arşiv, Araçlar sekmeleri | Banner | İçeriğin altında, kaydırmayla birlikte |
| Bulmaca ekranı | Banner | Tahtanın altında, çözümü engellemez |
| Parti görüntüleyici | Banner | Hamle listesinin altında |
| Parti bitişi → "Tekrar oyna" | Geçiş | Doğal duraklama anı |
| Partiden çıkış (≥ 8 hamle oynanmışsa) | Geçiş | Kısa denemelerde gösterilmez |
| Saatten çıkış (saat başlatılmışsa) | Geçiş | Saat çalışırken **asla** |
| Bulmacalar arası geçiş | Geçiş | — |

Oyun tahtası ve çalışan saat ekranlarında banner yoktur; oyun sırasında hiçbir
reklam araya girmez.

**Sıklık sınırları** (`src/services/ads.js`): iki geçiş reklamı arasında en az
4 dakika, oturum başına en fazla 4 gösterim, ilk 2 uygun an atlanır (yeni
kullanıcı reklamsız başlar). Premium kullanıcıda hiç reklam yoktur.

**Gerçek birimlere geçiş**

1. `src/services/ads.js` → `adUnits()` içindeki `TestIds.BANNER` /
   `TestIds.INTERSTITIAL` yerine kendi birim kimliklerinizi yazın.
2. `app.json` → `react-native-google-mobile-ads` eklentisindeki `androidAppId`
   ve `iosAppId` alanlarını kendi AdMob uygulama kimliklerinizle değiştirin.
3. `skAdNetworkItems` listesine AdMob'un güncel SKAdNetwork kimliklerini ekleyin
   (Google'ın kendi kimliği zaten ekli).

## Premium

`src/store/PremiumContext.js` içindeki `testBilling` **test adaptörüdür**:
mağazaya hiç gitmez, hangi plana basılırsa basılsın premium'u anında açar.
Premium ekranındaki "Test modu" kartından tekrar kapatıp reklamlı akışı da
deneyebilirsiniz.

Yayına çıkarken yalnızca `testBilling` nesnesini gerçek sağlayıcıyla
(RevenueCat / `expo-in-app-purchases`) değiştirin ve `TEST_BILLING` bayrağını
`false` yapın; uygulamanın geri kalanı `usePremium()` kullanmaya devam eder.

Premium yalnızca reklamları kaldırır; oyun, saat, bulmaca, tema ve kayıtlar
herkese ücretsiz ve sınırsızdır.

## Hamle Stüdyosu

Analiz tahtası, konum düzenleyici ve masa başı kayıt tek ekranda birleşti:
`/studio`. Üstteki mod çipleriyle geçiş yapılır; hamle listesi ortaktır.
Kaydet → başlık + oyuncular; arşivden aç → hamleler arası gez / kaldığın
ply’dan devam / güncelle veya yeni kayıt. İsteğe bağlı arşiv PIN’i Ayarlar →
Veri’den konur.

## EAS build

Reklamlar ve mağaza SDK'ları native kod gerektirdiği için Expo Go yerine EAS
build almanız gerekir.

```bash
npm i -g eas-cli
eas login
eas init            # projeyi hesabınıza bağlar, app.json'a projectId yazar
```

| Komut | Ne verir |
| --- | --- |
| `npm run build:ios:dev` | Development build (dev client, cihaza kurulur) |
| `npm run build:ios:preview` | Ad-hoc dağıtım, TestFlight öncesi deneme |
| `npm run build:ios` | App Store için production build |
| `npm run build:android` | Play Store için AAB |

`eas build --profile simulator --platform ios` Apple Developer hesabı olmadan
simülatörde çalışan bir build üretir; reklamları hızlıca denemek için en ucuz yol.

iOS'ta ilk açılışta ATT (izleme izni) sorusu çıkar. İzin verilmezse reklamlar
kişiselleştirilmeden gösterilir; uygulama normal çalışmaya devam eder.

### İkonlar

Tüm ikonlar tek bir SVG kaynağından üretilir:

```bash
npm run gen:icons
```

`scripts/generate-icons.mjs` içindeki renkleri veya at geometrisini değiştirip
komutu yeniden çalıştırın; `assets/` altındaki altı dosya (App Store ikonu,
Android uyarlanabilir ikonun üç katmanı, açılış ekranı, favicon) yenilenir.

### Ekranın altı ve gezinme çubuğu

Android 15+ ve Expo SDK 54 uygulamayı zorunlu olarak edge-to-edge çizer: içerik
sistem çubuklarının altına uzanır. Samsung'un 3 tuşlu gezinme çubuğu ~48dp yer
kapladığı için boşluk elle bırakılmazsa en alttaki satırlar çubuğun altında
kalır.

`src/hooks/useSafeLayout.js` bunun tek doğruluk kaynağıdır — ekranlarda sabit
piksel değeri yazmayın:

- `useBottomInset(extra)` — normal ekranların alt boşluğu
- `useTabContentPadding(extra)` — sekmeli ekranlarda kaydırma içeriğinin altı
- `useTabBarHeight()` — sekme çubuğunun gerçek yüksekliği
- `useStickyBarPadding(base)` — alta sabitlenmiş buton çubukları

`<Screen tabBar>` bileşeni sekmeli ekranlarda bu boşluğu kendisi ayarlar.

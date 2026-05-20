# 11 — Medya Pipeline

---

## Genel Bakış

```
[Flutter Cihaz]
  │ 1. Sıkıştır (flutter_image_compress / video_compress)
  │ 2. POST /v1/media/upload-url → presigned URL al
  │ 3. PUT <presigned-url> → direkt R2/CF'ye yükle
  │ 4. POST /v1/media/finalize → backend'e bildir
  ▼
[Cloudflare R2] — Ham dosya deposu
  │
  ├── Fotoğraf → [Cloudflare Images] — Otomatik resize + AVIF/WebP
  │
  └── Video → [Cloudflare Stream] — Transcode + HLS
                  │
                  └── Webhook → Backend → DB status güncelle
```

---

## 1. Flutter Tarafı — Sıkıştırma

### Fotoğraf Sıkıştırma

```dart
// lib/features/camera/data/media_compressor.dart
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:rollpit/core/constants/media_constants.dart';

class MediaCompressor {
  Future<XFile?> compressImage(XFile source) async {
    final result = await FlutterImageCompress.compressAndGetFile(
      source.path,
      '${source.path}_compressed.jpg',
      quality: kImageCompressQuality,     // 85
      minWidth: kImageMaxWidth,           // 1920
      minHeight: kImageMaxHeight,         // 1080
      format: CompressFormat.jpeg,
    );
    return result;
  }

  Future<MediaInfo?> compressVideo(String path) async {
    final info = await VideoCompress.compressVideo(
      path,
      quality: VideoQuality.MediumQuality,
      deleteOrigin: false,
      includeAudio: true,
    );
    return info;
  }
}
```

### Presigned URL Alıp Yükleme

```dart
// lib/features/camera/data/media_upload_service.dart
import 'package:dio/dio.dart';

class MediaUploadService {
  final Dio _dio;
  MediaUploadService(this._dio);

  Future<String> uploadPhoto(XFile file) async {
    // 1. Presigned URL al
    final urlRes = await _dio.post('/v1/media/upload-url', data: {
      'filename':     file.name,
      'content_type': 'image/jpeg',
      'asset_type':   'photo',
      'size_bytes':   await file.length(),
    });
    final uploadUrl = urlRes.data['data']['upload_url'] as String;
    final assetId   = urlRes.data['data']['asset_id']   as String;

    // 2. Direkt Cloudflare'e yükle (backend'e geçmez)
    final bytes = await file.readAsBytes();
    await _dio.put(
      uploadUrl,
      data: bytes,
      options: Options(
        contentType: 'image/jpeg',
        headers: {'Content-Length': bytes.length},
        sendTimeout: const Duration(seconds: 30),
      ),
    );

    // 3. Backend'e tamamlandığını bildir
    await _dio.post('/v1/media/finalize', data: {'asset_id': assetId});
    return assetId;
  }
}
```

---

## 2. Backend Tarafı — Finalize & Webhook

### POST /v1/media/finalize

```typescript
// src/routes/media.ts
router.post('/finalize', async (c) => {
  const body = await c.req.json();
  const { asset_id } = FinalizeSchema.parse(body);
  const userId = c.get('userId');

  const sb = getSupabaseClient();

  // Henüz pending olan kaydı bul
  const { data: asset } = await sb
    .from('media_assets')
    .select()
    .eq('id', asset_id)
    .eq('uploader_id', userId)
    .eq('status', 'pending')
    .single();

  if (!asset) return c.json({ error: 'Asset not found', code: 'NOT_FOUND' }, 404);

  // R2 HEAD ile upload'un gerçekten tamamlandığını doğrula
  const metadata = await headObject(asset.storage_key);
  if (!metadata) return c.json({ error: 'Uploaded object not found', code: 'UPLOAD_NOT_FOUND' }, 409);

  // Video ise Cloudflare Stream'e bildir (arka planda transcode başlar)
  if (asset.asset_type === 'video') {
    await copyCloudflareStreamFromUrl({
      url: generateR2ReadUrl(asset.storage_key),
      assetId: asset.id,
      storageKey: asset.storage_key,
    });
    // Status webhook gelince güncellenir
  } else {
    // Fotoğraf — Cloudflare Images'a kopyala
    const cfImageId = await uploadToCloudflareImagesFromUrl(generateR2ReadUrl(asset.storage_key));
    await sb.from('media_assets').update({
      status: 'ready',
      cf_image_id: cfImageId,
    }).eq('id', asset_id);
  }

  return c.json({ data: { ok: true, asset_id } });
});
```

### Cloudflare Stream Webhook

```typescript
// src/routes/media.ts
// POST /v1/media/webhook/stream  (auth yok, Cloudflare imzası doğrulanır)
router.post('/webhook/stream', async (c) => {
  const signature = c.req.header('Webhook-Signature') ?? '';
  const body = await c.req.text();

  if (!verifyCloudflareSignature(body, signature, process.env.CF_STREAM_WEBHOOK_SECRET!)) {
    return c.json({ error: 'Invalid signature' }, 401);
  }

  const event = JSON.parse(body);
  if (event.readyToStream || event.status?.state === 'ready') {
    await getSupabaseAdmin()
      .from('media_assets')
      .update({
        status: 'ready',
        cf_stream_id: event.uid,
        duration_sec: Math.round(event.duration ?? 0),
        width: event.input?.width,
        height: event.input?.height,
      })
      .eq('id', event.meta.asset_id);
  }

  return c.json({ ok: true });
});
```

---

## 3. Cloudflare Images — Varyant Konfigürasyonu

Cloudflare Images dashboard'ında şu varyantlar tanımlanır:

| Varyant | Genişlik | Yükseklik | Fit | Kullanım |
|---|---|---|---|---|
| `thumb`  | 120  | 120  | cover | Avatar, mini önizleme |
| `feed`   | 640  | 480  | contain | Feed kartları |
| `full`   | 1920 | 1080 | contain | Tam ekran görüntüleme |
| `square` | 400  | 400  | cover | Topluluk cover |

Backend bu canonical listeyi `GET /v1/config` içinde `media.image_variants` olarak döndürür. Client sabit isimleri kullanır; Cloudflare dashboard/API tarafında aynı isimlerle variant oluşturulmalıdır.

Flutter'da URL yapısı:

```dart
// lib/core/utils/image_url.dart
String cfImageUrl(String cfImageId, String variant) {
  const accountHash = String.fromEnvironment('CF_IMAGES_ACCOUNT_HASH');
  return 'https://imagedelivery.net/$accountHash/$cfImageId/$variant';
}

// Kullanım
final thumbUrl = cfImageUrl(asset.cfImageId, 'thumb');
final feedUrl  = cfImageUrl(asset.cfImageId, 'feed');
```

---

## 4. Cloudflare Stream — Video Oynatma

```dart
// lib/features/camera/ui/widgets/video_player_widget.dart
// HLS URL: https://customer-<hash>.cloudflarestream.com/<streamId>/manifest/video.m3u8

import 'package:video_player/video_player.dart';

class StreamVideoPlayer extends StatefulWidget {
  final String streamId;
  const StreamVideoPlayer({super.key, required this.streamId});

  @override
  State<StreamVideoPlayer> createState() => _StreamVideoPlayerState();
}

class _StreamVideoPlayerState extends State<StreamVideoPlayer> {
  late VideoPlayerController _controller;
  static const _cdnBase = String.fromEnvironment('CF_STREAM_CDN_BASE');

  @override
  void initState() {
    super.initState();
    final url = '$_cdnBase/${widget.streamId}/manifest/video.m3u8';
    _controller = VideoPlayerController.networkUrl(Uri.parse(url))
      ..initialize().then((_) => setState(() {}));
  }

  @override
  Widget build(BuildContext context) {
    return _controller.value.isInitialized
        ? AspectRatio(
            aspectRatio: _controller.value.aspectRatio,
            child: VideoPlayer(_controller),
          )
        : const CircularProgressIndicator();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

---

## 5. Dosya Boyutu ve Format Limitleri

| Tip | Max Boyut | İzin Verilen Format | Sıkıştırma Sonrası Hedef |
|---|---|---|---|
| Profil avatarı | 5 MB | JPEG, PNG, WEBP | < 200 KB |
| Feed fotoğrafı | 20 MB | JPEG, PNG, WEBP | < 1 MB |
| Snap video | 50 MB (kayıt) | MP4 (H.264) | < 15 sn, < 20 MB |
| Topluluk cover | 10 MB | JPEG, PNG | < 500 KB |

---

## 6. R2 Bucket Yapısı

```
rollpit-media/
├── photos/
│   └── <userId>/
│       └── <ulid>.jpg
├── videos/
│   └── <userId>/
│       └── <ulid>.mp4
├── avatars/
│   └── <userId>/
│       └── <ulid>.jpg
└── covers/
    └── <entityId>/
        └── <ulid>.jpg
```

---

## 7. Medya Silme Akışı

```typescript
// Kullanıcı medyasını sildiğinde
async function deleteMediaAsset(assetId: string, userId: string) {
  const sb = getSupabaseAdmin();
  const { data: asset } = await sb
    .from('media_assets')
    .select()
    .eq('id', assetId)
    .eq('uploader_id', userId)
    .single();

  if (!asset) throw new Error('Not found');

  // R2'den sil (404 idempotent kabul edilir)
  await deleteObject(asset.storage_key);

  // Cloudflare Images'dan sil
  if (asset.cf_image_id) {
    await deleteCFImage(asset.cf_image_id);
  }

  // Cloudflare Stream'den sil
  if (asset.cf_stream_id) {
    await deleteCFStream(asset.cf_stream_id);
  }

  // DB'den sil
  await sb.from('media_assets').delete().eq('id', assetId);
}
```

V1 backend davranışı: `DELETE /v1/media/:id` sahiplik kontrolü yapar, R2 objesini siler ve `media_assets` kaydını kaldırır. `CF_IMAGES_API_TOKEN` / `CF_STREAM_API_TOKEN` tanımlıysa Cloudflare Images/Stream silme çağrıları da aynı akışta yapılır.

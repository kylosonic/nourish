import type { ReleaseMetadata } from './api';

export {
  fetchReleaseMetadata,
  RELEASE_METADATA_URL,
  type ReleaseMetadata,
} from './api';

export function releaseDownloadUrl(metadata: ReleaseMetadata): string | null {
  if (metadata.android?.available && metadata.android.apk) return metadata.android.apk;
  if (metadata.android?.available && metadata.android.universal_apk?.url) {
    return metadata.android.universal_apk.url;
  }
  if (metadata.ios?.installable && metadata.ios.ipa) return metadata.ios.ipa;
  return null;
}

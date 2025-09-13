import { ExpoConfig } from 'expo';

export default (): ExpoConfig => ({
  name: 'ArchiveCrossPlatformApp',
  slug: 'archive-cross-platform-app',
  version: '1.0.0',
  platforms: ['ios', 'android', 'web'],
  orientation: 'portrait',
  web: { bundler: 'webpack' },
});

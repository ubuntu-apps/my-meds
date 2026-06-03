import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ubuntuapps.mymeds',
  appName: 'My Meds',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config

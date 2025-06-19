/**
 * Configuration Service
 * Manages application configuration from Firebase Remote Config or Firestore
 * No dependency on .env files
 */

import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import { app, isFirebaseConfigured } from '../config/firebase';

interface AppConfig {
  useTebraPhpApi: boolean;
  tebraPhpApiUrl: string;
  tebraInternalApiKey?: string;
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig | null = null;
  private db = isFirebaseConfigured() ? getFirestore(app) : null;
  private remoteConfig = isFirebaseConfigured() ? getRemoteConfig(app) : null;

  private constructor() {
    // Set default values for Remote Config
    if (this.remoteConfig) {
      this.remoteConfig.defaultConfig = {
        useTebraPhpApi: 'true',
        tebraPhpApiUrl: 'https://tebra-php-api-oqg3wfutka-uc.a.run.app/api',
      };
    }
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Load configuration from Firebase
   * Priority: Firestore > Remote Config > Defaults
   */
  async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    // Default configuration - ALWAYS use PHP API
    let config: AppConfig = {
      useTebraPhpApi: true, // ALWAYS true - Node.js is not supported for Tebra
      tebraPhpApiUrl: 'https://tebra-php-api-oqg3wfutka-uc.a.run.app/api',
    };

    try {
      // Try Firestore first (for dynamic per-environment config)
      if (this.db) {
        const configDoc = await getDoc(doc(this.db, 'config', 'app'));
        if (configDoc.exists()) {
          const firestoreConfig = configDoc.data();
          config = {
            ...config,
            ...firestoreConfig,
          };
          console.log('📋 Loaded config from Firestore');
        }
      }

      // Try Remote Config as fallback
      if (this.remoteConfig && !this.config) {
        try {
          await fetchAndActivate(this.remoteConfig);
          
          config.useTebraPhpApi = getValue(this.remoteConfig, 'useTebraPhpApi').asBoolean();
          config.tebraPhpApiUrl = getValue(this.remoteConfig, 'tebraPhpApiUrl').asString();
          
          console.log('📋 Loaded config from Remote Config');
        } catch (error) {
          console.warn('⚠️ Remote Config not available:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
    }

    // Cache the configuration
    this.config = config;
    
    console.log('🔧 Configuration loaded:', {
      useTebraPhpApi: config.useTebraPhpApi,
      tebraPhpApiUrl: config.tebraPhpApiUrl,
    });

    return config;
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig | null {
    return this.config;
  }

  /**
   * Get a specific configuration value
   */
  async get<K extends keyof AppConfig>(key: K): Promise<AppConfig[K]> {
    const config = await this.loadConfig();
    return config[key];
  }

  /**
   * Update configuration in Firestore (admin use only)
   */
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    if (!this.db) {
      throw new Error('Firestore not available');
    }

    const configRef = doc(this.db, 'config', 'app');
    await setDoc(configRef, updates, { merge: true });
    
    // Clear cache to force reload
    this.config = null;
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Helper functions for easy access
export const getTebraApiConfig = async () => {
  const config = await configService.loadConfig();
  return {
    usePhpApi: config.useTebraPhpApi,
    phpApiUrl: config.tebraPhpApiUrl,
    internalApiKey: config.tebraInternalApiKey,
  };
};

export default configService;
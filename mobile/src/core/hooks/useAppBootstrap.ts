import { useEffect, useState } from 'react';

import { notificationService } from '../../services/notifications/notificationService';
import { logger } from '../../services/logging/logger';
import { useAuthStore, useSecurityStore } from '../../store';
import { useSettingsStore } from '../../store/settingsStore';
import { useNetworkStore } from '../../store/networkStore';

export const useAppBootstrap = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const initializeSecurity = useSecurityStore((state) => state.initializeSecurity);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = useNetworkStore.getState().initialize();

    const bootstrap = async () => {
      try {
        await Promise.all([
          restoreSession(),
          initializeSecurity(),
          loadSettings(),
          notificationService.initialize(),
        ]);
      } catch (error) {
        logger.captureException(error, { scope: 'useAppBootstrap' });
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [initializeSecurity, loadSettings, restoreSession]);

  return { isBootstrapping };
};

import { useState, useCallback, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

import { useSettingsStore } from '../store/settingsStore';
import { useExpenseStore } from '../store/expenseStore';
import { SmsMessage, parseSmsForExpense } from '../utils/smsParser';

export const useSmsSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  const { isAutoTrackEnabled, isLoaded, lastSyncTimestamp, processedSmsIds, updateLastSync, addProcessedSmsId } =
    useSettingsStore();
  const { createExpense } = useExpenseStore();

  const syncSms = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    if (!isLoaded || !isAutoTrackEnabled) return;
    
    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    if (!hasPermission) return;

    setIsSyncing(true);
    setSyncedCount(0);

    const filter = {
      box: 'inbox', 
      maxCount: 100,
      ...(lastSyncTimestamp ? { minDate: lastSyncTimestamp } : {})
    };

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => {
        console.warn('Failed with this error: ' + fail);
        setIsSyncing(false);
      },
      async (count: number, smsListRaw: string) => {
        try {
          const messages = JSON.parse(smsListRaw) as SmsMessage[];
          let newlyAdded = 0;

          for (let i = messages.length - 1; i >= 0; i--) {
            const sms = messages[i];

            if (processedSmsIds.includes(String(sms._id))) continue;

            const expenseData = parseSmsForExpense(sms);
            if (expenseData) {
              try {
                await createExpense({
                  amount: expenseData.amount,
                  category: expenseData.category,
                  description: expenseData.merchant
                });

                await addProcessedSmsId(String(sms._id));
                newlyAdded++;
              } catch (err) {
                console.error('Failed to auto-create expense', err);
              }
            }
          }

          await updateLastSync(Date.now());
          setSyncedCount(newlyAdded);
        } catch (e) {
          console.error('JSON parse error in SMS sync', e);
        } finally {
          setIsSyncing(false);
        }
      }
    );
  }, [addProcessedSmsId, createExpense, isAutoTrackEnabled, isLoaded, lastSyncTimestamp, processedSmsIds, updateLastSync]);

  useEffect(() => {
    const timer = setTimeout(() => {
      syncSms();
    }, 2000);
    return () => clearTimeout(timer);
  }, [syncSms]);

  return { syncSms, isSyncing, syncedCount };
};

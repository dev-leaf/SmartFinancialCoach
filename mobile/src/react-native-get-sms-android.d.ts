declare module 'react-native-get-sms-android' {
  export interface SmsFilter {
    box: 'inbox' | 'sent' | 'draft';
    maxCount?: number;
    minDate?: number;
  }

  export interface SmsAndroidModule {
    list(
      filter: string,
      failureCallback: (error: string) => void,
      successCallback: (count: number, smsList: string) => void,
    ): void;
  }

  const SmsAndroid: SmsAndroidModule;
  export default SmsAndroid;
}

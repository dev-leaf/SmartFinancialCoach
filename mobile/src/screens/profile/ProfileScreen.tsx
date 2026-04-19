import React, { useEffect } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button, Divider, Switch, Snackbar, Modal, Portal, TextInput as PaperInput } from 'react-native-paper';
import { useAuthStore, useSecurityStore } from '../../store';
import { useSettingsStore } from '../../store/settingsStore';
import { useSmartAlertsStore } from '../../store/smartAlertsStore';
import { useSubscriptionStore, useSubscriptionSummary } from '../../store/paymentStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ShareAndInviteCard } from './ShareAndInviteCard';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { isAutoTrackEnabled, lastSyncTimestamp, toggleAutoTrack, loadSettings } = useSettingsStore();
  const { isSecurityEnabled, toggleSecurity } = useSecurityStore();
  const {
    configuration,
    fetchConfiguration,
    updateConfiguration,
  } = useSmartAlertsStore();

  // Subscription
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const fetchSubscription = useSubscriptionStore((state) => state.fetchSubscription);
  const cancelSubscription = useSubscriptionStore((state) => state.cancelSubscription);
  const { tier, daysRemaining, expiresAt } = useSubscriptionSummary();
  
  const [snackbarVisible, setSnackbarVisible] = React.useState(false);
  const [snackbarMsg, setSnackbarMsg] = React.useState('');
  const [pinModalVisible, setPinModalVisible] = React.useState(false);
  const [tempPin, setTempPin] = React.useState('');

  useEffect(() => {
    loadSettings();
    fetchConfiguration().catch(() => undefined);
    fetchSubscription();
  }, [loadSettings]);

  const handleLogout = async () => {
    await logout();
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will lose access to premium features.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Subscription',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription('Cancelled from profile');
              setSnackbarMsg('✅ Subscription cancelled successfully');
              setSnackbarVisible(true);
            } catch (err) {
              setSnackbarMsg('❌ Failed to cancel subscription');
              setSnackbarVisible(true);
            }
          },
        },
      ],
    );
  };

  const handleToggleAutoTrack = async (value: boolean) => {
    if (value && Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission required',
            message: 'Smart Financial Coach needs access to your SMS to automatically track bank expenses.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setSnackbarMsg('SMS permission denied. Auto tracking cannot be enabled.');
          setSnackbarVisible(true);
          await toggleAutoTrack(false);
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
    await toggleAutoTrack(value);
  };

  const handleSecurityToggle = (value: boolean) => {
    if (value) {
      setTempPin('');
      setPinModalVisible(true);
    } else {
      toggleSecurity(false);
      setSnackbarMsg('App lock disabled.');
      setSnackbarVisible(true);
    }
  };

  const handleSavePin = () => {
    if (tempPin.length < 4) {
      setSnackbarMsg('PIN must be at least 4 digits');
      setSnackbarVisible(true);
      return;
    }
    toggleSecurity(true, tempPin);
    setPinModalVisible(false);
    setSnackbarMsg('App lock secured with Biometrics & PIN.');
    setSnackbarVisible(true);
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* User Card */}
        <Card style={styles.userCard}>
          <Card.Content style={styles.userContent}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="account-circle" size={64} color="#2196F3" />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} variant="titleLarge">
                {user?.name || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Subscription Section */}
        <Card style={[styles.subscriptionCard, { borderLeftColor: isPremium ? '#0A84FF' : '#999', borderLeftWidth: 4 }]}>
          <Card.Content>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text variant="bodySmall" style={styles.subscriptionLabel}>
                  Current Plan
                </Text>
                <Text variant="titleMedium" style={styles.subscriptionTier}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </Text>
              </View>
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Ionicons name="star" size={16} color="white" />
                  <Text style={styles.badgeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            {subscription && subscription.status === 'active' && (
              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={18} color="#0A84FF" />
                  <View style={styles.detailContent}>
                    <Text variant="bodySmall" style={styles.detailLabel}>Days Remaining</Text>
                    <Text variant="bodyMedium" style={styles.detailValue}>{daysRemaining} days</Text>
                  </View>
                </View>

                {expiresAt && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={18} color="#0A84FF" />
                    <View style={styles.detailContent}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Expires On</Text>
                      <Text variant="bodyMedium" style={styles.detailValue}>
                        {new Date(expiresAt).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                )}

                {subscription.renewalDate && (
                  <View style={styles.detailRow}>
                    <Ionicons name="refresh-outline" size={18} color="#34C759" />
                    <View style={styles.detailContent}>
                      <Text variant="bodySmall" style={styles.detailLabel}>Auto-Renewal</Text>
                      <Text variant="bodyMedium" style={styles.detailValue}>
                        {new Date(subscription.renewalDate).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {!isPremium && (
              <View style={styles.freeTierMessage}>
                <Ionicons name="information-circle-outline" size={20} color="#0A84FF" />
                <Text style={styles.freeText}>Upgrade to unlock premium features</Text>
              </View>
            )}

            <View style={styles.subscriptionActions}>
              <Button
                mode="contained"
                icon="upgrade"
                style={{ flex: 1 }}
                onPress={() => (global as any)?.navigation?.navigate?.('Subscriptions')}
              >
                {isPremium ? 'Upgrade Plan' : 'Get Premium'}
              </Button>
              {isPremium && (
                <Button
                  mode="outlined"
                  icon="close"
                  style={{ flex: 1, marginLeft: 8 }}
                  onPress={handleCancelSubscription}
                >
                  Cancel
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Automations Section */}
        <Text style={styles.sectionTitle} variant="titleMedium">
          Automations
        </Text>

        <Card style={styles.settingsCard}>
          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="sms" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Auto Track Expenses (SMS)
              </Text>
              <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
                Last synced: {formatLastSync(lastSyncTimestamp)}
              </Text>
            </View>
            <Switch
              value={isAutoTrackEnabled}
              onValueChange={handleToggleAutoTrack}
              color="#2196F3"
            />
          </Card.Content>
        </Card>

        <ShareAndInviteCard />

        {/* Security Section */}
        <Text style={styles.sectionTitle} variant="titleMedium">
          Privacy & Security
        </Text>

        <Card style={styles.settingsCard}>
          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="fingerprint" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                App Lock (Biometrics / PIN)
              </Text>
              <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
                Require auth when reopening the app
              </Text>
            </View>
            <Switch
              value={isSecurityEnabled}
              onValueChange={handleSecurityToggle}
              color="#2196F3"
            />
          </Card.Content>
        </Card>

        {/* Smart Alerts Section */}
        <Text style={styles.sectionTitle} variant="titleMedium">
          Smart Alerts
        </Text>

        <Card style={styles.settingsCard}>
          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="notifications-active" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Budget threshold alerts
              </Text>
              <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
                Notify when you approach your budget limit
              </Text>
            </View>
            <Switch
              value={(configuration?.budgetThresholdPercent ?? 80) > 0}
              onValueChange={(value) => updateConfiguration({ budgetThresholdPercent: value ? 80 : 0 })}
              color="#2196F3"
            />
          </Card.Content>

          <Divider />

          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="warning" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Unusual spending detection
              </Text>
              <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
                Alert on unusually high daily spend
              </Text>
            </View>
            <Switch
              value={configuration?.unusualSpendingEnabled ?? true}
              onValueChange={(value) => updateConfiguration({ unusualSpendingEnabled: value })}
              color="#2196F3"
            />
          </Card.Content>

          <Divider />

          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="repeat" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Subscription reminders
              </Text>
              <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
                Remind about recurring charges and subscriptions
              </Text>
            </View>
            <Switch
              value={configuration?.subscriptionRemindersEnabled ?? true}
              onValueChange={(value) => updateConfiguration({ subscriptionRemindersEnabled: value })}
              color="#2196F3"
            />
          </Card.Content>
        </Card>

        {/* Account Section */}
        <Text style={styles.sectionTitle} variant="titleMedium">
          Account
        </Text>

        <Card style={styles.settingsCard}>
          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="auto-awesome" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Personalize your coaching
              </Text>
              <Text variant="bodySmall" style={{ color: '#888', marginTop: 2 }}>
                Add income + goals to improve insights and score accuracy
              </Text>
            </View>
            <Button mode="outlined" onPress={() => (global as any)?.navigation?.navigate?.('Onboarding')}>
              Start
            </Button>
          </Card.Content>

          <Divider />

          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="email" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Email Address
              </Text>
              <Text variant="bodyMedium" style={styles.settingValue}>
                {user?.email}
              </Text>
            </View>
          </Card.Content>

          <Divider />

          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="person" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Full Name
              </Text>
              <Text variant="bodyMedium" style={styles.settingValue}>
                {user?.name}
              </Text>
            </View>
          </Card.Content>

          <Divider />

          <Card.Content style={styles.settingItem}>
            <MaterialIcons name="calendar-today" size={24} color="#666" />
            <View style={styles.settingText}>
              <Text variant="bodySmall" style={styles.settingLabel}>
                Member Since
              </Text>
              <Text variant="bodyMedium" style={styles.settingValue}>
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#F44336"
        >
          Logout
        </Button>
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMsg}
      </Snackbar>

      <Portal>
        <Modal visible={pinModalVisible} onDismiss={() => setPinModalVisible(false)} contentContainerStyle={styles.modalContent}>
          <Text variant="titleMedium" style={{ marginBottom: 16 }}>Set Fallback PIN</Text>
          <Text variant="bodyMedium" style={{ marginBottom: 24, color: '#666' }}>
            Enter a secure PIN to use if Biometrics fail.
          </Text>
          <PaperInput
            mode="outlined"
            label="PIN Code"
            value={tempPin}
            onChangeText={setTempPin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={{ marginBottom: 24 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            <Button onPress={() => setPinModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSavePin}>Enable Lock</Button>
          </View>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subscriptionLabel: {
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subscriptionTier: {
    fontWeight: '700',
    color: '#0A84FF',
    marginTop: 4,
  },
  premiumBadge: {
    backgroundColor: '#0A84FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  subscriptionDetails: {
    gap: 10,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: '#999',
  },
  detailValue: {
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  freeTierMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 10,
  },
  freeText: {
    color: '#0A84FF',
    fontWeight: '500',
    flex: 1,
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  settingsCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    color: '#999',
    marginBottom: 4,
  },
  settingValue: {
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    margin: 24,
    borderRadius: 12,
  }
});

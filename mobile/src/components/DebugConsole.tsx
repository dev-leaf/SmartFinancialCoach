import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { logger, LogLevel } from '../utils/logger';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/**
 * Debug Console Component - Shows all payment system logs
 * Use in development to monitor payment flow
 */
export const DebugConsole = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const allLogs = logger.getLogs();
      setLogs(allLogs);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getFilteredLogs = () => {
    if (!filter) return logs;
    if (filter === 'errors') {
      return logs.filter((log) => log.level === LogLevel.ERROR || log.level === LogLevel.WARN);
    }
    return logs.filter((log) => log.category === filter);
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case LogLevel.SUCCESS:
        return '#34C759';
      case LogLevel.ERROR:
        return '#FF3B30';
      case LogLevel.WARN:
        return '#FF9500';
      case LogLevel.INFO:
        return '#0A84FF';
      case LogLevel.DEBUG:
        return '#888';
      default:
        return '#666';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case LogLevel.SUCCESS:
        return '✅';
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.DEBUG:
        return '🔍';
      default:
        return '•';
    }
  };

  const handleExportLogs = async () => {
    try {
      const text = logger.exportLogs();
      await Share.share({
        message: text,
        title: 'Payment System Logs',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export logs');
    }
  };

  const handleClearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => logger.clearLogs(),
        },
      ]
    );
  };

  const filteredLogs = getFilteredLogs();

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="bug-report" size={24} color="white" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🔍 Debug Console</Text>
          <Text style={styles.subtitle}>Payment System Logs</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsVisible(false)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <StatBox label="Total" value={logs.length} color="#0A84FF" />
        <StatBox
          label="Errors"
          value={logs.filter((l) => l.level === LogLevel.ERROR).length}
          color="#FF3B30"
        />
        <StatBox
          label="Success"
          value={logs.filter((l) => l.level === LogLevel.SUCCESS).length}
          color="#34C759"
        />
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <FilterButton
          label="All"
          active={filter === null}
          onPress={() => setFilter(null)}
        />
        <FilterButton
          label="Errors"
          active={filter === 'errors'}
          onPress={() => setFilter('errors')}
          color="#FF3B30"
        />
        <FilterButton
          label="PAYMENT"
          active={filter === 'PAYMENT'}
          onPress={() => setFilter('PAYMENT')}
        />
        <FilterButton
          label="STORE"
          active={filter === 'STORE'}
          onPress={() => setFilter('STORE')}
        />
        <FilterButton
          label="SUBSCRIPTION"
          active={filter === 'SUBSCRIPTION'}
          onPress={() => setFilter('SUBSCRIPTION')}
        />
        <FilterButton
          label="API"
          active={filter === 'API'}
          onPress={() => setFilter('API')}
        />
      </ScrollView>

      {/* Logs List */}
      <FlatList
        data={filteredLogs.reverse()}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={styles.logHeader}>
              <Text style={styles.logIcon}>{getLogIcon(item.level)}</Text>
              <View style={styles.logMeta}>
                <Text style={styles.logCategory}>{item.category}</Text>
                <Text style={styles.logTime}>{item.timestamp}</Text>
              </View>
              <Text
                style={[
                  styles.logLevel,
                  { color: getLogColor(item.level) },
                ]}
              >
                {item.level}
              </Text>
            </View>
            <Text style={styles.logMessage}>{item.message}</Text>
            {item.data && (
              <View style={styles.logData}>
                <Text style={styles.logDataText}>
                  {JSON.stringify(item.data, null, 2)}
                </Text>
              </View>
            )}
          </View>
        )}
        style={styles.logsList}
        contentContainerStyle={styles.logsContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="info" size={40} color="#CCC" />
            <Text style={styles.emptyText}>No logs to display</Text>
          </View>
        }
      />

      {/* Footer Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionPrimary]}
          onPress={handleExportLogs}
        >
          <MaterialIcons name="download" size={18} color="white" />
          <Text style={styles.actionButtonText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionDanger]}
          onPress={handleClearLogs}
        >
          <MaterialIcons name="delete" size={18} color="white" />
          <Text style={styles.actionButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/**
 * Stat Box Component
 */
const StatBox = ({ label, value, color }: any) => (
  <View style={[styles.statBox, { borderLeftColor: color }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

/**
 * Filter Button Component
 */
const FilterButton = ({ label, active, onPress, color }: any) => (
  <TouchableOpacity
    style={[
      styles.filterButton,
      active && [styles.filterButtonActive, { backgroundColor: color || '#0A84FF' }],
    ]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.filterButtonText,
        active && styles.filterButtonTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 999,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1A1A1A',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 50,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterButtonActive: {
    borderWidth: 0,
  },
  filterButtonText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  logsList: {
    flex: 1,
  },
  logsContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#444',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  logIcon: {
    fontSize: 16,
  },
  logMeta: {
    flex: 1,
  },
  logCategory: {
    color: '#0A84FF',
    fontWeight: '700',
    fontSize: 12,
  },
  logTime: {
    color: '#666',
    fontSize: 10,
    marginTop: 2,
  },
  logLevel: {
    fontSize: 11,
    fontWeight: '600',
  },
  logMessage: {
    color: '#DDD',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 26,
    marginBottom: 8,
  },
  logData: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    padding: 8,
    marginLeft: 26,
    marginTop: 8,
  },
  logDataText: {
    color: '#AAA',
    fontSize: 10,
    fontFamily: 'Menlo',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#222',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  actionPrimary: {
    backgroundColor: '#0A84FF',
  },
  actionDanger: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default DebugConsole;

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAppTheme } from '../../theme/Theme';
import { useNetWorthGraphStore } from '../../store/netWorthGraphStore';

const screenWidth = Dimensions.get('window').width;

export default function NetWorthScreen() {
  const { colors } = useAppTheme();
  const store = useNetWorthGraphStore();

  useEffect(() => {
    store.fetchGraph().catch(() => undefined);
  }, []);

  const graph = store.graph;

  const chart = useMemo(() => {
    const points = graph?.dataPoints ?? [];
    const labels = points.map((p) => {
      const d = new Date(p.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const totals = points.map((p) => p.total);
    return { labels, totals };
  }, [graph]);

  const chartConfig = useMemo(() => ({
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => `rgba(10, 132, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`,
    strokeWidth: 3,
    decimalPlaces: 0,
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.surface },
  }), [colors.surface]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Net Worth</Text>
        <View style={styles.toggle}>
          <ToggleButton
            label="30D"
            active={store.days === 30}
            onPress={() => store.fetchGraph(30)}
            colors={colors}
          />
          <ToggleButton
            label="90D"
            active={store.days === 90}
            onPress={() => store.fetchGraph(90)}
            colors={colors}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={store.isLoading}
            onRefresh={() => store.refresh()}
            tintColor={colors.primary}
          />
        }
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textDim }]}>Current total</Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            ₹{Math.round(graph?.currentTotal ?? 0).toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.cardSub, { color: colors.textDim }]}>
            Trend: {graph?.trend?.direction ?? 'stable'} · {Math.round(graph?.trend?.percentChange ?? 0)}%
          </Text>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {chart.totals.length > 1 ? (
            <LineChart
              data={{
                labels: chart.labels.length > 0 ? chart.labels : ['—'],
                datasets: [{ data: chart.totals.length > 0 ? chart.totals : [0] }],
              }}
              width={screenWidth - 32}
              height={220}
              yAxisLabel="₹"
              chartConfig={chartConfig}
              bezier
              withVerticalLines={false}
              style={styles.chart}
            />
          ) : (
            <Text style={[styles.emptyText, { color: colors.textDim }]}>
              Add wallets/investments and open Net Worth daily to build your graph.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ToggleButton({ label, active, onPress, colors }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.toggleBtn,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.85}
    >
      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: '700', fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 28, fontWeight: '800' },
  toggle: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardLabel: { fontSize: 12, fontWeight: '700' },
  cardValue: { fontSize: 32, fontWeight: '900', marginTop: 8 },
  cardSub: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  chart: { borderRadius: 12 },
  emptyText: { paddingVertical: 18, paddingHorizontal: 6, fontWeight: '600' },
});


import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { PieChart } from 'react-native-chart-kit';
import { CategoryTotal } from '../../utils/analytics';

interface CategoryPieChartProps {
  data: CategoryTotal[];
}

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  strokeWidth: 2,
};

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No spending data to categorize yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={ZoomIn.duration(400)} style={styles.container}>
      <Text style={styles.title}>Spending by Category</Text>
      <View style={styles.chartContainer}>
        <PieChart
          data={data.map(item => ({
            name: item.name,
            population: item.total,
            color: item.color,
            legendFontColor: '#000000',
            legendFontSize: 13
          }))}
          width={screenWidth - 48} // Padding compensation
          height={200}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"0"}
          absolute // Shows actual values instead of percentages
          hasLegend={true}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: 'transparent',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000000',
  },
  chartContainer: {
    alignItems: 'center',
  }
});

import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { DailySpending } from '../../utils/analytics';

interface SpendingTrendChartProps {
  data: DailySpending[];
}

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // Apple blue
  labelColor: (opacity = 1) => `rgba(142, 142, 147, ${opacity})`, // iOS gray
  strokeWidth: 3,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#ffffff"
  }
};

export default function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Formatting dates to shorter variants like "Mon", "Tue" or "04/11" 
  const labels = data.map(item => {
    const d = new Date(item.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const amounts = data.map(item => item.total);

  return (
    <Animated.View entering={FadeInRight.duration(500)} style={styles.container}>
      <Text style={styles.title}>Spending Trend (7 Days)</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [
              {
                data: amounts.length > 0 ? amounts : [0]
              }
            ]
          }}
          width={screenWidth - 48}
          height={200}
          yAxisLabel="₹" 
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withVerticalLines={false}
          withHorizontalLines={true}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000000',
  },
  chartContainer: {
    alignItems: 'center',
    marginLeft: -20, // Adjusting for chart-kit default padding
  },
  chart: {
    borderRadius: 8,
  }
});

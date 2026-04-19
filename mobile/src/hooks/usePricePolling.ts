import { useEffect, useRef } from 'react';
import { useInvestmentStore } from '../store/investmentStore';

const POLL_INTERVAL = 10000; // 10 seconds

export const usePricePolling = (enabled = true) => {
  const { investments, fetchInvestments, updatePriceHistory } = useInvestmentStore();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || investments.length === 0) {
      return;
    }

    // Initial fetch
    const pollPrices = async () => {
      const now = Date.now();
      
      // Avoid polling too frequently
      if (now - lastPollRef.current < POLL_INTERVAL) {
        return;
      }

      lastPollRef.current = now;

      try {
        // Fetch updated investments with live prices
        await fetchInvestments();
        
        // Update price history for each investment
        investments.forEach((inv) => {
          updatePriceHistory(inv.id, inv.currentPrice);
        });
      } catch (error) {
        console.error('Price polling error:', error);
      }
    };

    // Poll immediately and then every 10 seconds
    pollPrices();
    pollIntervalRef.current = setInterval(pollPrices, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, investments.length, fetchInvestments, updatePriceHistory]);

  return {
    isPolling: pollIntervalRef.current !== null,
  };
};

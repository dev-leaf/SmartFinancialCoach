import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/Theme';
import { httpClient } from '../../services/api/httpClient';
import { useHealthScoreStore } from '../../store/healthScoreStore';

type Step = 'income' | 'goal' | 'habits' | 'score';

export default function OnboardingFlowScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const { fetchHealthScore, healthScore } = useHealthScoreStore();

  const [step, setStep] = useState<Step>('income');
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [spendingStyle, setSpendingStyle] = useState<'planner' | 'balanced' | 'impulsive'>('balanced');
  const [riskTolerance, setRiskTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSaving, setIsSaving] = useState(false);

  const canNext = useMemo(() => {
    if (step === 'income') return Number(income) > 0;
    if (step === 'goal') return Number(goal) > 0;
    return true;
  }, [step, income, goal]);

  const next = async () => {
    if (step === 'income') return setStep('goal');
    if (step === 'goal') return setStep('habits');
    if (step === 'habits') {
      setIsSaving(true);
      try {
        await httpClient.post('/onboarding', {
          monthlyIncome: Number(income),
          savingsGoalInr: Number(goal),
          spendingStyle,
          riskTolerance,
          wantsDailyDigest: true,
          currency: 'INR',
        });
        await fetchHealthScore();
        setStep('score');
      } finally {
        setIsSaving(false);
      }
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        {step === 'income' && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Monthly income</Text>
            <Text style={[styles.sub, { color: colors.textDim }]}>Used to calculate savings rate accurately.</Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              keyboardType="number-pad"
              placeholder="e.g. 80000"
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          </>
        )}

        {step === 'goal' && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Savings goal</Text>
            <Text style={[styles.sub, { color: colors.textDim }]}>Set a monthly savings target to personalize coaching.</Text>
            <TextInput
              value={goal}
              onChangeText={setGoal}
              keyboardType="number-pad"
              placeholder="e.g. 20000"
              placeholderTextColor={colors.textDim}
              style={[styles.input, { color: colors.text, borderColor: colors.border }]}
            />
          </>
        )}

        {step === 'habits' && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Spending habits</Text>
            <Text style={[styles.sub, { color: colors.textDim }]}>Quickly tune your alerts and coaching tone.</Text>

            <Text style={[styles.label, { color: colors.text }]}>Spending style</Text>
            <PillRow
              values={['planner', 'balanced', 'impulsive']}
              selected={spendingStyle}
              onSelect={setSpendingStyle as any}
            />

            <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>Risk tolerance</Text>
            <PillRow
              values={['low', 'medium', 'high']}
              selected={riskTolerance}
              onSelect={setRiskTolerance as any}
            />
          </>
        )}

        {step === 'score' && (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Your starting health score</Text>
            <Text style={[styles.sub, { color: colors.textDim }]}>This will improve as you track expenses and follow insights.</Text>
            <View style={[styles.scoreBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Text style={[styles.score, { color: colors.text }]}>{healthScore?.overallScore ?? '—'}</Text>
              <Text style={[styles.scoreSub, { color: colors.textDim }]}>/ 100</Text>
            </View>
          </>
        )}

        <TouchableOpacity
          disabled={!canNext || isSaving}
          onPress={next}
          style={[styles.cta, { backgroundColor: colors.primary, opacity: !canNext || isSaving ? 0.6 : 1 }]}
        >
          <Text style={styles.ctaText}>
            {step === 'score' ? 'Finish' : isSaving ? 'Saving…' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function PillRow({ values, selected, onSelect }: { values: string[]; selected: string; onSelect?: (value: string) => void }) {
  const handleSelect = (value: string) => {
    if (onSelect) {
      onSelect(value);
    }
  };

  return (
    <View style={styles.pills}>
      {values.map((v: string) => (
        <TouchableOpacity key={v} style={[styles.pill, selected === v && styles.pillActive]} onPress={() => handleSelect(v)}>
          <Text style={[styles.pillText, selected === v && styles.pillTextActive]}>{v}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { borderRadius: 18, padding: 18 },
  title: { fontSize: 22, fontWeight: '900' },
  sub: { marginTop: 8, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  input: { marginTop: 14, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontWeight: '700' },
  label: { marginTop: 10, fontSize: 12, fontWeight: '800' },
  pills: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  pill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#2c2c2e' },
  pillActive: { backgroundColor: '#0a84ff', borderColor: '#0a84ff' },
  pillText: { color: '#8e8e93', fontWeight: '800', textTransform: 'capitalize' },
  pillTextActive: { color: '#fff' },
  scoreBox: { marginTop: 16, borderWidth: 1, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  score: { fontSize: 42, fontWeight: '900' },
  scoreSub: { fontSize: 14, fontWeight: '700' },
  cta: { marginTop: 18, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '900' },
});


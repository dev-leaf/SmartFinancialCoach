import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAppTheme } from '../../theme/Theme';
import { useHealthScoreStore } from '../../store/healthScoreStore';
import { httpClient } from '../../services/api/httpClient';

export function ShareAndInviteCard() {
  const { colors } = useAppTheme();
  const { healthScore } = useHealthScoreStore();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    httpClient.get('/referrals/code').then((res: any) => setCode(res.data?.code ?? null)).catch(() => undefined);
  }, []);

  const shareScore = async () => {
    const score = healthScore?.overallScore ?? null;
    const msg = score != null
      ? `My SmartFinancialCoach health score is ${score}/100. Want yours?`
      : `I’m using SmartFinancialCoach to track expenses and improve my finances.`;
    await Share.share({ message: msg });
  };

  const invite = async () => {
    const msg = code
      ? `Join SmartFinancialCoach with my invite code ${code} and unlock Premium for 7 days.`
      : `Join SmartFinancialCoach and improve your finances.`;
    await Share.share({ message: msg });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Share & Invite</Text>
      <Text style={[styles.sub, { color: colors.textDim }]}>
        Share your score, or invite friends to unlock Premium for 7 days.
      </Text>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, { borderColor: colors.border }]} onPress={shareScore}>
          <MaterialIcons name="share" size={18} color={colors.text} />
          <Text style={[styles.btnText, { color: colors.text }]}>Share score</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, { borderColor: colors.border }]} onPress={invite}>
          <MaterialIcons name="person-add" size={18} color={colors.text} />
          <Text style={[styles.btnText, { color: colors.text }]}>Invite</Text>
        </TouchableOpacity>
      </View>

      {code && (
        <Text style={[styles.code, { color: colors.textDim }]}>Invite code: {code}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '900' },
  sub: { fontSize: 12, fontWeight: '600', marginTop: 6, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnText: { fontWeight: '800', fontSize: 12 },
  code: { marginTop: 10, fontSize: 12, fontWeight: '700' },
});


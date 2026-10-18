import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { SHIELD_RECOVERY_NIGHTS } from '../lib/streak';
import { colors, tabular, type } from '../theme';

/** מגן "לא פעמיים": פעיל, או שבור עם התקדמות החזרה (x/7). */
export function ShieldBadge({ active, recovery, size = 44 }: { active: boolean; recovery: number; size?: number }) {
  return (
    <View
      style={{ alignItems: 'center', gap: 4, minWidth: 84 }}
      accessibilityLabel={active ? 'מגן לא פעמיים פעיל' : `המגן שבור, ${recovery} מתוך ${SHIELD_RECOVERY_NIGHTS} ערבים להחזרה`}
    >
      <Ionicons name={active ? 'shield-checkmark' : 'shield-outline'} size={size} color={active ? colors.primary : colors.warning} />
      <Text style={[type.caption, { textAlign: 'center', color: active ? colors.primary : colors.warning }]}>{active ? 'מגן פעיל' : 'המגן שבור'}</Text>
      {!active ? (
        <Text style={[type.caption, tabular, { textAlign: 'center' }]}>
          חוזר בעוד {SHIELD_RECOVERY_NIGHTS - recovery} ({recovery}/{SHIELD_RECOVERY_NIGHTS})
        </Text>
      ) : null}
    </View>
  );
}

import { Manrope_400Regular, Manrope_500Medium, Manrope_700Bold, useFonts as useManrope } from '@expo-google-fonts/manrope';
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold, useFonts as useSpaceGrotesk } from '@expo-google-fonts/space-grotesk';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { neutral } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // As duas famílias da marca. Fonte errada muda a geometria inteira da tela.
  const [grotesk] = useSpaceGrotesk({ SpaceGrotesk_500Medium, SpaceGrotesk_700Bold });
  const [manrope] = useManrope({ Manrope_400Regular, Manrope_500Medium, Manrope_700Bold });
  const pronto = grotesk && manrope;

  useEffect(() => {
    if (pronto) SplashScreen.hideAsync();
  }, [pronto]);

  if (!pronto) return null;

  return (
    <>
      {/* Tema claro está fora do MVP: academia é ambiente escuro com o brilho no máximo. */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: neutral.n1000 },
        }}
      />
    </>
  );
}

import React from 'react';
import { config } from './nb.config';
import { StyledProvider } from '@gluestack-style/react';
import { View } from 'react-native';
import * as Outfit from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
const { __metadata__, useFonts: a, ...outfit } = Outfit;
export const Wrapper = ({ children, colorMode, ...props }: any) => {
  const [loaded] = useFonts({
    ...outfit,
  });
  return loaded ? (
    <StyledProvider config={config} colorMode={colorMode} {...props}>
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        {children}
      </View>
    </StyledProvider>
  ) : (
    <View></View>
  );
};

export default Wrapper;

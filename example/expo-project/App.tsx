import React from 'react';
import { config } from './gluestack-ui.config';

import { StyledProvider, styled, get } from '@gluestack-style/react';
import { View, Pressable, Text } from 'react-native';

const StyledColorMode = styled(
  View,
  {
    w: 100,
    h: 100,
    bg: '$red500',

    _dark: {
      bg: '$info600',
    },
  },
  {}
);

export const Wrapper = () => {
  const [currectColorMode, setCurrentColorMode] = React.useState(get());

  return (
    <StyledProvider config={config} colorMode={currectColorMode}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pressable
          style={{
            backgroundColor: 'gray',
            padding: 12,
            marginBottom: 12,
          }}
          onPress={() => {
            // set(get() === 'dark' ? 'light' : 'dark');
            setCurrentColorMode(currectColorMode === 'dark' ? 'light' : 'dark');
          }}
        >
          <Text style={{ color: 'white' }}>
            Toggle {currectColorMode === 'dark' ? 'light' : 'dark'}
          </Text>
        </Pressable>
        <StyledColorMode />
      </View>
    </StyledProvider>
  );
};

export default Wrapper;

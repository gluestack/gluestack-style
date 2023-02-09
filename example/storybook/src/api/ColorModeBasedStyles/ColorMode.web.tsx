import React, { memo } from 'react';
import { View, Pressable, Text } from 'react-native';
import { styled } from '@dank-style/react';
import { Wrapper } from '../../components/Wrapper';
import { get } from '@dank-style/color-mode';
import { AppProvider, Button } from '@gluestack/design-system';

const StyledColorMode = memo(
  styled(
    View,
    {
      'w': 100,
      'h': 100,
      'bg': '$blue500',
      ':hover': {
        // bg: '$blue500',
        _dark: {
          bg: '$green500',
        },
      },
      '_dark': {
        'bg': '$yellow500',
        ':hover': {
          bg: '$green500',
        },
      },
    },
    {}
  )
);

export function ColorMode({ ...args }) {
  const [currentColorMode, setCurrentColorMode] = React.useState(get());

  return (
    <AppProvider colorMode={currentColorMode}>
      <Pressable
        onPress={() => {
          setCurrentColorMode(currentColorMode === 'dark' ? 'light' : 'dark');
        }}
      >
        <Text>Toggle {currentColorMode === 'dark' ? 'light' : 'dark'}</Text>
      </Pressable>
      <AppProvider>
        <Wrapper>
          <StyledColorMode {...args} states={{ hover: true }} />
        </Wrapper>
        <Button sx={{ _dark: { bg: '$red300' } }} />
      </AppProvider>
    </AppProvider>
  );
}

export default ColorMode;

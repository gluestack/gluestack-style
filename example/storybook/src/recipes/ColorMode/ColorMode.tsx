/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { styled } from 'dank-style';
import { Wrapper } from '../../components/Wrapper';
import { get, set } from '@gluestack/color-mode';

const StyledColorMode = styled(
  View,
  {
    baseStyle: {
      style: {
        w: 100,
        h: 100,
        bg: '$red500',
      },
      colorMode: {
        dark: {
          style: {
            bg: '$info600',
          },
        },
      },
    },
  },
  {}
);

export function ColorMode({ ...args }) {
  const [currectColorMode, setCurrentColorMode] = React.useState(get());

  return (
    <Wrapper>
      <Pressable
        style={{
          backgroundColor: 'gray',
          padding: 12,
          marginBottom: 12,
        }}
        onPress={() => {
          set(get() === 'dark' ? 'light' : 'dark');
          setCurrentColorMode(get());
        }}
      >
        <Text style={{ color: 'white' }}>
          Toggle {currectColorMode === 'dark' ? 'light' : 'dark'}
        </Text>
      </Pressable>
      <StyledColorMode />
    </Wrapper>
  );
}

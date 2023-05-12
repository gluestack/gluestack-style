import React, { memo, useEffect, useState } from 'react';
import { AnimationResolver } from '@dank-style/animation-plugin';

import {
  createStyled,
  styled,
  useColorMode,
  useColorModeValue,
  useTokens,
} from '@dank-style/react';
import { Wrapper } from '../../components/Wrapper';
import { Motion } from '@legendapp/motion';
import { Pressable, View } from 'react-native';

const StyledView = styled(Pressable, {
  h: 20,
  w: 20,
  bg: '$red800',
  // ':hover': {
  //   bg: '$green900',
  // },
  // ':active': {
  //   bg: '$amber500',
  // },
  _dark: {
    bg: '$yellow300',
  },
});

const Example = () => {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const tokens = useTokens('colors', ['$red500']);

  return (
    <StyledView
      states={{
        hover,
        active: pressed,
      }}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    />
  );
};

export function PropsPassing() {
  const [colorMode, setColorMode] = useState('light');
  const { toggleColorMode } = useColorMode();

  return (
    <Wrapper colorMode={colorMode}>
      <Example />
      <Pressable onPress={() => toggleColorMode()}>Click me</Pressable>
    </Wrapper>
  );
}

export default PropsPassing;

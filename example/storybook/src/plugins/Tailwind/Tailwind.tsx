//@ts-nocheck
import React from 'react';
import {
  createStyled,
  FontResolver,
  Tailwind as TWPlugin,
} from '@dank-style/react';
import { Wrapper } from '../../components/Wrapper';
import { Text } from 'react-native';

const styledFonts = createStyled([new TWPlugin({})]);

const StyledText = styledFonts(Text, {
  className: 'bg-red-500 h-10 w-10',
});

export function Tailwind() {
  return (
    <Wrapper>
      <StyledText>Hello world</StyledText>
    </Wrapper>
  );
}

export default Tailwind;

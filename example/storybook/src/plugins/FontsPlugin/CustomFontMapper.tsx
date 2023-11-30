import React from 'react';
import { FontResolver, styled } from '@gluestack-style/react';
import { Wrapper } from '../../components/Wrapper';
import { Text } from 'react-native';

// const styledFonts = createStyled([new FontResolver()]);

// const StyledText = styled(Text, {
//   fontFamily: 'Nunito Sans',
//   fontWeight: 800,
//   fontStyle: 'normal',
//   fontSize: '$xl',
// });

export function CustomFontMapper() {
  return <Wrapper>{/* <StyledText>Hello world</StyledText> */}</Wrapper>;
}

export default CustomFontMapper;

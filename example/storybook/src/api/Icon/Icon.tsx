import React, { forwardRef } from 'react';

import { styled } from '@dank-style/react';
import { Wrapper } from '../../components/Wrapper';

import { Camera } from 'lucide-react-native';

export type IActionsheetComponentType<A, B, C> = ((props: A) => JSX.Element) & {
  Content: (props: C) => JSX.Element;
  Item: (props: B) => JSX.Element;
};

const StyledIcon = styled(
  Camera,
  {
    // 'bg': '$primary600',
    // 'p': '$3',
    // '_text': {
    //   color: '$white',
    // },
    // ':hover': {
    //   bg: '$primary700',
    // },
  },
  {
    resolveProps: ['color', 'size', 'fill'],
  },
  {
    propertyTokenMap: {
      size: 'space',
      color: 'colors',
      fill: 'colors',
      // strokeWidth: 'strokeWidths',
    },
  }
);

export function Icon({ ...args }: any) {
  return (
    <Wrapper>
      <StyledIcon size={'$12'}>hello</StyledIcon>
      {/* <Camera color="red" size={48} /> */}
    </Wrapper>
  );
}

export default Icon;

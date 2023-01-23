import { Pressable } from 'react-native';
import { styled } from '@dank-style/react';
let Components = [] as any;
for (let i = 0; i < 1; i++) {
  const MyButton5 = styled(
    Pressable,
    {
      'bg': '$red500',
      ':hover': {
        bg: '$amber600',
      },
    },
    {},
    {}
  );
  Components.push(MyButton5);
}
export default Components;

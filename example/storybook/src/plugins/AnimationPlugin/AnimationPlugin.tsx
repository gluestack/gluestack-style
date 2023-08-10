import React from 'react';
import { Wrapper } from '../../components/Wrapper';
import { Motion } from '@legendapp/motion';
// import { MotionLinearGradient as LinearGradient } from '@legendapp/motion/linear-gradient';
// import { MotionSvg as Svg } from '@legendapp/motion/svg';
import { Pressable, View } from 'react-native';
import { styled, ThemeProvider } from '@gluestack-style/react';
// import { MotiView } from 'moti';

const images = [require('./1.png'), require('./2.png'), require('./3.png')];

const Box = styled(View, {});

const StyledMotionImage = styled(Motion.Image, {
  ':animate': {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
});
console.log('xyz', JSON.parse(JSON.stringify(StyledMotionImage)));

export function AnimationPlugin() {
  const [imageIndex, setImageIndex] = React.useState(0);
  const [xPosition, setXPosition] = React.useState(0);

  return (
    <Wrapper>
      {/* <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing' }}
      /> */}
      <ThemeProvider theme="dark">
        <Box
          sx={{
            'position': 'relative',
            'justifyContent': 'center',
            'width': '100%',
            'height': 200,
            '@sm': {
              height: 400,
            },
            'aspectRatio': 1 * 1.4,
          }}
        >
          {/* <StyledMotionImage.AnimatePresence> */}
          <StyledMotionImage
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
            source={{ uri: images[imageIndex] }}
            key={`image-${imageIndex}-${Math.random()}`}
            sx={{
              ':initial': {
                x: xPosition,
                opacity: 0,
              },
              ':exit': {
                zIndex: 0,
                x: -xPosition,
                opacity: 0,
              },
              ':transition': {
                x: { type: 'spring', stiffness: 200, damping: 23 },
              },
            }}
          />
          {/* </StyledMotionImage.AnimatePresence> */}
        </Box>
        <Pressable
          accessibilityRole="button"
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            borderRadius: 30,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            right: 10,
          }}
          onPress={() => {
            setXPosition(1000);
            setImageIndex((prev) => (prev + 1) % images.length);
          }}
        >
          {'‣'}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            borderRadius: 30,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            left: 10,
            transform: [{ scale: -1 }],
          }}
          onPress={() => {
            setXPosition(-1000);
            setImageIndex((prev) => (prev - 1 + images.length) % images.length);
          }}
        >
          {'‣'}
        </Pressable>
      </ThemeProvider>
    </Wrapper>
  );
}

export default AnimationPlugin;

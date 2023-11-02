import React, { useContext, useRef } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { config } from './gluestack-ui.config';
import './styles';
import { styled } from '@gluestack-style/react';
import { StyledProvider } from '@gluestack-style/react';
import { ProfilerComponent } from './Profiler';

const COUNT = 1;

const Box = styled(View, {
  bg: '$red500',
  p: '$20',
});

const RNWContext = React.createContext({
  hello: 'world',
});

const myStyled = (Component: any) => {
  const StyledComp = React.forwardRef((props: any, ref: any) => {
    const ctx = useContext(RNWContext);
    const ref1 = useRef(null);
    const ref17 = useRef(null);
    const ref15 = useRef(null);
    const ref13 = useRef(null);
    const ref2 = useRef(null);
    const ref3 = useRef(null);

    // console.log(ctx, ref1, ref17, ref15, ref13, ref2, ref3);
    // console.log(ctx);

    React.useEffect(() => {
      // console.log('hellooooo 1');
    }, []);

    React.useEffect(() => {
      // console.log('hellooooo 2');
    }, []);
    React.useEffect(() => {
      // console.log('hellooooo 2');
    }, []);
    return <Component {...props} ref={ref} />;
  });

  StyledComp.displayName = 'MYStyledComp';
  return StyledComp;
};

const RNWView = myStyled(View);

const GSBox = () => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <Pressable onPress={() => setShow(!show)} style={styles.button}>
        <Text>gluestack-style</Text>
      </Pressable>
      {show && (
        <ProfilerComponent index={0} testInfo="GS">
          {new Array(COUNT).fill(0).map((_, index) => (
            <Box key={index} />
          ))}
        </ProfilerComponent>
      )}
    </>
  );
};
const RNWrapperBox = () => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <Pressable onPress={() => setShow(!show)} style={styles.button}>
        <Text>RNW Wrapper</Text>
      </Pressable>
      {show && (
        <ProfilerComponent index={2} testInfo="RNW Wrapper">
          {new Array(COUNT).fill(0).map((_, index) => (
            <RNWView key={index} style={styles.box} />
          ))}
        </ProfilerComponent>
      )}
    </>
  );
};
const RNWBox = () => {
  const [show, setShow] = React.useState(false);
  return (
    <>
      <Pressable onPress={() => setShow(!show)} style={styles.button}>
        <Text>RNW</Text>
      </Pressable>
      {show && (
        <ProfilerComponent index={1} testInfo="RNW">
          {new Array(COUNT).fill(0).map((_, index) => (
            <View key={index} style={styles.box} />
          ))}
        </ProfilerComponent>
      )}
    </>
  );
};

export default function App() {
  return (
    <StyledProvider config={config.theme} colorMode={'dark'}>
      <View style={styles.container}>
        <GSBox />
        <RNWrapperBox />
        <RNWBox />
        <Pressable
          onPress={() => {
            console.getPerformanceMap();
          }}
          style={styles.button}
        >
          <Text>Get performance</Text>
        </Pressable>
      </View>
    </StyledProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  box: {
    backgroundColor: 'yellow',
    padding: 80,
  },
  button: {
    height: 40,
    width: 160,
    backgroundColor: 'blue',
    margin: 8,
  },
});

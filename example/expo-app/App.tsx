// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput } from 'react-native';

// import { StyledProvider, styled } from '@dank-style/react';
import { StyledProvider, styled } from '@dank-style/react';
import { config } from './gluestack-ui.config';

const StyledView = styled(
  View,
  {
    p: '$2',
    h: 300,
    w: 300,
    outlineColor: '$primary600',
    variants: {
      variant: {
        solid: {
          'bg': '$red500',
          ':hover': {
            bg: '$yellow500',
          },
        },
      },
    },
  },
  { ancestorStyle: ['_input'] }
);

// console.log(StyledView, 'styled view here');

// console.timeEnd('make view');

// const StyledText = styled(Text, { color: '$red400' }, {});
export default function App() {
  return (
    <StyledProvider config={config.theme}>
      <View style={styles.container}>
        <StyledView
          variant="solid"
          bg="$red400"
          sx={{
            ':hover': {
              bg: '$amber900',
            },
          }}
          states={{
            hover: true,
          }}
        />
      </View>
    </StyledProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

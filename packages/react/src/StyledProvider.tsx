import { get, onChange, set } from './core/colorMode';
import * as React from 'react';
import { Platform } from 'react-native';
import { propertyTokenMap } from './propertyTokenMap';
import type { COLORMODES } from './types';
import { platformSpecificSpaceUnits } from './utils';
import { createGlobalStylesWeb } from './createGlobalStylesWeb';

type Config = any;

export const defaultConfig: {
  config: Config;
  colorMode: COLORMODES;
  globalGroupElementsStates: {};
} = {
  config: {},
  colorMode: 'light',
  globalGroupElementsStates: {},
};

// interface ConfigContextData {
//   config: Config;
//   setConfig: (config: Config) => void;
// }

const defaultContextData: Config = defaultConfig;

const StyledContext = React.createContext<Config>(defaultContextData);

// type IContext = {
//   config: Config;
//   colorMode?: COLORMODES;
// };
export const StyledProvider: React.FC<{
  config: Config;
  colorMode?: COLORMODES;
  children?: React.ReactNode;
  globalStyles?: any;
}> = ({ config, colorMode, children, globalStyles }) => {
  const [globalGroupElementsStates, setGlobalGroupElementsStates] =
    React.useState({});

  const currentConfig = React.useMemo(() => {
    //TODO: Add this later
    return platformSpecificSpaceUnits(config, Platform.OS);
    // return config;
  }, [config]);

  if (Platform.OS === 'web' && globalStyles) {
    const globalStyleInjector = createGlobalStylesWeb(globalStyles);
    globalStyleInjector({ ...currentConfig, propertyTokenMap });
  }

  const currentColorMode = React.useMemo(() => {
    return colorMode;
  }, [colorMode]);

  React.useEffect(() => {
    if (currentColorMode) {
      set(currentColorMode === 'dark' ? 'dark' : 'light');
      onChange((currentColor: string) => {
        // only for web
        if (Platform.OS === 'web') {
          if (currentColor === 'dark') {
            document.documentElement.classList.remove(`gs-light`);
          } else {
            document.documentElement.classList.remove(`gs-dark`);
          }
          document.documentElement.classList.add(`gs-${currentColor}`);
        }
      });
    }

    if (Platform.OS === 'web') {
      document.documentElement.classList.add(`gs-${get()}`);
    }
  }, [currentColorMode]);

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.classList.add(`gs`);
    }
  }, []);

  // Set colormode server side

  if (Platform.OS === 'web' && currentColorMode) {
    set(currentColorMode === 'dark' ? 'dark' : 'light');
  }

  let contextValue;
  if (Platform.OS === 'web') {
    // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextValue = React.useMemo(() => {
      return { config: currentConfig };
    }, [currentConfig]);
  } else {
    // This if statement technically breaks the rules of hooks, but is safe
    // because the condition never changes after mounting.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextValue = React.useMemo(() => {
      return { config: currentConfig, colorMode: currentColorMode };
    }, [currentConfig, currentColorMode]);
  }

  const updateGlobalGroupElementsStates = (
    updatedGlobalGroupElmentsStates: any
  ) => {
    setGlobalGroupElementsStates(updatedGlobalGroupElmentsStates);
  };

  return (
    <StyledContext.Provider
      value={{
        ...contextValue,
        globalGroupElementsStates,
        updateGlobalGroupElementsStates,
      }}
    >
      {children}
    </StyledContext.Provider>
  );
};

export const useStyled = () => React.useContext(StyledContext);

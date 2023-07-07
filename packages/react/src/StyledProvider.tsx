import { get, onChange, set } from './core/colorMode';
import * as React from 'react';
import { Platform, View } from 'react-native';
import { propertyTokenMap } from './propertyTokenMap';
import type { COLORMODES } from './types';
import { platformSpecificSpaceUnits } from './utils';
import { createGlobalStylesWeb } from './createGlobalStylesWeb';
import { createGlobalStyles } from './createGlobalStyles';
type Config = any;
let colorModeSet = false;

export const defaultConfig: { config: Config; colorMode: COLORMODES } = {
  config: {},
  colorMode: 'light',
};

const defaultContextData: Config = defaultConfig;
const StyledContext = React.createContext<Config>(defaultContextData);

const setCurrentColorMode = (currentColorMode: string) => {
  if (currentColorMode) {
    set(currentColorMode === 'dark' ? 'dark' : 'light');
    colorModeSet = true;
  }
};
export const StyledProvider: React.FC<{
  config: Config;
  colorMode?: COLORMODES;
  children?: React.ReactNode;
  globalStyles?: any;
  experimentalLocalColorMode: boolean;
}> = ({
  config,
  colorMode,
  children,
  globalStyles,
  experimentalLocalColorMode = false,
}) => {
  const wrapperRef = React.useRef(null);
  const currentConfig = React.useMemo(() => {
    //TODO: Add this later
    return platformSpecificSpaceUnits(config, Platform.OS);
  }, [config]);

  if (Platform.OS === 'web' && globalStyles) {
    const globalStyleInjector = createGlobalStylesWeb(globalStyles);
    globalStyleInjector({ ...currentConfig, propertyTokenMap });
  }

  const currentColorMode = React.useMemo(() => {
    if (experimentalLocalColorMode) {
      return colorMode as 'light' | 'dark';
    }
    return colorMode ?? get() ?? 'light';
  }, [colorMode, experimentalLocalColorMode]);

  React.useEffect(() => {
    let domElement = document.documentElement;
    if (experimentalLocalColorMode) {
      domElement = wrapperRef.current;
    }
    if (Platform.OS === 'web') {
      domElement.classList.add(`gs`);
    }

    onChange((currentColor: string) => {
      // only for web
      if (Platform.OS === 'web') {
        if (currentColor === 'dark') {
          domElement.classList.remove(`gs-light`);
        } else {
          domElement.classList.remove(`gs-dark`);
        }
        domElement.classList.add(`gs-${currentColor}`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setCurrentColorMode(currentColorMode);
  }, [currentColorMode]);

  // Set colormode for the first time
  if (!colorModeSet) {
    setCurrentColorMode(currentColorMode);
  }

  const globalStyleMap =
    config.globalStyle && createGlobalStyles(config.globalStyle);

  const contextValue = React.useMemo(() => {
    return { config: currentConfig, globalStyle: globalStyleMap };
  }, [currentConfig, globalStyleMap]);

  if (experimentalLocalColorMode) {
    return (
      <View ref={wrapperRef} style={{ height: 500, width: 500 }}>
        <StyledContext.Provider value={contextValue}>
          {children}
        </StyledContext.Provider>
      </View>
    );
  } else {
    return (
      <StyledContext.Provider value={contextValue}>
        {children}
      </StyledContext.Provider>
    );
  }
};

export const useStyled = () => React.useContext(StyledContext);

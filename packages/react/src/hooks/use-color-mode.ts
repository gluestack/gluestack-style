import React from 'react';
import { get, set } from '../core';

const useColorMode = () => {
  const [colorMode, setColorMode] = React.useState(get());

  const toggleColorMode = () => {
    set(colorMode === 'dark' ? 'light' : 'dark');
    setColorMode(colorMode === 'dark' ? 'light' : 'dark');
  };

  return {
    colorMode,
    toggleColorMode,
  };
};

export default useColorMode;

import React from 'react';
import { get, onChange } from '../core';

const useColorModeValue = () => {
  const [colorMode, setColorMode] = React.useState(get());

  React.useEffect(() => {
    onChange((currentColor: string) => {
      setColorMode(currentColor);
    });
  }, [colorMode]);

  return colorMode;
};

export default useColorModeValue;

import * as React from 'react';

type Config = any;

export const defaultConfig: {} = {};

const ThemeContext = React.createContext<Config>({});

export const ThemeProvider: React.FC<{
  theme: string;
  children?: React.ReactNode;
}> = ({ theme, children }) => {
  const contextValue = React.useMemo(() => {
    return { theme: theme };
  }, [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useActiveTheme = () => React.useContext(ThemeContext);

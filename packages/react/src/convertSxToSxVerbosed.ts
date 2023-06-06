import { getObjectParentProperty, setObjectKeyValue } from './core/utils';

const STATE = 'state';
const STYLE = 'style';
const PROPS = 'props';
const DESCENDANTS = 'descendants';

// ------------------------------------------- Reserved keys -------------------------------------------
const reservedKeys: any = {
  state: {
    ':indeterminate': 'indeterminate',
    ':checked': 'checked',
    ':readOnly': 'readOnly',
    ':required': 'required',
    ':invalid': 'invalid',
    ':focus': 'focus',
    ':focusVisible': 'focusVisible',
    ':hover': 'hover',
    ':pressed': 'pressed',
    ':active': 'active',
    ':loading': 'loading',
    ':disabled': 'disabled',
  },
  colorMode: {
    _light: 'light',
    _dark: 'dark',
  },
  platform: {
    _web: 'web',
    _ios: 'ios',
    _android: 'android',
  },
};

// ------------------------------------------- Responsive props resolution -------------------------------------------
const resolveResponsiveProps = (
  sxVerbosed: any,
  breakpoint: any,
  path: any,
  prop: any,
  responsiveStyle: any
) => {
  const sxResolvedResponsiveProp = setObjectKeyValue(
    {},
    path,
    responsiveStyle[prop]
  );

  if (sxVerbosed.queries) {
    const existingBeakpointIndex = sxVerbosed?.queries?.findIndex(
      (data: any) => data.condition === breakpoint
    );

    if (existingBeakpointIndex !== -1) {
      setObjectKeyValue(
        sxVerbosed.queries[existingBeakpointIndex].value,
        path,
        responsiveStyle[prop]
      );
    } else {
      sxVerbosed?.queries?.push({
        condition: breakpoint,
        value: sxResolvedResponsiveProp,
      });
    }
  } else {
    sxVerbosed.queries = [];
    sxVerbosed?.queries?.push({
      condition: breakpoint,
      value: sxResolvedResponsiveProp,
    });
  }
};

// ------------------------------------------- sx to sx verbosed resolution -------------------------------------------

export function resolveStyledPropsRecursively(
  theme: any = {},
  path: any = [],
  sxVerbosed: any = {},
  breakpoint: any = ''
) {
  const themeKeys = Object.keys(theme);

  themeKeys?.forEach((prop) => {
    if (reservedKeys.state[prop]) {
      path.push(STATE, prop.slice(1));
      resolveStyledPropsRecursively(theme[prop], path, sxVerbosed, breakpoint);
      path.pop();
      path.pop();
    } else if (prop?.startsWith('_')) {
      const parentProperty = getObjectParentProperty(reservedKeys, prop);

      if (parentProperty) {
        path.push(parentProperty, prop.slice(1));
      } else {
        path.push(DESCENDANTS, prop);
      }

      resolveStyledPropsRecursively(theme[prop], path, sxVerbosed, breakpoint);

      path.pop();
      path.pop();
    } else if (prop?.startsWith('@')) {
      const breakpointValue = `$${prop.slice(1)}`;
      resolveStyledPropsRecursively(
        theme[prop],
        path,
        sxVerbosed,
        breakpointValue
      );
    } else if (prop === 'props') {
      const propValue = theme[prop];

      path.push(PROPS);

      setObjectKeyValue(sxVerbosed, path, propValue);

      path.pop();
    } else {
      const propValue = theme[prop];
      path.push(STYLE, prop);

      if (breakpoint) {
        resolveResponsiveProps(sxVerbosed, breakpoint, path, prop, theme);
      } else {
        setObjectKeyValue(sxVerbosed, path, propValue);
      }
      path.pop();
      path.pop();
    }
  });

  //if (theme.props) console.log(sxVerbosed);

  return sxVerbosed;
}

// ------------------------------------------- Variant & Size resolution -------------------------------------------

function resolveVariantSize(theme: any) {
  if (!theme) return {};

  const themeKey = Object?.keys(theme);
  const verbosedVariantAndSize = {};

  themeKey?.map((prop) => {
    const sxVerbosedConvertedProps = resolveStyledPropsRecursively(theme[prop]);
    setObjectKeyValue(verbosedVariantAndSize, [prop], sxVerbosedConvertedProps);
  });

  return verbosedVariantAndSize;
}

// ------------------------------------------- sx to verbosed final props -------------------------------------------

export function convertStyledToStyledVerbosed(theme: any) {
  const {
    variants = {},
    compoundVariants = [],
    defaultProps = {},
    ...restTheme
  } = theme;

  const verbosedStyledTheme: any = {
    baseStyle: {},
    variants: {},
    compoundVariants: [],
  };

  const sxConvertedBaseStyle = resolveStyledPropsRecursively(restTheme);
  setObjectKeyValue(verbosedStyledTheme, 'baseStyle', sxConvertedBaseStyle);

  Object.keys(variants).forEach((variant) => {
    const variantType = variants[variant];
    const sxConvertedVariant = resolveVariantSize(variantType);

    setObjectKeyValue(
      verbosedStyledTheme.variants,
      variant,
      sxConvertedVariant
    );
  });

  compoundVariants.forEach((compoundVariant: any) => {
    const sxConvertedCompoundVariantValue = resolveStyledPropsRecursively(
      compoundVariant.value
    );

    const sxConvertedCompoundVariant = {
      ...compoundVariant,
      value: sxConvertedCompoundVariantValue,
    };
    verbosedStyledTheme.compoundVariants.push(sxConvertedCompoundVariant);
  });

  if (defaultProps) {
    if (verbosedStyledTheme.baseStyle.props) {
      verbosedStyledTheme.baseStyle.props = {
        ...verbosedStyledTheme.baseStyle.props,
        ...defaultProps,
      };
    } else {
      verbosedStyledTheme.baseStyle.props = {
        ...defaultProps,
      };
    }
  }

  /*

  // Removing the feature 

  if (restTheme.defaultProps) {
    verbosedStyledTheme.props = restTheme.defaultProps || {};
  } else if (restTheme.props) {
    verbosedStyledTheme.props = restTheme.props || {};
  }
*/

  return verbosedStyledTheme;
}

export function convertSxToSxVerbosed(sx: any) {
  const sxVerboseTheme = resolveStyledPropsRecursively(sx);
  return sxVerboseTheme;
}

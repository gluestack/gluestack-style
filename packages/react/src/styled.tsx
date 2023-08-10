/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import React, {
  // JSXElementConstructor,
  // Component,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  ConfigType,
  OrderedSXResolved,
  // Styled,
  StyleIds,
  // DefaultAndState,
  ComponentProps,
  UtilityProps,
  IVerbosedTheme,
  ITheme,
  ExtendedConfigType,
} from './types';
import {
  deepMerge,
  // deepMergeArray,
  getResolvedTokenValueFromConfig,
  deepMergeObjects,
  resolveStringToken,
  shallowMerge,
} from './utils';
import { convertUtilityPropsToSX } from './core/convert-utility-to-sx';
import { useStyled } from './StyledProvider';
import { propertyTokenMap } from './propertyTokenMap';
import { Platform, View } from 'react-native';
import { INTERNAL_updateCSSStyleInOrderedResolved } from './updateCSSStyleInOrderedResolved';
import { generateStylePropsFromCSSIds } from './generateStylePropsFromCSSIds';
import { getInstalledPlugins } from './createConfig';
import { useActiveTheme } from './ThemeProvider';
import { get, onChange } from './core/colorMode';
import {
  getComponentResolvedBaseStyle,
  getComponentResolvedVariantStyle,
  getDescendantResolvedBaseStyle,
  getDescendantResolvedVariantStyle,
} from './resolver/getComponentStyle';
import { styledResolvedToOrderedSXResolved } from './resolver/orderedResolved';
import { styledToStyledResolved } from './resolver/styledResolved';
import { getStyleIds } from './resolver/getStyleIds';
import { injectComponentAndDescendantStyles } from './resolver/injectComponentAndDescendantStyles';

import {
  convertStyledToStyledVerbosed,
  convertSxToSxVerbosed,
} from './convertSxToSxVerbosed';
import { stableHash } from './stableHash';
import { DeclarationType, GluestackStyleSheet } from './style-sheet';
import { CSSPropertiesMap } from './core/styled-system';
// import { GluestackStyleSheet } from './style-sheet';
const styledSystemProps = { ...CSSPropertiesMap };
const globalStyleIdsMap: any = {};

function isSubset(subset: any, set: any) {
  return subset.every((item: any) => set.includes(item));
}

function flattenObject(obj: any) {
  const flat: any = {};

  // Recursive function to flatten the object
  function flatten(obj: any, path: any = []) {
    // Iterate over the object's keys

    if (Array.isArray(obj)) {
      flat[`${path.join('.')}`] = obj;
    } else {
      for (const key of Object.keys(obj)) {
        // If the value is an object, recurse
        if (key === 'ids' && path.length > 0) {
          flat[`${path.join('.')}`] = obj[key];
        } else if (key === 'props') {
          flat[`${path.join('.')}.${key}`] = obj[key];
        } else if (typeof obj[key] === 'object') {
          flatten(obj[key], [...path, key]);
        } else {
          flat[`${path.join('.')}`] = obj[key];
        }
      }
    }
  }

  flatten(obj);
  return flat;
}

function convertUtiltiyToSXFromProps(
  componentProps: any,
  styledSystemProps: any,
  componentStyleConfig: any
) {
  // if (componentProps.debug === 'BOX_TEST') {
  //   return {
  //     sx: {},
  //     rest: {},
  //   };
  // }
  const { sx: userSX, ...componentRestProps }: any = componentProps;

  const resolvedSXVerbosed = convertSxToSxVerbosed(userSX);

  const { sxProps: utilityResolvedSX, mergedProps: restProps } =
    convertUtilityPropsToSX(
      styledSystemProps,
      componentStyleConfig?.descendantStyle,
      componentRestProps
    );

  const resolvedSxVerbose = deepMerge(utilityResolvedSX, resolvedSXVerbosed);

  return { sx: resolvedSxVerbose, rest: restProps };
}

function getStateStyleCSSFromStyleIdsAndProps(
  flatternStyleIdObject: any,
  states: any,
  colorMode: any
) {
  const stateStyleCSSIds: Array<any> = [];
  let props = {};

  let stateColorMode: any = {};
  if (colorMode || states) {
    stateColorMode = {
      ...states,
      [colorMode]: true,
    };

    // const flatternStyleIdObject = flattenObject(styleIdObject);

    Object.keys(flatternStyleIdObject).forEach((styleId) => {
      // console.log('jhasfgjhask', styleId);
      const styleIdKeyArray = styleId.split('.');

      const filteredStyleIdKeyArray = styleIdKeyArray.filter(
        (item) => item !== 'colorMode' && item !== 'state' && item !== 'props'
      );

      const currentStateArray = Object.keys(stateColorMode).filter(
        (key) => stateColorMode[key] === true
      );

      if (styleId.includes('ids')) {
        // if (type === 'inline' && ) {
        // stateStyleCSSIds.push(...flatternStyleIdObject[styleId]);
        // }
      } else if (
        styleId.includes('props') &&
        isSubset(filteredStyleIdKeyArray, currentStateArray)
      ) {
        props = deepMergeObjects(props, flatternStyleIdObject[styleId]);
      } else {
        if (isSubset(filteredStyleIdKeyArray, currentStateArray)) {
          stateStyleCSSIds.push(...flatternStyleIdObject[styleId]);
        }
      }
    });
  }

  return { cssIds: stateStyleCSSIds, passingProps: props };
}

export function resolveBuildTimeSx(
  userSX: any,
  verboseSx: any,
  utilityResolvedSX: any,
  componentExtendedConfig: any
) {
  const resolvedSXVerbosed = convertSxToSxVerbosed(userSX);
  const resolvedSxVerbose = deepMerge(utilityResolvedSX, resolvedSXVerbosed);
  const sx = deepMerge(resolvedSxVerbose, verboseSx);

  let STABLEHASH_sx = stableHash(sx);
  let orderedSXResolved: any = [];
  if (Object.keys(sx).length > 0) {
    const inlineSxTheme = {
      baseStyle: sx,
    };

    resolvePlatformTheme(inlineSxTheme, Platform.OS);
    const sxStyledResolved = styledToStyledResolved(
      // @ts-ignore
      inlineSxTheme,
      [],
      componentExtendedConfig
    );
    orderedSXResolved = styledResolvedToOrderedSXResolved(sxStyledResolved);
  }
  return {
    orderedSXResolved,
    STABLEHASH_sx,
  };
}

function isValidVariantCondition(condition: any, variants: any) {
  for (const key in condition) {
    if (!variants.hasOwnProperty(key) || variants[key] !== condition[key]) {
      return false;
    }
  }
  return true;
}

function getMergedDefaultCSSIdsAndProps(
  componentStyleIds: StyleIds,
  incomingVariantProps: any,
  theme: any,
  properties: any
) {
  // console.setStartTimeStamp('getMergedDefaultCSSIdsAndProps');

  let props: any = {};

  const baseStyleCSSIds: Array<string> = [];
  const variantStyleCSSIds: Array<string> = [];
  if (
    componentStyleIds &&
    componentStyleIds?.baseStyle &&
    componentStyleIds?.baseStyle?.ids
  ) {
    baseStyleCSSIds.push(...componentStyleIds?.baseStyle?.ids);
    props = deepMergeObjects(props, componentStyleIds?.baseStyle?.props);
  }
  let passingVariantProps = getVariantProps(props, theme).variantProps;

  const mergedVariantProps = shallowMerge(
    { ...passingVariantProps },
    incomingVariantProps
  );

  Object.keys(mergedVariantProps).forEach((variant) => {
    const variantName = mergedVariantProps[variant];

    if (
      variant &&
      componentStyleIds?.variants &&
      componentStyleIds?.variants[variant] &&
      componentStyleIds?.variants[variant]?.[variantName] &&
      componentStyleIds?.variants[variant]?.[variantName]?.ids
    ) {
      variantStyleCSSIds.push(
        //@ts-ignore
        ...componentStyleIds?.variants[variant]?.[variantName]?.ids
      );

      // if this variant exist in remaining props, remove it from remaining props
      if (properties[variant]) {
        delete properties[variant];
      }
      if (props[variant]) {
        delete props[variant];
      }
      props = deepMergeObjects(
        props,
        componentStyleIds?.variants[variant]?.[variantName]?.props
      );
    }
  });

  componentStyleIds?.compoundVariants.forEach((compoundVariant) => {
    if (
      isValidVariantCondition(compoundVariant.condition, mergedVariantProps)
    ) {
      if (compoundVariant.ids) {
        variantStyleCSSIds.push(
          //@ts-ignore
          ...compoundVariant.ids
        );
      }
      props = deepMergeObjects(props, compoundVariant?.props);
    }
  });
  // console.setEndTimeStamp('getMergedDefaultCSSIdsAndProps');

  return {
    baseStyleCSSIds: baseStyleCSSIds,
    variantStyleCSSIds: variantStyleCSSIds,
    passingProps: props,
  };
}

const getMergeDescendantsStyleCSSIdsAndPropsWithKey = (
  descendantStyles: any,
  variantProps: any,
  theme: any,
  properties: any
) => {
  // console.setStartTimeStamp('getMergeDescendantsStyleCSSIdsAndPropsWithKey');

  const descendantStyleObj: any = {};
  if (descendantStyles) {
    Object.keys(descendantStyles)?.forEach((key) => {
      const styleObj = descendantStyles[key];

      const {
        baseStyleCSSIds,
        variantStyleCSSIds,
        passingProps: defaultPassingProps,
      } = getMergedDefaultCSSIdsAndProps(
        styleObj,
        variantProps,
        theme,
        properties
      );
      descendantStyleObj[key] = {
        baseStyleCSSIds: baseStyleCSSIds,
        variantStyleCSSIds: variantStyleCSSIds,
        passingProps: defaultPassingProps,
      };
    });
  }
  // console.setEndTimeStamp('getMergeDescendantsStyleCSSIdsAndPropsWithKey');

  return descendantStyleObj;
};

const AncestorStyleContext = React.createContext({});
//

// window['globalStyleMap'] = globalStyleMap;
// const globalOrderedList: any = [];
// setTimeout(() => {
//   const orderedList = globalOrderedList.sort(
//     (a: any, b: any) => a.meta.weight - b.meta.weight
//   );
//   injectInStyle(orderedList);
// });

function push_unique(arr: any, ele: any) {
  if (Array.isArray(arr)) {
    if (Array.isArray(ele)) {
      ele.forEach((element: any) => {
        if (!arr.includes(element)) {
          arr.push(element);
        }
      });
    } else {
      if (!arr.includes(ele)) {
        arr.push(ele);
      }
    }
  }

  return arr;
}
function setStateAndColorModeCssIdsAndProps(
  colorMode: 'light' | 'dark',
  states: any,
  variantProps: any,
  theme: any,
  componentStyleIds: any,
  sxComponentStyleIds: any,
  componentFlatternStyleIdObject: any,
  sxFlatternStyleObject: any,
  componentDescendantStyleIds: any,
  sxDescendantStyleIds: any
) {
  const {
    baseStyleCSSIds: mergedBaseStyleCSSIds,
    variantStyleCSSIds: mergedVariantStyleCSSIds,
    passingProps: stateProps,
  }: any = getMergedStateAndColorModeCSSIdsAndProps(
    componentStyleIds,
    //@ts-ignore
    componentFlatternStyleIdObject,
    states,
    variantProps,
    colorMode,
    theme
  );

  // for sx props
  const {
    baseStyleCSSIds: mergedSXBaseStyleCSSIds,
    variantStyleCSSIds: mergedSXVariantStyleCSSIds,
    passingProps: mergedSxStateProps,
  }: any = getMergedStateAndColorModeCSSIdsAndProps(
    sxComponentStyleIds.current,
    //@ts-ignore
    sxFlatternStyleObject,
    states,
    variantProps,
    colorMode,
    theme
  );

  // for descendants
  const mergedDescendantsStyle: any = {};

  if (componentDescendantStyleIds) {
    Object.keys(componentDescendantStyleIds).forEach((key) => {
      const componentDescendantStyleObject = flattenObject(
        componentDescendantStyleIds[key]
      );
      const {
        baseStyleCSSIds: descendantBaseStyleCSSIds,
        variantStyleCSSIds: descendantVariantStyleCSSIds,
        passingProps: mergedPassingProps,
      } = getMergedStateAndColorModeCSSIdsAndProps(
        //@ts-ignore
        componentStyleIds.current,
        componentDescendantStyleObject,
        states,
        variantProps,
        colorMode,
        theme
      );
      mergedDescendantsStyle[key] = {
        baseStyleCSSIds: descendantBaseStyleCSSIds,
        variantStyleCSSIds: descendantVariantStyleCSSIds,
        passingProps: mergedPassingProps,
      };
    });
  }

  // for sx descendants
  const mergedSxDescendantsStyle: any = {};
  if (sxDescendantStyleIds.current) {
    Object.keys(sxDescendantStyleIds.current).forEach((key) => {
      const sxDescendantBaseStyleObject = flattenObject(
        sxDescendantStyleIds.current[key]
      );
      const {
        baseStyleCSSIds: sxDescendantBaseStyleCSSIds,
        variantStyleCSSIds: sxDescendantVariantStyleCSSIds,
        passingProps: mergedPassingProps,
      } = getMergedStateAndColorModeCSSIdsAndProps(
        //@ts-ignore
        sxComponentStyleIds.current,
        sxDescendantBaseStyleObject,
        states,
        variantProps,
        colorMode,
        theme
      );
      mergedSxDescendantsStyle[key] = {
        baseStyleCSSIds: sxDescendantBaseStyleCSSIds,
        variantStyleCSSIds: sxDescendantVariantStyleCSSIds,
        passingProps: mergedPassingProps,
      };
    });
  }

  return {
    mergedBaseStyleCSSIds,
    mergedVariantStyleCSSIds,
    stateProps,
    mergedSXBaseStyleCSSIds,
    mergedSXVariantStyleCSSIds,
    mergedSxStateProps,
    mergedSxDescendantsStyle,
    mergedDescendantsStyle,
  };
}

function getMergedStateAndColorModeCSSIdsAndProps(
  componentStyleIds: any,
  componentFlatternStyleIdObject: any,
  states: any,
  incomingVariantProps: any,
  COLOR_MODE: 'light' | 'dark',
  theme: any
) {
  const stateBaseStyleCSSIds: Array<string> = [];
  const stateVariantStyleCSSIds: Array<string> = [];
  let props = {};

  if (componentFlatternStyleIdObject.baseStyle) {
    const { cssIds: stateStleCSSFromStyleIds, passingProps: stateStyleProps } =
      getStateStyleCSSFromStyleIdsAndProps(
        componentFlatternStyleIdObject,
        states,
        COLOR_MODE
      );

    push_unique(stateBaseStyleCSSIds, stateStleCSSFromStyleIds);
    // stateBaseStyleCSSIds.push(...stateStleCSSFromStyleIds);
    props = deepMergeObjects(props, stateStyleProps);
  }

  let passingVariantProps = getVariantProps(props, theme).variantProps;

  const mergedVariantProps = shallowMerge(
    { ...passingVariantProps },
    incomingVariantProps
  );

  Object.keys(mergedVariantProps).forEach((variant) => {
    const variantObjectPath = `variants.${variant}.${mergedVariantProps[variant]}`;

    if (variant && componentStyleIds?.[variantObjectPath]) {
      const {
        cssIds: stateStleCSSFromStyleIds,
        passingProps: stateStyleProps,
      } = getStateStyleCSSFromStyleIdsAndProps(
        componentStyleIds[variantObjectPath],
        states,
        COLOR_MODE
      );

      push_unique(stateVariantStyleCSSIds, stateStleCSSFromStyleIds);
      // stateVariantStyleCSSIds.push(...stateStleCSSFromStyleIds);

      props = deepMergeObjects(props, stateStyleProps);
    }
  });

  componentStyleIds?.compoundVariants?.forEach((compoundVariant: any) => {
    // const variantObjectPath = `compoundVariants.${compoundVariant}.${mergedVariantProps[variant]}`;
    const flatternCompoundVariant = flattenObject(compoundVariant);
    if (
      isValidVariantCondition(compoundVariant.condition, mergedVariantProps)
    ) {
      const {
        cssIds: stateStleCSSFromStyleIds,
        passingProps: stateStyleProps,
      } = getStateStyleCSSFromStyleIdsAndProps(
        //@ts-ignore
        flatternCompoundVariant,
        states,
        COLOR_MODE
      );

      push_unique(stateVariantStyleCSSIds, stateStleCSSFromStyleIds);
      // stateVariantStyleCSSIds.push(...stateStleCSSFromStyleIds);

      props = deepMergeObjects(props, stateStyleProps);
    }
  });

  return {
    baseStyleCSSIds: stateBaseStyleCSSIds,
    variantStyleCSSIds: stateVariantStyleCSSIds,
    passingProps: props,
  };
}

function getAncestorCSSStyleIds(compConfig: any, context: any) {
  // console.setStartTimeStamp('getAncestorCSSStyleIds');

  let ancestorBaseStyleIds: any[] = [];
  let ancestorVariantStyleIds: any[] = [];
  let ancestorPassingProps: any = {};

  if (compConfig.ancestorStyle?.length > 0) {
    if (context) {
      compConfig.ancestorStyle.forEach((ancestor: any) => {
        if (context[ancestor]) {
          ancestorBaseStyleIds = context[ancestor]?.baseStyleCSSIds;
          ancestorVariantStyleIds = context[ancestor]?.variantStyleCSSIds;
          ancestorPassingProps = context[ancestor]?.passingProps;
        }
      });
    }
  }
  // console.setEndTimeStamp('getAncestorCSSStyleIds');

  return {
    baseStyleCSSIds: ancestorBaseStyleIds,
    variantStyleIds: ancestorVariantStyleIds,
    passingProps: ancestorPassingProps,
  };
}

function mergeArraysInObjects(...objects: any) {
  // console.setStartTimeStamp('mergeArraysInObjects');

  const merged: any = {};

  for (const object of objects) {
    Object.keys(object).forEach((key) => {
      const value = object[key];
      if (!merged[key]) {
        merged[key] = {
          baseStyleCSSIds: [],
          variantStyleCSSIds: [],
          passingProps: {},
        };
      }
      merged[key].baseStyleCSSIds.push(...value.baseStyleCSSIds);
      merged[key].variantStyleCSSIds.push(...value.variantStyleCSSIds);
      merged[key].passingProps = deepMergeObjects(
        merged[key].passingProps,
        value.passingProps
      );
    });
  }
  // console.setEndTimeStamp('mergeArraysInObjects');

  return merged;
}

// let resolvedComponentMap = new Map<Component, any>();

// function isAlreadyResolved(Component) {

// }
function resolvePlatformTheme(theme: any, platform: any) {
  // console.setStartTimeStamp('resolvePlatformTheme', 'boot');

  if (typeof theme === 'object') {
    Object.keys(theme).forEach((themeKey) => {
      if (themeKey !== 'style' && themeKey !== 'defaultProps') {
        if (theme[themeKey].platform) {
          let temp = { ...theme[themeKey] };
          theme[themeKey] = deepMerge(temp, theme[themeKey].platform[platform]);
          delete theme[themeKey].platform;
          resolvePlatformTheme(theme[themeKey], platform);
        } else if (themeKey === 'queries') {
          theme[themeKey].forEach((query: any) => {
            if (query.value.platform) {
              let temp = { ...query.value };
              query.value = deepMerge(temp, query.value.platform[platform]);
              delete query.value.platform;
            }
            resolvePlatformTheme(query.value, platform);
          });
        } else {
          resolvePlatformTheme(theme[themeKey], platform);
        }
      }
    });
  }
  // console.setEndTimeStamp('resolvePlatformTheme', 'boot');
}

export function getVariantProps(
  props: any,
  theme: any,
  shouldDeleteVariants: boolean = true
) {
  // console.setStartTimeStamp('getVariantProps');

  const variantTypes = theme?.variants ? Object.keys(theme.variants) : [];
  const variantProps: any = {};
  const restProps = shallowMerge({}, props);

  if (restProps) {
    variantTypes?.forEach((variant) => {
      if (props.hasOwnProperty(variant)) {
        variantProps[variant] = props[variant];
        if (shouldDeleteVariants) delete restProps[variant];
      }
    });
  }

  return {
    variantProps,
    restProps,
  };

  // console.setEndTimeStamp('getVariantProps');
}

// const styledResolved = styledToStyledResolved(theme, [], CONFIG);
// const orderedResovled = styledResolvedToOrderedSXResolved(styledResolved);

// INTERNAL_updateCSSStyleInOrderedResolved(orderedResovled);
// //set css ruleset
// globalOrderedList.push(...orderedResovled);

// // StyleIds
// const componentStyleIds = getComponentStyleIds(
//   orderedResovled.filter((item) => !item.meta.path?.includes('descendants'))
// );

// if (componentStyleConfig.DEBUG === 'INPUT') {
//   // console.log(componentStyleIds, 'hello state here >>');
// }

// // Descendants
// const descendantStyleIds = getDescendantStyleIds(
//   orderedResovled.filter((item) => item.meta.path?.includes('descendants')),
//   componentStyleConfig.descendantStyle
// );

//

// BASE COLOR MODE RESOLUTION

function updateOrderUnResolvedMap(
  theme: any,
  componentHash: string,
  declarationType: string,
  ExtendedConfig: any
) {
  const unresolvedTheme = styledToStyledResolved(theme, [], {}, false);
  const orderedUnResolvedTheme =
    styledResolvedToOrderedSXResolved(unresolvedTheme);

  INTERNAL_updateCSSStyleInOrderedResolved(
    orderedUnResolvedTheme,
    componentHash,
    true
  );

  const componentOrderResolvedBaseStyle = getComponentResolvedBaseStyle(
    orderedUnResolvedTheme
  );
  const componentOrderResolvedVariantStyle = getComponentResolvedVariantStyle(
    orderedUnResolvedTheme
  );

  const descendantOrderResolvedBaseStyle = getDescendantResolvedBaseStyle(
    orderedUnResolvedTheme
  );
  const descendantOrderResolvedVariantStyle = getDescendantResolvedVariantStyle(
    orderedUnResolvedTheme
  );

  GluestackStyleSheet.declare(
    componentOrderResolvedBaseStyle,
    declarationType + '-base',
    componentHash ? componentHash : 'css-injected-boot-time',
    ExtendedConfig
  );
  GluestackStyleSheet.declare(
    descendantOrderResolvedBaseStyle,
    declarationType + '-descendant-base',
    componentHash ? componentHash : 'css-injected-boot-time-descendant',
    ExtendedConfig
  );
  GluestackStyleSheet.declare(
    componentOrderResolvedVariantStyle,
    declarationType + '-variant',
    componentHash ? componentHash : 'css-injected-boot-time',
    ExtendedConfig
  );
  GluestackStyleSheet.declare(
    descendantOrderResolvedVariantStyle,
    declarationType + '-descendant-variant',
    componentHash ? componentHash : 'css-injected-boot-time-descendant',
    ExtendedConfig
  );

  return orderedUnResolvedTheme;
}

const getStyleIdsFromMap = (
  CONFIG: any,
  ExtendedConfig: any,
  styleIds: any
) => {
  let componentExtendedConfig = CONFIG;
  if (ExtendedConfig) {
    componentExtendedConfig = deepMerge(CONFIG, ExtendedConfig);
  }
  Object.assign(styledSystemProps, componentExtendedConfig?.aliases);
  const componentStyleIds = styleIds.component;
  const componentDescendantStyleIds = styleIds.descendant;

  // console.setStartTimeStamp('setColorModeBaseStyleIds', 'boot');

  const componentFlatternStyleIdObject = flattenObject(componentStyleIds);

  const componentStyleObject = {
    componentStyleIds,
    componentDescendantStyleIds,
    componentFlatternStyleIdObject,
    componentExtendedConfig,
  };

  // globalStyleIdsMap[componentHash] = componentStyleObject;

  return componentStyleObject;
};

// END BASE COLOR MODE RESOLUTION

export function verboseStyled<P, Variants>(
  Component: React.ComponentType<P>,
  theme: Partial<IVerbosedTheme<Variants, P>>,
  componentStyleConfig: ConfigType = {},
  ExtendedConfig?: any,
  BUILD_TIME_PARAMS?: {
    orderedResolved: OrderedSXResolved;
    styleIds: {
      component: StyleIds;
      descendant: StyleIds;
    };
    themeHash?: string;
  }
) {
  const componentHash = stableHash({
    ...theme,
    ...componentStyleConfig,
    ...ExtendedConfig,
  });

  // const styledSystemProps = shallowMerge(CSSPropertiesMap, CONFIG?.aliases);

  // const originalThemeHash = stableHash(theme);

  let declarationType: DeclarationType = 'boot';

  if (Component.displayName === '__AsForwarder__') {
    declarationType = 'forwarded';
  }

  resolvePlatformTheme(theme, Platform.OS);

  // GluestackStyleSheet.declare(
  //   declarationType,
  //   componentHash,
  //   originalThemeHash,
  //   theme,
  //   ExtendedConfig,
  //   componentStyleConfig
  // );

  const DEBUG_TAG = componentStyleConfig?.DEBUG;
  const DEBUG =
    process.env.NODE_ENV === 'development' && DEBUG_TAG ? false : false;

  if (DEBUG) {
    console.group(
      `%cVerboseStyled()`,
      'background: #4b5563; color: #d97706; font-weight: 700; padding: 2px 8px;'
    );
    console.log(
      `%c${DEBUG_TAG} verbosed theme`,
      'background: #4b5563; color: #16a34a; font-weight: 700; padding: 2px 8px;',
      theme
    );
  }

  //@ts-ignore
  type ITypeReactNativeStyles = P['style'];
  let styleHashCreated = false;
  let orderedResolved: OrderedSXResolved;
  let componentStyleIds: any = {};
  let componentDescendantStyleIds: any = {}; // StyleIds = {};
  let componentExtendedConfig: any = {};
  let styleIds = {} as {
    component: StyleIds;
    descendant: StyleIds;
  };
  let componentFlatternStyleIdObject: any = {};

  // const orderedUnResolvedTheme = updateOrderUnResolvedMap(
  //   theme,
  //   componentHash,
  //   declarationType,
  //   ExtendedConfig
  // );

  // styleIds = getStyleIds(orderedUnResolvedTheme, componentStyleConfig);

  if (BUILD_TIME_PARAMS?.orderedResolved) {
    orderedResolved = BUILD_TIME_PARAMS?.orderedResolved;

    injectComponentAndDescendantStyles(orderedResolved, 'boot');
    if (DEBUG) {
      console.log(
        `%cOrder resolved build time`,
        'background: #4b5563; color: #16a34a; font-weight: 700; padding: 2px 8px;',
        orderedResolved
      );
    }
  } else {
    const orderedUnResolvedTheme = updateOrderUnResolvedMap(
      theme,
      componentHash,
      declarationType,
      ExtendedConfig
    );

    styleIds = getStyleIds(orderedUnResolvedTheme, componentStyleConfig);
  }

  if (BUILD_TIME_PARAMS?.styleIds) {
    styleIds = BUILD_TIME_PARAMS?.styleIds;
    if (DEBUG) {
      console.log(
        `%cStyle Ids build time`,
        'background: #4b5563; color: #16a34a; font-weight: 700; padding: 2px 8px;',
        styleIds
      );
    }
  }

  function injectSx(sx: any, type: any = 'inline') {
    const inlineSxTheme = {
      baseStyle: sx,
    };

    resolvePlatformTheme(inlineSxTheme, Platform.OS);
    const sxStyledResolved = styledToStyledResolved(
      // @ts-ignore
      inlineSxTheme,
      [],
      componentExtendedConfig
    );

    const sxHash = stableHash(sx);
    const orderedSXResolved =
      styledResolvedToOrderedSXResolved(sxStyledResolved);

    INTERNAL_updateCSSStyleInOrderedResolved(
      orderedSXResolved,
      sxHash,
      false,
      'gs'
    );

    injectComponentAndDescendantStyles(orderedSXResolved, sxHash, type);

    return orderedSXResolved;
  }

  // END BASE COLOR MODE RESOLUTION

  let CONFIG: any = {};

  const containsDescendant =
    componentStyleConfig?.descendantStyle &&
    componentStyleConfig?.descendantStyle?.length > 0;

  const NewComp = (
    {
      as,
      children,
      //@ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      styledIds: BUILD_TIME_STYLE_IDS,
      ...componentProps
    }: Omit<P, keyof Variants> &
      Partial<ComponentProps<ITypeReactNativeStyles, Variants, P>> &
      Partial<UtilityProps<ITypeReactNativeStyles>> & {
        as?: any;
        children?: any;
      },
    ref: React.ForwardedRef<P>
  ) => {
    // if (componentProps.debug === 'BOX_TEST') {
    //   return <View>{children}</View>;
    // }
    const sxComponentStyleIds = useRef({});
    const sxDescendantStyleIds = useRef({});
    const sxComponentPassingProps = useRef({});

    // const applySxStyleCSSIds = useRef([]);
    const applySxBaseStyleCSSIds = useRef([]);
    const applySxVariantStyleCSSIds = useRef([]);

    const applySxDescendantStyleCSSIdsAndPropsWithKey = useRef({});

    // const [applySxStateStyleCSSIds, setApplyStateSxStyleCSSIds] = useState([]);
    const [applySxStateBaseStyleCSSIds, setApplyStateSxBaseStyleCSSIds] =
      useState([]);
    const [applySxStateVariantStyleCSSIds, setApplyStateSxVariantStyleCSSIds] =
      useState([]);
    const [
      applySxDescendantStateStyleCSSIdsAndPropsWithKey,
      setApplySxDescendantStateStyleCSSIdsAndPropsWithKey,
    ] = useState({});

    const [componentStatePassingProps, setComponentStatePassingProps] =
      useState({});
    const [sxStatePassingProps, setSxStatePassingProps] = useState({});

    const [
      applyComponentStateBaseStyleIds,
      setApplyComponentStateBaseStyleIds,
    ] = useState([]);
    const [
      applyComponentStateVariantStyleIds,
      setApplyComponentStateVariantStyleIds,
    ] = useState([]);

    const [
      applyDescendantStateStyleCSSIdsAndPropsWithKey,
      setApplyDescendantStateStyleCSSIdsAndPropsWithKey,
    ] = useState({});

    //200ms
    // let time = Date.now();
    const styledContext = useStyled();
    const styleHashCreatedForColorMode = React.useRef(false);
    const ancestorStyleContext = useContext(AncestorStyleContext);
    let themeDefaultProps = {};
    let incomingComponentProps = {};
    let remainingComponentProps = {};
    let sxFlatternStyleObject = {};

    const COLOR_MODE: any = get();

    const activeTheme = useActiveTheme().theme;
    if (!styleHashCreated) {

      const themes = styledContext.config.themes;
      CONFIG = {
        ...styledContext.config,
        propertyTokenMap,
      };
          // Merging the theme with the active theme
      deepMerge(CONFIG.tokens, themes[activeTheme]);
      Object.assign(styledSystemProps, CONFIG?.aliases);
// @ts-ignore
      themeDefaultProps = { ...theme.baseStyle?.props };
      const globalStyle = styledContext.globalStyle;
    
      // ToBeRenderComponent = React.createElement(Component);
      // GluestackStyleSheet.resolve(CONFIG);
      // GluestackStyleSheet.injectInStyle();
      if (globalStyle) {
        resolvePlatformTheme(globalStyle, Platform.OS);
        theme = shallowMerge({ ...globalStyle }, theme);
      }

      const {
        componentStyleIds: c,
        componentDescendantStyleIds: d,
        componentFlatternStyleIdObject: e,
        componentExtendedConfig: f,
      } = getStyleIdsFromMap(CONFIG, ExtendedConfig, styleIds);

      componentStyleIds = c;
      componentDescendantStyleIds = d;
      componentFlatternStyleIdObject = e;
      componentExtendedConfig = f;
      styleHashCreated = true;
      /* Boot time */
    }

    const {
      passingProps: applyAncestorPassingProps,
      baseStyleCSSIds: applyAncestorBaseStyleCSSIds,
      variantStyleIds: applyAncestorVariantStyleCSSIds,
    } = getAncestorCSSStyleIds(componentStyleConfig, ancestorStyleContext);

    //220ms

    Object.assign(incomingComponentProps, applyAncestorPassingProps);
    Object.assign(incomingComponentProps, componentProps);

    // const incomingComponentProps = shallowMerge(
    //   { ...applyAncestorPassingProps },
    //   componentProps
    // );
    /* {
      //@ts-ignore
      ...applyAncestorPassingProps, // As applyAncestorPassingProps is incoming props for the descendant component
      ...componentProps,
    };*/

    Object.assign(themeDefaultProps, incomingComponentProps);

    const { variantProps } = getVariantProps(themeDefaultProps, theme);

    //235ms

    // console.log('hello here ', componentVariantDependencies);
    // const STABLEHASH_variantProps = stableHash(variantProps);

    const {
      baseStyleCSSIds: applyBaseStyleCSSIds,
      variantStyleCSSIds: applyVariantStyleCSSIds,
      passingProps: applyComponentPassingProps,
    } = getMergedDefaultCSSIdsAndProps(
      //@ts-ignore
      componentStyleIds,
      variantProps,
      theme,
      incomingComponentProps
    );

    //290ms
    //
    //
    //

    // return <Component>{children}</Component>;

    //
    // passingProps is specific to current component
    const passingProps = deepMergeObjects(
      applyComponentPassingProps,
      componentStatePassingProps,
      sxComponentPassingProps.current,
      sxStatePassingProps
    );

    // return <View />;

    // 290ms
    const { sx: filteredComponentSx, rest: filteredComponentRemainingProps } =
      convertUtiltiyToSXFromProps(
        componentProps,
        styledSystemProps,
        componentStyleConfig
      );

    const { sx: filteredPassingSx, rest: filteredPassingRemainingProps } =
      convertUtiltiyToSXFromProps(
        shallowMerge({ ...passingProps }, applyAncestorPassingProps),
        styledSystemProps,
        componentStyleConfig
      );

    // if (componentStyleConfig.DEBUG === 'MYTEXT') {
    //   console.log(
    //     filteredComponentSx,
    //     filteredPassingSx,
    //     // applyAncestorPassingProps,
    //     // applyAncestorBaseStyleCSSIds,
    //     // applyAncestorVariantStyleCSSIds,
    //     componentProps,
    //     '>>>>>'
    //   );
    // }

    // const remainingComponentProps = shallowMerge(
    //   filteredPassingRemainingProps ,
    //   filteredComponentRemainingProps
    // );
    Object.assign(remainingComponentProps, filteredPassingRemainingProps);
    Object.assign(remainingComponentProps, filteredComponentRemainingProps);

    const { states, ...applyComponentInlineProps }: any =
      remainingComponentProps;

    // const STABLEHASH_states = stableHash(states);
    // 520ms

    // Inline prop based style resolution TODO: Diagram insertion
    const resolvedInlineProps = {};
    if (
      componentStyleConfig.resolveProps &&
      Object.keys(componentExtendedConfig).length > 0
    ) {
      componentStyleConfig.resolveProps.forEach((toBeResovledProp) => {
        if (applyComponentInlineProps[toBeResovledProp]) {
          let value = applyComponentInlineProps[toBeResovledProp];
          if (
            CONFIG.propertyResolver &&
            CONFIG.propertyResolver.props &&
            CONFIG.propertyResolver.props[toBeResovledProp]
          ) {
            let transformer = CONFIG.propertyResolver.props[toBeResovledProp];
            let aliasTokenType = CONFIG.propertyTokenMap[toBeResovledProp];
            let token = transformer(
              value,
              (value1: any, scale = aliasTokenType) =>
                resolveStringToken(
                  value1,
                  CONFIG,
                  CONFIG.propertyTokenMap,
                  toBeResovledProp,
                  scale
                )
            );
            //@ts-ignore
            resolvedInlineProps[toBeResovledProp] = token;
          } else {
            //@ts-ignore
            resolvedInlineProps[toBeResovledProp] =
              getResolvedTokenValueFromConfig(
                componentExtendedConfig,
                applyComponentInlineProps,
                toBeResovledProp,
                applyComponentInlineProps[toBeResovledProp]
              );
          }
          delete applyComponentInlineProps[toBeResovledProp];
        }
      });
    }

    //550ms

    // const { sx, remainingComponentProps } = filterSx(mergedSx, mergedVerboseSx);
    // TODO: filter for inline props like variant and sizes

    // return <Component {...properties} ref={ref} />;
    // 720ms

    let applyDescendantsStyleCSSIdsAndPropsWithKey = {};
    if (containsDescendant) {
      applyDescendantsStyleCSSIdsAndPropsWithKey =
        getMergeDescendantsStyleCSSIdsAndPropsWithKey(
          componentDescendantStyleIds,
          variantProps,
          theme,
          incomingComponentProps
        );
    }

    // ancestorCSSStyleId

    // const [applySxStyleCSSIds, setApplySxStyleCSSIds] = useState([]);

    // SX resolution

    // const styleTagId = useRef(`style-tag-sx-${stableHash(sx)}`);

    // FOR SX RESOLUTION
    let orderedComponentSXResolved = [];
    let sxStyleIds: any = {};

    if (BUILD_TIME_STYLE_IDS) {
      sxStyleIds = BUILD_TIME_STYLE_IDS;
    } else {
      if (
        Object.keys(filteredComponentSx).length > 0 ||
        Object.keys(filteredPassingSx).length > 0
      ) {
        orderedComponentSXResolved = injectSx(filteredComponentSx, 'inline');
        // console.setEndTimeStamp('INTERNAL_updateCSSStyleInOrderedResolved');
        // console.setStartTimeStamp('injectComponentAndDescendantStyles');
        // console.setEndTimeStamp('injectComponentAndDescendantStyles');
        const orderedPassingSXResolved = injectSx(filteredPassingSx, 'passing');
        const orderedSXResolved = [
          ...orderedPassingSXResolved,
          ...orderedComponentSXResolved,
        ];
        // console.setStartTimeStamp('getStyleIds');
        sxStyleIds = getStyleIds(orderedSXResolved, componentStyleConfig);
        ///
        // Setting variants to sx property for inline variant resolution
        //@ts-ignore
        if (!sxStyleIds.component) {
          sxStyleIds.component = {};
        }
        sxStyleIds.component.variants = componentStyleIds.variants;
        //@ts-ignore
        sxStyleIds.component.compoundVariants =
          componentStyleIds.compoundVariants;
        // console.setStartTimeStamp('setColorModeBaseStyleIds');
        sxComponentStyleIds.current = sxStyleIds?.component;
        sxDescendantStyleIds.current = sxStyleIds.descendant ?? {};
        // 315ms
        // SX component style
        //@ts-ignore
        const {
          baseStyleCSSIds: sxBaseStyleCSSIds,
          variantStyleCSSIds: sxVariantStyleCSSIds,
          passingProps: sxPassingProps,
        } = getMergedDefaultCSSIdsAndProps(
          //@ts-ignore
          sxComponentStyleIds.current,
          variantProps,
          theme,
          incomingComponentProps
        );
        //@ts-ignore
        // applySxStyleCSSIds.current = sxStyleCSSIds;
        //@ts-ignore
        applySxBaseStyleCSSIds.current = sxBaseStyleCSSIds;
        //@ts-ignore
        applySxVariantStyleCSSIds.current = sxVariantStyleCSSIds;
        sxComponentPassingProps.current = sxPassingProps;
        sxFlatternStyleObject = flattenObject(sxComponentStyleIds);
        // SX descendants
      }
    }

    if (containsDescendant) {
      //@ts-ignore
      applySxDescendantStyleCSSIdsAndPropsWithKey.current =
        getMergeDescendantsStyleCSSIdsAndPropsWithKey(
          sxDescendantStyleIds.current,
          variantProps,
          theme,
          incomingComponentProps
        );
    }

    const isClient = React.useRef(false);
    if (!isClient.current) {
      isClient.current = true;
      // const {
      //   mergedBaseStyleCSSIds,
      //   mergedVariantStyleCSSIds,
      //   stateProps,
      //   mergedSXBaseStyleCSSIds,
      //   mergedSXVariantStyleCSSIds,
      //   mergedSxStateProps,
      //   mergedSxDescendantsStyle,
      //   mergedDescendantsStyle,
      // } = setStateAndColorModeCssIdsAndProps(
      //   COLOR_MODE,
      //   states,
      //   variantProps,
      //   theme,
      //   componentStyleIds,
      //   sxComponentStyleIds,
      //   componentFlatternStyleIdObject,
      //   sxFlatternStyleObject,
      //   componentDescendantStyleIds,
      //   sxDescendantStyleIds
      // );

      // setApplyComponentStateBaseStyleIds(mergedBaseStyleCSSIds);
      // setApplyComponentStateVariantStyleIds(mergedVariantStyleCSSIds);

      // setComponentStatePassingProps(stateProps);

      // setApplyStateSxBaseStyleCSSIds(mergedSXBaseStyleCSSIds);
      // setApplyStateSxVariantStyleCSSIds(mergedSXVariantStyleCSSIds);

      // setSxStatePassingProps(mergedSxStateProps);

      // setApplyDescendantStateStyleCSSIdsAndPropsWithKey(mergedDescendantsStyle);

      // setApplySxDescendantStateStyleCSSIdsAndPropsWithKey(
      //   mergedSxDescendantsStyle
      // );
    }

    // START: Unable to optimize because of useEffect overhead and stableHash to prevent rerender
    useEffect(() => {
      // onChange((colorMode: any) => {
      //   // setCOLOR_MODE(colorMode);
      //   const {
      //     mergedBaseStyleCSSIds,
      //     mergedVariantStyleCSSIds,
      //     stateProps,
      //     mergedSXBaseStyleCSSIds,
      //     mergedSXVariantStyleCSSIds,
      //     mergedSxStateProps,
      //     mergedSxDescendantsStyle,
      //     mergedDescendantsStyle,
      //   } = setStateAndColorModeCssIdsAndProps(
      //     colorMode,
      //     states,
      //     variantProps,
      //     theme,
      //     componentStyleIds,
      //     sxComponentStyleIds,
      //     componentFlatternStyleIdObject,
      //     sxFlatternStyleObject,
      //     componentDescendantStyleIds,
      //     sxDescendantStyleIds
      //   );
      //   setApplyComponentStateBaseStyleIds(mergedBaseStyleCSSIds);
      //   setApplyComponentStateVariantStyleIds(mergedVariantStyleCSSIds);
      //   setComponentStatePassingProps(stateProps);
      //   setApplyStateSxBaseStyleCSSIds(mergedSXBaseStyleCSSIds);
      //   setApplyStateSxVariantStyleCSSIds(mergedSXVariantStyleCSSIds);
      //   setSxStatePassingProps(mergedSxStateProps);
      //   setApplyDescendantStateStyleCSSIdsAndPropsWithKey(
      //     mergedDescendantsStyle
      //   );
      //   setApplySxDescendantStateStyleCSSIdsAndPropsWithKey(
      //     mergedSxDescendantsStyle
      //   );
      // });
      // // remove onchage listener on onmount
      // () =>
      //   onChange((colorMode: any) => {
      //     // setCOLOR_MODE(colorMode);
      //     setStateAndColorModeCssIdsAndProps(
      //       colorMode,
      //       states,
      //       variantProps,
      //       theme,
      //       componentStyleIds,
      //       sxComponentStyleIds,
      //       componentFlatternStyleIdObject,
      //       sxFlatternStyleObject,
      //       componentDescendantStyleIds,
      //       sxDescendantStyleIds
      //     );
      //   });
    }, []);

    useEffect(() => {
      // if (states) {
      //   const {
      //     mergedBaseStyleCSSIds,
      //     mergedVariantStyleCSSIds,
      //     stateProps,
      //     mergedSXBaseStyleCSSIds,
      //     mergedSXVariantStyleCSSIds,
      //     mergedSxStateProps,
      //     mergedSxDescendantsStyle,
      //     mergedDescendantsStyle,
      //   } = setStateAndColorModeCssIdsAndProps(
      //     COLOR_MODE,
      //     states,
      //     variantProps,
      //     theme,
      //     componentStyleIds,
      //     sxComponentStyleIds,
      //     componentFlatternStyleIdObject,
      //     sxFlatternStyleObject,
      //     componentDescendantStyleIds,
      //     sxDescendantStyleIds
      //   );
      //   setApplyComponentStateBaseStyleIds(mergedBaseStyleCSSIds);
      //   setApplyComponentStateVariantStyleIds(mergedVariantStyleCSSIds);
      //   setComponentStatePassingProps(stateProps);
      //   setApplyStateSxBaseStyleCSSIds(mergedSXBaseStyleCSSIds);
      //   setApplyStateSxVariantStyleCSSIds(mergedSXVariantStyleCSSIds);
      //   setSxStatePassingProps(mergedSxStateProps);
      //   setApplyDescendantStateStyleCSSIdsAndPropsWithKey(
      //     mergedDescendantsStyle
      //   );
      //   setApplySxDescendantStateStyleCSSIdsAndPropsWithKey(
      //     mergedSxDescendantsStyle
      //   );
      // }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [states]);

    // 600ms
    const descendantCSSIds = useMemo(() => {
      if (!containsDescendant) {
        return {};
      }
      const ids = (() => {
        if (
          applyDescendantsStyleCSSIdsAndPropsWithKey ||
          applyDescendantStateStyleCSSIdsAndPropsWithKey ||
          applySxDescendantStateStyleCSSIdsAndPropsWithKey ||
          applySxDescendantStyleCSSIdsAndPropsWithKey ||
          ancestorStyleContext
        ) {
          return mergeArraysInObjects(
            applyDescendantsStyleCSSIdsAndPropsWithKey,
            applyDescendantStateStyleCSSIdsAndPropsWithKey,
            applySxDescendantStyleCSSIdsAndPropsWithKey.current,
            applySxDescendantStateStyleCSSIdsAndPropsWithKey,
            ancestorStyleContext
          );
        } else {
          return {};
        }
      })();
      return ids;
    }, [
      stableHash(applyDescendantsStyleCSSIdsAndPropsWithKey),
      stableHash(applyDescendantStateStyleCSSIdsAndPropsWithKey),
      stableHash(applySxDescendantStateStyleCSSIdsAndPropsWithKey),
      ancestorStyleContext,
    ]);

    // 370ms

    // END: Unable to optimize because of useEffect overhead and stableHash to prevent rerender

    const styleCSSIds = [
      ...applyBaseStyleCSSIds,
      ...applyAncestorBaseStyleCSSIds,
      ...applyVariantStyleCSSIds,
      ...applyAncestorVariantStyleCSSIds,
      ...applyComponentStateBaseStyleIds,
      ...applyComponentStateVariantStyleIds,
      ...applySxVariantStyleCSSIds.current,
      ...applySxStateBaseStyleCSSIds,
      ...applySxStateVariantStyleCSSIds,
      ...applySxBaseStyleCSSIds.current,
    ];

    Object.assign(resolvedInlineProps, applyComponentInlineProps);

    const resolvedStyleProps = generateStylePropsFromCSSIds(
      resolvedInlineProps,
      styleCSSIds,
      CONFIG
    );

    const AsComp: any = (as as any) || (passingProps.as as any) || undefined;

    const resolvedStyleMemo = [
      passingProps?.style,
      ...resolvedStyleProps?.style,
    ];

    // if (componentProps.debug === 'BOX_TEST') {
    //   return (
    //     <Component {...resolvedStyleProps} style={resolvedStyleMemo} ref={ref}>
    //       {children}
    //     </Component>
    //   );
    // }
    // if (componentProps.debug === 'BOX_TEST') {
    //   // if (!AsComp) {
    //   // console.log(componentProps, 'component props');
    //   return (
    //     <Component {...resolvedStyleProps} style={resolvedStyleMemo} ref={ref}>
    //       {children}
    //     </Component>
    //   );
    //   // } else {
    //   //   return (
    //   //     <AsComp {...resolvedStyleProps} style={resolvedStyleMemo} ref={ref}>
    //   //       {children}
    //   //     </AsComp>
    //   //   );
    //   // }
    // }

    const component = !AsComp ? (
      <Component {...resolvedStyleProps} style={resolvedStyleMemo} ref={ref}>
        {children}
      </Component>
    ) : (
      <AsComp {...resolvedStyleProps} style={resolvedStyleMemo} ref={ref}>
        {children}
      </AsComp>
    );

    if (containsDescendant) {
      return (
        <AncestorStyleContext.Provider value={descendantCSSIds}>
          {component}
        </AncestorStyleContext.Provider>
      );
    }
    // }

    return component;
  };

  const StyledComp = React.forwardRef(NewComp);
  StyledComp.displayName = Component?.displayName
    ? 'Styled' + Component?.displayName
    : 'StyledComponent';

  return StyledComp;
}

export function styled<P, Variants>(
  Component: React.ComponentType<P>,
  theme: ITheme<Variants, P>,
  componentStyleConfig?: ConfigType,
  ExtendedConfig?: ExtendedConfigType,
  BUILD_TIME_PARAMS?: {
    orderedResolved: OrderedSXResolved;
    styleIds: {
      component: StyleIds;
      descendant: StyleIds;
    };
    themeHash?: string;
  }
) {
  const DEBUG_TAG = componentStyleConfig?.DEBUG;
  const DEBUG =
    process.env.NODE_ENV === 'development' && DEBUG_TAG ? false : false;

  if (DEBUG) {
    console.group(
      `%cStyled()`,
      'background: #4b5563; color: #d97706; font-weight: 700; padding: 2px 8px;'
    );
    console.log(
      `%c${DEBUG_TAG} theme`,
      'background: #4b5563; color: #16a34a; font-weight: 700; padding: 2px 8px;',
      theme
    );
  }
  let styledObj: any = theme;

  // console.log('styledObj', styledObj);

  const plugins = getInstalledPlugins();

  for (const pluginName in plugins) {
    styledObj = plugins[pluginName]?.inputMiddleWare(styledObj, true, true);
  }
  theme = styledObj;

  const sxConvertedObject = convertStyledToStyledVerbosed(theme);
  let StyledComponent = verboseStyled<P, Variants>(
    Component,
    sxConvertedObject,
    componentStyleConfig,
    ExtendedConfig,
    BUILD_TIME_PARAMS
  );

  plugins?.reverse();
  for (const pluginName in plugins) {
    if (plugins[pluginName]?.componentMiddleWare) {
      StyledComponent = plugins[pluginName]?.componentMiddleWare({
        Component: StyledComponent,
        theme,
        componentStyleConfig,
        ExtendedConfig,
      });
    }
  }

  for (const pluginName in plugins) {
    const compWrapper =
      typeof plugins[pluginName].wrapperComponentMiddleWare === 'function'
        ? plugins[pluginName].wrapperComponentMiddleWare()
        : null;

    if (compWrapper) {
      for (const key of Object.keys(compWrapper)) {
        // @ts-ignore
        StyledComponent[key] = compWrapper[key];
      }
    }
  }

  return StyledComponent;
}

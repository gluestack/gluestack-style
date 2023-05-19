import React, {
  // JSXElementConstructor,
  // Component,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from 'react';
import type {
  ConfigType,
  OrderedSXResolved,
  // Styled,
  StyleIds,
  // DefaultAndState,
  ComponentProps,
  UtilityProps,
  IdsStateColorMode,
  ITheme,
  IThemeNew,
} from './types';
import {
  deepMerge,
  // deepMergeArray,
  getResolvedTokenValueFromConfig,
  deepMergeObjects,
  resolveStringToken,
} from './utils';
import { convertUtilityPropsToSX } from './core/convert-utility-to-sx';
import { useStyled } from './StyledProvider';
import { propertyTokenMap } from './propertyTokenMap';
import { Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { injectInStyle } from './injectInStyle';
import { INTERNAL_updateCSSStyleInOrderedResolved } from './updateCSSStyleInOrderedResolved';
import { generateStylePropsFromCSSIds } from './generateStylePropsFromCSSIds';

import { get, onChange } from './core/colorMode';
import {
  styledResolvedToOrderedSXResolved,
  styledToStyledResolved,
  getStyleIds,
  getComponentResolved,
  getDescendantResolved,
} from './resolver';
import {
  convertStyledToStyledVerbosed,
  convertSxToSxVerbosed,
} from './convertSxToSxVerbosed';
import { stableHash } from './stableHash';

function getStateStyleCSSFromStyleIdsAndProps(
  styleIdObject: IdsStateColorMode,
  states: any,
  colorMode: any
) {
  const stateStyleCSSIds: Array<any> = [];
  let props = {};

  if (states || colorMode) {
    function isSubset(subset: any, set: any) {
      return subset.every((item: any) => set.includes(item));
    }

    function flattenObject(obj: any) {
      const flat: any = {};

      // Recursive function to flatten the object
      function flatten(obj: any, path: any = []) {
        // Iterate over the object's keys
        for (const key of Object.keys(obj)) {
          // If the value is an object, recurse
          if (key === 'ids' && path.length > 0) {
            flat[`${path.join('.')}`] = obj[key];
          } else if (key === 'props') {
            flat[`${path.join('.')}.${key}`] = obj[key];
          } else if (typeof obj[key] === 'object') {
            flatten(obj[key], [...path, key]);
          } else {
            // Otherwise, add the key-value pair to the flat object
            flat[`${path.join('.')}`] = obj[key];
          }
        }
      }

      flatten(obj);
      return flat;
    }

    const flatternStyleIdObject = flattenObject(styleIdObject);

    Object.keys(flatternStyleIdObject).forEach((styleId) => {
      const styleIdKeyArray = styleId.split('.');

      const filteredStyleIdKeyArray = styleIdKeyArray.filter(
        (item) => item !== 'colorMode' && item !== 'state' && item !== 'props'
      );

      const stateColorMode = {
        ...states,
        [colorMode]: true,
      };

      const currentStateArray = Object.keys(stateColorMode).filter(
        (key) => stateColorMode[key] === true
      );

      if (styleId.includes('ids')) {
        stateStyleCSSIds.push(flatternStyleIdObject[styleId]);
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
  properties: any,
  type: 'inline' | 'boot' = 'boot'
) {
  let defaultStyleCSSIds: Array<string> = [];
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

  const mergedVariantProps = {
    ...passingVariantProps,
    ...incomingVariantProps,
  };

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

  if (type === 'inline') {
    defaultStyleCSSIds = [...variantStyleCSSIds, ...baseStyleCSSIds];
  } else {
    defaultStyleCSSIds = [...baseStyleCSSIds, ...variantStyleCSSIds];
  }

  return { cssIds: defaultStyleCSSIds, passingProps: props };
}

const getMergeDescendantsStyleCSSIdsAndPropsWithKey = (
  descendantStyles: any,
  variantProps: any,
  theme: any,
  properties: any,
  type?: any
) => {
  const descendantStyleObj: any = {};
  if (descendantStyles) {
    Object.keys(descendantStyles)?.forEach((key) => {
      const styleObj = descendantStyles[key];

      const { cssIds: defaultBaseCSSIds, passingProps: defaultPassingProps } =
        getMergedDefaultCSSIdsAndProps(
          styleObj,
          variantProps,
          theme,
          properties,
          type
        );
      descendantStyleObj[key] = {
        cssIds: defaultBaseCSSIds,
        passingProps: defaultPassingProps,
      };
    });
  }

  return descendantStyleObj;
};

const Context = React.createContext<any>({});

const globalStyleMap: Map<string, any> = new Map<string, any>();
//

// window['globalStyleMap'] = globalStyleMap;
// const globalOrderedList: any = [];
// setTimeout(() => {
//   const orderedList = globalOrderedList.sort(
//     (a: any, b: any) => a.meta.weight - b.meta.weight
//   );
//   injectInStyle(orderedList);
// });

function getMergedStateAndColorModeCSSIdsAndProps(
  componentStyleIds: StyleIds,
  states: any,
  incomingVariantProps: any,
  COLOR_MODE: 'light' | 'dark',
  theme: any,
  type: 'inline' | 'boot' = 'boot'
) {
  let stateStyleCSSIds = [];
  const stateBaseStyleCSSIds: Array<string> = [];
  const stateVariantStyleCSSIds: Array<string> = [];
  let props = {};

  if (componentStyleIds.baseStyle) {
    const { cssIds: stateStleCSSFromStyleIds, passingProps: stateStyleProps } =
      getStateStyleCSSFromStyleIdsAndProps(
        componentStyleIds.baseStyle,
        states,
        COLOR_MODE
      );

    stateBaseStyleCSSIds.push(...stateStleCSSFromStyleIds);
    props = deepMergeObjects(props, stateStyleProps);
  }

  let passingVariantProps = getVariantProps(props, theme).variantProps;

  const mergedVariantProps = {
    ...passingVariantProps,
    ...incomingVariantProps,
  };

  Object.keys(mergedVariantProps).forEach((variant) => {
    if (
      variant &&
      componentStyleIds.variants &&
      componentStyleIds.variants[variant] &&
      componentStyleIds.variants[variant][mergedVariantProps[variant]]
    ) {
      const {
        cssIds: stateStleCSSFromStyleIds,
        passingProps: stateStyleProps,
      } = getStateStyleCSSFromStyleIdsAndProps(
        componentStyleIds.variants[variant][mergedVariantProps[variant]],
        states,
        COLOR_MODE
      );

      stateVariantStyleCSSIds.push(...stateStleCSSFromStyleIds);

      props = deepMergeObjects(props, stateStyleProps);
    }
  });

  componentStyleIds?.compoundVariants?.forEach((compoundVariant) => {
    if (
      isValidVariantCondition(compoundVariant.condition, mergedVariantProps)
    ) {
      const {
        cssIds: stateStleCSSFromStyleIds,
        passingProps: stateStyleProps,
      } = getStateStyleCSSFromStyleIdsAndProps(
        //@ts-ignore
        compoundVariant,
        states,
        COLOR_MODE
      );

      stateVariantStyleCSSIds.push(...stateStleCSSFromStyleIds);

      props = deepMergeObjects(props, stateStyleProps);
    }
  });

  if (type === 'inline') {
    stateStyleCSSIds = [...stateVariantStyleCSSIds, ...stateBaseStyleCSSIds];
  } else {
    stateStyleCSSIds = [...stateBaseStyleCSSIds, ...stateVariantStyleCSSIds];
  }
  return { cssIds: stateStyleCSSIds, passingProps: props };
}

function getAncestorCSSStyleIds(compConfig: any, context: any) {
  let ancestorStyleIds: any[] = [];
  let ancestorPassingProps: any = {};
  if (compConfig.ancestorStyle?.length > 0) {
    compConfig.ancestorStyle.forEach((ancestor: any) => {
      if (context[ancestor]) {
        ancestorStyleIds = context[ancestor]?.cssIds;
        ancestorPassingProps = context[ancestor]?.passingProps;
      }
    });
  }

  return { cssIds: ancestorStyleIds, passingProps: ancestorPassingProps };
}
function mergeArraysInObjects(...objects: any) {
  const merged: any = {};

  for (const object of objects) {
    Object.keys(object).forEach((key) => {
      const value = object[key];
      if (!merged[key]) {
        merged[key] = { cssIds: [], passingProps: {} };
      }
      merged[key].cssIds.push(...value.cssIds);
      merged[key].passingProps = deepMergeObjects(
        merged[key].passingProps,
        value.passingProps
      );
    });
  }

  return merged;
}

// let resolvedComponentMap = new Map<Component, any>();

// function isAlreadyResolved(Component) {

// }
function resolvePlatformTheme(theme: any, platform: any) {
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
}

export function getVariantProps(
  props: any,
  theme: any,
  shouldDeleteVariants: boolean = true
) {
  const variantTypes = theme?.variants ? Object.keys(theme.variants) : [];

  const restProps = { ...props };

  const variantProps: any = {};
  variantTypes?.forEach((variant) => {
    if (props[variant]) {
      variantProps[variant] = props[variant];

      if (shouldDeleteVariants) delete restProps[variant];
    }
  });

  return {
    variantProps,
    restProps,
  };
}

export function verboseStyled<P, Variants, Sizes>(
  Component: React.ComponentType<P>,
  theme: Partial<ITheme<Variants, Sizes, P>>,
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
  //@ts-ignore
  type ReactNativeStyles = P['style'];
  let styleHashCreated = false;

  let orderedResolved: OrderedSXResolved;
  let componentStyleIds: any = {};
  let componentDescendantStyleIds: any = {}; // StyleIds = {};
  let componentExtendedConfig: any = {};
  let styleIds = {} as {
    component: StyleIds;
    descendant: StyleIds;
  };

  if (BUILD_TIME_PARAMS?.orderedResolved) {
    orderedResolved = BUILD_TIME_PARAMS?.orderedResolved;
  }
  if (BUILD_TIME_PARAMS?.styleIds) {
    styleIds = BUILD_TIME_PARAMS?.styleIds;
  }
  resolvePlatformTheme(theme, Platform.OS);

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

  function injectComponentAndDescendantStyles(
    orderedResolved: OrderedSXResolved,
    styleTagId?: string,
    type: 'boot' | 'inline' = 'boot'
  ) {
    const componentOrderResolved = getComponentResolved(orderedResolved);
    const descendantOrderResolved = getDescendantResolved(orderedResolved);
    injectInStyle(
      globalStyleMap,
      componentOrderResolved,
      type,
      styleTagId ? styleTagId : 'css-injected-boot-time'
    );

    injectInStyle(
      globalStyleMap,
      descendantOrderResolved,
      type + '-descendant',
      styleTagId
        ? styleTagId + '-descendant'
        : 'css-injected-boot-time-descendant'
    );
  }

  // BASE COLOR MODE RESOLUTION

  function setColorModeBaseStyleIdsForWeb(styleIds: any, COLOR_MODE: any) {
    if (Platform.OS === 'web' && COLOR_MODE) {
      if (
        styleIds?.baseStyle?.colorMode &&
        styleIds?.baseStyle?.colorMode[COLOR_MODE]?.ids
      ) {
        styleIds.baseStyle.ids.push(
          ...styleIds.baseStyle.colorMode[COLOR_MODE].ids
        );
        styleIds.baseStyle.colorMode[COLOR_MODE].ids = [];
      }
    }
  }

  function setColorModeBaseStyleIdsDescendantForWeb(
    styleIds: any,
    COLOR_MODE: any
  ) {
    if (Platform.OS === 'web' && COLOR_MODE) {
      Object.keys(styleIds).forEach((descendentKey) => {
        if (
          styleIds[descendentKey]?.baseStyle?.colorMode &&
          styleIds[descendentKey]?.baseStyle?.colorMode[COLOR_MODE]?.ids
        ) {
          styleIds[descendentKey].baseStyle.ids.push(
            ...styleIds[descendentKey].baseStyle.colorMode[COLOR_MODE].ids
          );
          styleIds[descendentKey].baseStyle.colorMode[COLOR_MODE].ids = [];
        }
      });
    }
  }

  // END BASE COLOR MODE RESOLUTION

  const NewComp = (
    {
      as,
      //@ts-ignore
      isGroup,
      //@ts-ignore
      isGroupItem,
      parentGroupId,
      ...properties
    }: P &
      Partial<ComponentProps<ReactNativeStyles, Variants>> &
      Partial<UtilityProps<ReactNativeStyles>> & {
        as?: any;
      },
    ref: React.ForwardedRef<P>
  ) => {
    const groupComponentId = useId();
    const componentGroupIdWithPrefix = `group-id-${groupComponentId}`;

    const styledContext = useStyled();
    const CONFIG = useMemo(
      () => ({
        ...styledContext.config,
        propertyTokenMap,
      }),
      [styledContext.config]
    );

    const [COLOR_MODE, setCOLOR_MODE] = useState(get() as 'light' | 'dark');
    onChange((colorMode: any) => {
      setCOLOR_MODE(colorMode);
    });

    if (!styleHashCreated) {
      const themeHash = BUILD_TIME_PARAMS?.themeHash || stableHash(theme);
      // TODO: can be imoroved to boost performance
      componentExtendedConfig = CONFIG;
      if (ExtendedConfig) {
        componentExtendedConfig = deepMerge(CONFIG, ExtendedConfig);
      }
      if (!orderedResolved) {
        const styledResolved = styledToStyledResolved(
          theme,
          [],
          componentExtendedConfig
        );

        orderedResolved = styledResolvedToOrderedSXResolved(styledResolved);
        INTERNAL_updateCSSStyleInOrderedResolved(orderedResolved, themeHash);
      }
      if (Object.keys(styleIds).length === 0) {
        styleIds = getStyleIds(orderedResolved, componentStyleConfig);
      }

      componentStyleIds = styleIds.component;
      componentDescendantStyleIds = styleIds.descendant;

      setColorModeBaseStyleIdsForWeb(componentStyleIds, COLOR_MODE);
      setColorModeBaseStyleIdsDescendantForWeb(
        componentDescendantStyleIds,
        COLOR_MODE
      );

      /* Boot time */

      injectComponentAndDescendantStyles(orderedResolved, themeHash);

      styleHashCreated = true;
      /* Boot time */
    }

    const { states: contextSates, ...contextValue } = useContext(Context);

    const {
      cssIds: applyAncestorStyleCSSIds,
      passingProps: applyAncestorPassingProps,
    } = React.useMemo(() => {
      return getAncestorCSSStyleIds(componentStyleConfig, contextValue);
    }, [contextValue]);

    const incomingComponentProps = useMemo(() => {
      return {
        //@ts-ignore
        // ...theme?.baseStyle?.props,
        ...applyAncestorPassingProps, // As applyAncestorPassingProps is incoming props for the descendant component
        ...properties,
      };
    }, [properties, applyAncestorPassingProps]);

    const { variantProps } = getVariantProps(
      //@ts-ignore
      { ...theme?.baseStyle?.props, ...incomingComponentProps },
      theme
    );

    const sxComponentStyleIds = useRef({});
    const sxDescendantStyleIds = useRef({});
    const sxComponentPassingProps = useRef({});

    const applySxStyleCSSIds = useRef([]);

    const applySxDescendantStyleCSSIdsAndPropsWithKey = useRef({});

    const [applySxStateStyleCSSIds, setApplyStateSxStyleCSSIds] = useState([]);
    const [
      applySxDescendantStateStyleCSSIdsAndPropsWithKey,
      setApplySxDescendantStateStyleCSSIdsAndPropsWithKey,
    ] = useState({});

    const [componentStatePassingProps, setComponentStatePassingProps] =
      useState({});
    const [sxStatePassingProps, setSxStatePassingProps] = useState({});

    const {
      cssIds: applyComponentStyleCSSIds,
      passingProps: applyComponentPassingProps,
    } = React.useMemo(() => {
      return getMergedDefaultCSSIdsAndProps(
        //@ts-ignore
        componentStyleIds,
        variantProps,
        theme,
        incomingComponentProps
      );
    }, [variantProps, incomingComponentProps]);
    //
    //
    //
    //
    // passingProps is specific to current component
    const passingProps = React.useMemo(() => {
      return deepMergeObjects(
        applyComponentPassingProps,
        componentStatePassingProps,
        sxComponentPassingProps.current,
        sxStatePassingProps
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      applyComponentPassingProps,
      sxComponentPassingProps,
      sxStatePassingProps,
      componentStatePassingProps,
    ]);

    const mergedWithUtilityPropsAndPassingProps = {
      // ...restProps,
      ...passingProps,
      ...incomingComponentProps,
    };

    const {
      children,
      states,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      colorMode,
      sx: userSX,
      verboseSx,
      ...utilityAndPassingProps
    }: any = mergedWithUtilityPropsAndPassingProps;

    React.useEffect(() => {
      if (isGroup) {
        styledContext.updateGlobalGroupElementsStates({
          ...styledContext.globalGroupElementsStates,
          [componentGroupIdWithPrefix]: states,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [states]);

    const combinedStates = React.useMemo(() => {
      if (isGroupItem) {
        // return styledContext.globalGroupElementsStates[parentGroupId];
        return contextSates;
      } else {
        return states;
      }
    }, [
      states,
      isGroupItem,
      contextSates,
      // styledContext,
      //  parentGroupId
    ]);

    // Inline prop based style resolution
    const resolvedInlineProps = {};
    if (
      componentStyleConfig.resolveProps &&
      Object.keys(componentExtendedConfig).length > 0
    ) {
      componentStyleConfig.resolveProps.forEach((toBeResovledProp) => {
        if (utilityAndPassingProps[toBeResovledProp]) {
          let value = utilityAndPassingProps[toBeResovledProp];
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
                utilityAndPassingProps,
                toBeResovledProp,
                utilityAndPassingProps[toBeResovledProp]
              );
          }
          delete utilityAndPassingProps[toBeResovledProp];
        }
      });
    }

    // TODO: filter for inline props like variant and sizes
    const resolvedSXVerbosed = convertSxToSxVerbosed(userSX);
    const { sxProps: utilityResolvedSX, mergedProps: remainingComponentProps } =
      convertUtilityPropsToSX(
        componentExtendedConfig,
        componentStyleConfig?.descendantStyle,
        utilityAndPassingProps
      );

    const resolvedSxVerbose = deepMerge(utilityResolvedSX, resolvedSXVerbosed);
    const sx = deepMerge(resolvedSxVerbose, verboseSx);

    const [applyComponentStateStyleIds, setApplyComponentStateStyleIds] =
      useState([]);

    const applyDescendantsStyleCSSIdsAndPropsWithKey = React.useMemo(() => {
      return getMergeDescendantsStyleCSSIdsAndPropsWithKey(
        componentDescendantStyleIds,
        variantProps,
        theme,
        incomingComponentProps
      );
    }, [variantProps, incomingComponentProps]);

    const [
      applyDescendantStateStyleCSSIdsAndPropsWithKey,
      setApplyDescendantStateStyleCSSIdsAndPropsWithKey,
    ] = useState({});

    // ancestorCSSStyleId

    // const [applySxStyleCSSIds, setApplySxStyleCSSIds] = useState([]);

    // SX resolution

    // const styleTagId = useRef(`style-tag-sx-${stableHash(sx)}`);

    // FOR SX RESOLUTION

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

      const sxHash = stableHash(sx);
      const orderedSXResolved =
        styledResolvedToOrderedSXResolved(sxStyledResolved);

      INTERNAL_updateCSSStyleInOrderedResolved(
        orderedSXResolved,
        sxHash,
        false,
        'gs'
      );

      injectComponentAndDescendantStyles(orderedSXResolved, sxHash, 'inline');

      const sxStyleIds = getStyleIds(orderedSXResolved, componentStyleConfig);

      // Setting variants to sx property for inline variant resolution
      //@ts-ignore
      sxStyleIds.component.variants = componentStyleIds.variants;
      //@ts-ignore
      sxStyleIds.component.compoundVariants =
        componentStyleIds.compoundVariants;

      setColorModeBaseStyleIdsForWeb(sxStyleIds.component, COLOR_MODE);
      setColorModeBaseStyleIdsDescendantForWeb(
        sxStyleIds.descendant,
        COLOR_MODE
      );

      // setColorModeBaseStyleIdsForWeb(sxStyleIds.component, COLOR_MODE);
      // setColorModeBaseStyleIdsForWeb(sxStyleIds.descendant, COLOR_MODE);
      sxComponentStyleIds.current = sxStyleIds.component;
      sxDescendantStyleIds.current = sxStyleIds.descendant;
      //

      // SX component style
      //@ts-ignore
      const { cssIds: sxStyleCSSIds, passingProps: sxPassingProps } =
        getMergedDefaultCSSIdsAndProps(
          //@ts-ignore
          sxComponentStyleIds.current,
          variantProps,
          theme,
          incomingComponentProps,
          'inline'
        );

      //@ts-ignore
      applySxStyleCSSIds.current = sxStyleCSSIds;
      sxComponentPassingProps.current = sxPassingProps;
      // SX descendants

      //@ts-ignore
      applySxDescendantStyleCSSIdsAndPropsWithKey.current =
        getMergeDescendantsStyleCSSIdsAndPropsWithKey(
          sxDescendantStyleIds.current,
          variantProps,
          theme,
          incomingComponentProps,
          'inline'
        );
    }

    // Style ids resolution
    useEffect(() => {
      // for component style
      if (combinedStates || COLOR_MODE) {
        const { cssIds: mergedStateIds, passingProps: stateProps }: any =
          getMergedStateAndColorModeCSSIdsAndProps(
            //@ts-ignore
            componentStyleIds,
            combinedStates,
            variantProps,
            COLOR_MODE,
            theme
          );
        setApplyComponentStateStyleIds(mergedStateIds);

        setComponentStatePassingProps(stateProps);

        // for sx props
        const {
          cssIds: mergedSxStateIds,
          passingProps: mergedSxStateProps,
        }: any = getMergedStateAndColorModeCSSIdsAndProps(
          //@ts-ignore
          sxComponentStyleIds.current,
          combinedStates,
          variantProps,
          COLOR_MODE,
          theme,
          'inline'
        );
        setApplyStateSxStyleCSSIds(mergedSxStateIds);

        setSxStatePassingProps(mergedSxStateProps);

        // for descendants
        const mergedDescendantsStyle: any = {};
        Object.keys(componentDescendantStyleIds).forEach((key) => {
          const { cssIds: mergedStyle, passingProps: mergedPassingProps } =
            getMergedStateAndColorModeCSSIdsAndProps(
              //@ts-ignore

              componentDescendantStyleIds[key],
              combinedStates,
              variantProps,
              COLOR_MODE,
              theme
            );
          mergedDescendantsStyle[key] = {
            cssIds: mergedStyle,
            passingProps: mergedPassingProps,
          };
        });
        setApplyDescendantStateStyleCSSIdsAndPropsWithKey(
          mergedDescendantsStyle
        );

        // for sx descendants
        const mergedSxDescendantsStyle: any = {};
        Object.keys(sxDescendantStyleIds.current).forEach((key) => {
          const { cssIds: mergedStyle, passingProps: mergedPassingProps } =
            getMergedStateAndColorModeCSSIdsAndProps(
              //@ts-ignore
              sxDescendantStyleIds.current[key],
              combinedStates,
              variantProps,
              COLOR_MODE,
              theme
            );
          mergedSxDescendantsStyle[key] = {
            cssIds: mergedStyle,
            passingProps: mergedPassingProps,
          };
        });
        setApplySxDescendantStateStyleCSSIdsAndPropsWithKey(
          mergedSxDescendantsStyle
        );
      }

      // if (!mergedComponentProps) {
      //   setMergedComponentProps(themeProps);
      // }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [combinedStates, COLOR_MODE]);

    const descendentCSSIds = React.useMemo(() => {
      if (
        applyDescendantsStyleCSSIdsAndPropsWithKey ||
        applyDescendantStateStyleCSSIdsAndPropsWithKey ||
        applySxDescendantStateStyleCSSIdsAndPropsWithKey ||
        applySxDescendantStyleCSSIdsAndPropsWithKey ||
        contextValue
      ) {
        return mergeArraysInObjects(
          applyDescendantsStyleCSSIdsAndPropsWithKey,
          applyDescendantStateStyleCSSIdsAndPropsWithKey,
          applySxDescendantStyleCSSIdsAndPropsWithKey.current,
          applySxDescendantStateStyleCSSIdsAndPropsWithKey,
          contextValue
        );
      } else {
        return {};
      }
    }, [
      applyDescendantsStyleCSSIdsAndPropsWithKey,
      applyDescendantStateStyleCSSIdsAndPropsWithKey,
      applySxDescendantStateStyleCSSIdsAndPropsWithKey,
      applySxDescendantStyleCSSIdsAndPropsWithKey,
      contextValue,
    ]);

    const styleCSSIds = useMemo(
      () => [
        ...applyComponentStyleCSSIds,
        ...applyComponentStateStyleIds,
        ...applyAncestorStyleCSSIds,
        ...applySxStyleCSSIds.current,
        ...applySxStateStyleCSSIds,
      ],
      [
        applyComponentStyleCSSIds,
        applyComponentStateStyleIds,
        applyAncestorStyleCSSIds,
        applySxStateStyleCSSIds,
      ]
    );

    // ----- TODO: Refactor rerendering for Native -----
    let dimensions;
    if (Platform.OS !== 'web') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, react-hooks/rules-of-hooks
      dimensions = useWindowDimensions();
    }

    const resolvedStyleProps = generateStylePropsFromCSSIds(
      utilityAndPassingProps,
      styleCSSIds,
      globalStyleMap,
      CONFIG
      // currentWidth
    );

    // Prepare to be applied style based on specificity
    const finalStyleBasedOnSpecificity = useMemo(() => {
      let tempStyle = [] as any;
      if (passingProps?.style) {
        tempStyle.push(passingProps?.style);
      }
      if (resolvedStyleProps?.style) {
        tempStyle.push(resolvedStyleProps?.style);
      }
      if (remainingComponentProps?.style) {
        tempStyle.push(remainingComponentProps?.style);
      }
      return StyleSheet.flatten(tempStyle);
    }, [
      passingProps?.style,
      resolvedStyleProps?.style,
      remainingComponentProps?.style,
    ]);

    const AsComp: any = (as as any) || (passingProps.as as any) || undefined;

    // const remainingComponentPropsWithoutVariants = getRemainingProps
    const finalComponentProps = {
      ...passingProps,
      ...resolvedInlineProps,
      ...resolvedStyleProps,
      ...remainingComponentProps,
      style: finalStyleBasedOnSpecificity,
      ref,
    };

    let contextValues = descendentCSSIds;

    if (isGroup) {
      contextValues = {
        ...descendentCSSIds,
        states,
      };
    }

    // const clonedChildren = React.Children.map(children, (child: any) => {
    //   if (isGroup && React.isValidElement(child)) {
    //     return React.cloneElement(child, {
    //       //@ts-ignore
    //       ...child?.props,
    //       parentGroupId: componentGroupIdWithPrefix,
    //     });
    //   }
    //   return child;
    // });

    const component = !AsComp ? (
      <Component {...finalComponentProps}>{children}</Component>
    ) : (
      <AsComp {...finalComponentProps}>{children}</AsComp>
    );

    if (
      (componentStyleConfig?.descendantStyle &&
        componentStyleConfig?.descendantStyle?.length > 0) ||
      isGroup
    ) {
      return (
        <Context.Provider value={contextValues}>{component}</Context.Provider>
      );
    }
    return component;
  };

  const StyledComp = React.forwardRef(NewComp);
  StyledComp.displayName = Component?.displayName
    ? 'DankStyled' + Component?.displayName
    : 'DankStyledComponent';
  // @ts-ignore
  // StyledComp.config = componentStyleConfig;
  return StyledComp;
}

export function styled<P, Variants, Sizes>(
  Component: React.ComponentType<P>,
  theme: IThemeNew<Variants, P>,
  componentStyleConfig?: ConfigType,
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
  const sxConvertedObject = convertStyledToStyledVerbosed(theme);
  const StyledComponent = verboseStyled<P, Variants, Sizes>(
    Component,
    sxConvertedObject,
    componentStyleConfig,
    ExtendedConfig,
    BUILD_TIME_PARAMS
  );

  return StyledComponent;
}

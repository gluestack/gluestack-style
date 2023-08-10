import React, { useMemo } from 'react';
import type { IStyled, IStyledPlugin } from '@gluestack-style/react';
import { useStyled } from '@gluestack-style/react';
import {
  deepMerge,
  deepMergeObjects,
  setObjectKeyValue,
  resolvedTokenization,
} from './utils';
import { propertyTokenMap } from './propertyTokenMap';
import { LegendMotionDriver } from './LegendMotionDriver';
import { MotiDriver } from './MotiDriver';
function tokenizeAnimationPropsFromConfig(
  props: any = {},
  config: any,
  animationAliases: any,
  path: any = [],
  tokenizedAnimatedProps: any = {}
) {
  for (const prop in props) {
    if (Array.isArray(props[prop])) {
      path.push(prop);
      setObjectKeyValue(tokenizedAnimatedProps, path, props[prop]);
      path.pop();
    } else if (animationAliases[prop]) {
      path.push(prop);
      const tokenizedValue = resolvedTokenization(props[prop], config);
      setObjectKeyValue(tokenizedAnimatedProps, path, tokenizedValue);
      path.pop();
    } else if (typeof props[prop] === 'object') {
      path.push(prop);
      const tokenizedValue = resolvedTokenization(props[prop], config);
      setObjectKeyValue(tokenizedAnimatedProps, path, tokenizedValue);
      // path.pop();
      tokenizeAnimationPropsFromConfig(
        props[prop],
        config,
        animationAliases,
        path,
        tokenizedAnimatedProps
      );
      path.pop();
    } else {
      path.push(prop);
      setObjectKeyValue(tokenizedAnimatedProps, path, props[prop]);
      path.pop();
    }
  }

  return tokenizedAnimatedProps;
}

function getVariantProps(props: any, theme: any) {
  const variantTypes = theme?.variants ? Object.keys(theme.variants) : [];

  const restProps = { ...props };

  const variantProps: any = {};
  variantTypes?.forEach((variant) => {
    if (props[variant]) {
      variantProps[variant] = props[variant];
      // delete restProps[variant];
    }
  });

  return {
    variantProps,
    restProps,
  };
}

function resolveVariantAnimationProps(variantProps: any, styledObject: any) {
  let resolvedVariant = {};
  Object.keys(variantProps).forEach((variant) => {
    const variantValue = variantProps[variant];
    const variantObject = styledObject?.variants?.[variant]?.[variantValue];

    resolvedVariant = deepMerge(resolvedVariant, variantObject);
  });

  return resolvedVariant;
}

export class AnimationResolver implements IStyledPlugin {
  name: 'AnimationResolver';
  styledUtils: IStyled | undefined = {
    aliases: {
      ':animate': 'animate',
      ':initial': 'initial',
      ':exit': 'exit',
      ':initialProps': 'initialProps',
      ':animateProps': 'animateProps',
      ':transition': 'transition',
      ':transformOrigin': 'transformOrigin',
      ':whileTap': 'whileTap',
      ':whileHover': 'whileHover',
      ':onAnimationComplete': 'onAnimationComplete',
    },
  };
  driverName: 'moti' | 'legend/motion' = 'moti';
  Animated: any;
  animationResolverPlugin = this;
  register(styledUtils: IStyled) {
    if (this.styledUtils) {
      this.styledUtils.aliases = {
        ...this.styledUtils?.aliases,
        ...styledUtils?.aliases,
      };

      this.styledUtils.tokens = {
        ...this.styledUtils?.tokens,
        ...styledUtils?.tokens,
      };

      // if (styledUtils?.driver) {
      //   this.driverName = styledUtils?.driver.name;
      //   switch (styledUtils?.driver.name) {
      //     case 'moti':
      //       this.Animated = new MotiDriver(styledUtils?.driver.instance);
      //       break;
      //     case 'legend/motion':
      //       this.Animated = new LegendMotionDriver(
      //         styledUtils?.driver.instance
      //       );
      //       break;
      //     default:
      //       this.Animated = new MotiDriver(styledUtils?.driver.instance);
      //       break;
      //   }
      // }
      this.styledUtils.ref = styledUtils?.ref;
    }
  }

  constructor(styledUtils?: IStyled) {
    this.register(styledUtils);
    this.name = 'AnimationResolver';
  }

  #childrenExitPropsMap: any = {};

  #extendedConfig: any = {};

  inputMiddleWare(
    styledObj: any = {},
    shouldUpdateConfig: any = true,
    debug: boolean = false
  ) {
    // this.#childrenExitPropsMap = deepClone(styledObj);

    const resolvedAnimatedProps = this.updateStyledObject(
      styledObj,
      shouldUpdateConfig,
      {},
      [],
      debug
    );
    const resolvedStyledObjectWithAnimatedProps = deepMerge(
      styledObj,
      resolvedAnimatedProps
    );

    if (shouldUpdateConfig) {
      return styledObj;
    }
    return resolvedStyledObjectWithAnimatedProps;
  }

  updateStyledObject(
    styledObject: any = {},
    shouldUpdateConfig: boolean,
    resolvedStyledObject: any = {},
    keyPath: string[] = [],
    debug: boolean = false
  ) {
    const aliases = this.styledUtils?.aliases;
    for (const prop in styledObject) {
      if (typeof styledObject[prop] === 'object') {
        keyPath.push(prop);
        this.updateStyledObject(
          styledObject[prop],
          shouldUpdateConfig,
          resolvedStyledObject,
          keyPath,
          debug
        );
        keyPath.pop();
      }

      if (aliases && aliases?.[prop]) {
        if (shouldUpdateConfig) {
          // this.#childrenExitPropsMap[prop] = styledObject[prop];
          setObjectKeyValue(
            this.#childrenExitPropsMap,
            [...keyPath, prop],
            styledObject[prop]
          );
        }
        const value = styledObject[prop];
        keyPath.push('props', aliases[prop]);
        setObjectKeyValue(resolvedStyledObject, keyPath, value);
        keyPath.pop();
        keyPath.pop();
        delete styledObject[prop];
      }
    }
    return resolvedStyledObject;
  }

  componentMiddleWare({ Component, ExtendedConfig }: any) {
    const styledConfig = this.#childrenExitPropsMap;

    this.#childrenExitPropsMap = {};

    const NewComponent = React.forwardRef((props: any, ref?: any) => {
      const { sx, ...rest } = props;

      const styledContext = useStyled();
      const CONFIG = useMemo(
        () => ({
          ...styledContext.config,
          propertyTokenMap,
        }),
        [styledContext.config]
      );
      this.#extendedConfig = CONFIG;
      if (ExtendedConfig) {
        this.#extendedConfig = deepMerge(CONFIG, ExtendedConfig);
      }

      let tokenizedAnimatedProps: any = {};
      const { variantProps, restProps } = getVariantProps(rest, styledConfig);
      const variantStyledObject = resolveVariantAnimationProps(
        variantProps,
        styledConfig
      );
      const componentStyledObject = deepMerge(
        variantStyledObject,
        styledConfig
      );

      const animationAliases = this.styledUtils?.aliases;

      const config = this.#extendedConfig;

      tokenizedAnimatedProps = tokenizeAnimationPropsFromConfig(
        componentStyledObject,
        config,
        animationAliases
      );

      const tokenizedSxAnimationProps: any = tokenizeAnimationPropsFromConfig(
        sx,
        config,
        animationAliases
      );

      const mergedAnimatedProps = deepMerge(
        tokenizedAnimatedProps,
        tokenizedSxAnimationProps
      );

      const resolvedAnimatedStyledWithStyledObject = this.inputMiddleWare(
        mergedAnimatedProps,
        false
      );

      let isState = false;

      Object.keys(restProps?.states ?? {}).forEach((state: any) => {
        isState = restProps.states[state] ? true : false;
      });

      const animatedProps = !isState
        ? resolvedAnimatedStyledWithStyledObject?.props
        : {};

      return (
        <Component
          {...animatedProps}
          sx={resolvedAnimatedStyledWithStyledObject}
          {...restProps}
          ref={ref}
        />
      );
    });

    //@ts-ignore
    NewComponent.styled = {};
    //@ts-ignore
    NewComponent.styled.config = {};
    //@ts-ignore
    NewComponent.styled.config = styledConfig;

    NewComponent.displayName = 'StyledComponent';

    return NewComponent;
  }

  wrapperComponentMiddleWare() {
    const AnimatedPresenceComp = React.forwardRef(
      ({ children, ...props }: any, ref?: any) => {
        const clonedChildren: any = [];
        const styledContext = useStyled();
        const CONFIG = useMemo(
          () => ({
            ...styledContext.config,
            propertyTokenMap,
          }),
          [styledContext.config]
        );

        this.#extendedConfig = CONFIG;

        React.Children.toArray(children).forEach((child: any) => {
          if (child?.type?.displayName === 'StyledComponent') {
            let tokenizedAnimatedProps: any = {};
            const animationAliases = this.styledUtils?.aliases;

            const componentStyledObject = child?.type?.styled?.config;
            const { variantProps, restProps } = getVariantProps(
              child?.props,
              componentStyledObject
            );

            const config = CONFIG;

            if (child.type.styled.resolvedProps) {
              tokenizedAnimatedProps = child?.type?.styled?.resolvedProps;
            } else {
              const variantStyledObject = resolveVariantAnimationProps(
                variantProps,
                componentStyledObject
              );
              const componentStyledObjectWithVariants = deepMergeObjects(
                componentStyledObject,
                variantStyledObject
              );
              tokenizedAnimatedProps = tokenizeAnimationPropsFromConfig(
                componentStyledObjectWithVariants,
                config,
                animationAliases
              );

              child.type.styled.resolvedProps = tokenizedAnimatedProps;
            }

            const tokenizedSxAnimationProps: any =
              tokenizeAnimationPropsFromConfig(
                child?.props?.sx,
                config,
                animationAliases
              );

            const mergedAnimatedProps = deepMergeObjects(
              {},
              tokenizedSxAnimationProps,
              tokenizedAnimatedProps
            );

            const clonedChild = React.cloneElement(child, {
              exit: mergedAnimatedProps?.[':exit'],
              ...restProps,
            });
            clonedChildren.push(clonedChild);
          } else {
            clonedChildren.push(child);
          }
        });
        const AnimatePresence = this.Animated.AnimatePresence;

        return (
          <AnimatePresence ref={ref} {...props}>
            {clonedChildren}
          </AnimatePresence>
        );
      }
    );
    AnimatedPresenceComp.displayName = `AnimatePresence`;
    return {
      AnimatePresence: AnimatedPresenceComp,
    };
  }
}

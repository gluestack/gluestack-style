import React, { useMemo } from 'react';
import type { IStyled, IStyledPlugin } from '@dank-style/react';
import { useStyled } from '@dank-style/react';
import {
  deepMerge,
  deepMergeObjects,
  setObjectKeyValue,
  resolvedTokenization,
} from './utils';
import { AnimatePresence } from '@legendapp/motion';
import { propertyTokenMap } from './propertyTokenMap';

function tokenizeAnimationPropsFromConfig(
  props: any = {},
  config: any,
  animationAliases: any,
  path: any = [],
  tokenizedAnimatedProps: any = {}
) {
  for (const prop in props) {
    if (animationAliases[prop]) {
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

  register(styledUtils: any) {
    if (this.styledUtils) {
      this.styledUtils.aliases = {
        ...this.styledUtils?.aliases,
        ...styledUtils?.aliases,
      };

      this.styledUtils.tokens = {
        ...this.styledUtils?.tokens,
        ...styledUtils?.tokens,
      };

      this.styledUtils.ref = styledUtils?.ref;
    }
  }

  constructor(styledUtils?: IStyled) {
    this.register(styledUtils);
    this.name = 'AnimationResolver';
  }

  #childrenExitPropsMap: any = {};

  #extendedConfig: any = {};

  inputMiddleWare(styledObj: any = {}, shouldUpdateConfig: any = true) {
    // this.#childrenExitPropsMap = deepClone(styledObj);

    const resolvedAnimatedProps = this.updateStyledObject(
      styledObj,
      shouldUpdateConfig
    );
    const resolvedStyledObjectWithAnimatedProps = deepMergeObjects(
      resolvedAnimatedProps,
      styledObj
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
    keyPath: string[] = []
  ) {
    const aliases = this.styledUtils?.aliases;
    for (const prop in styledObject) {
      if (typeof styledObject[prop] === 'object') {
        keyPath.push(prop);
        this.updateStyledObject(
          styledObject[prop],
          shouldUpdateConfig,
          resolvedStyledObject,
          keyPath
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

  componentMiddleWare({ NewComp, extendedConfig }: any) {
    const styledConfig = this.#childrenExitPropsMap;

    this.#childrenExitPropsMap = {};

    const Component = React.forwardRef((props: any, ref: any) => {
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
      if (extendedConfig) {
        this.#extendedConfig = deepMerge(CONFIG, extendedConfig);
      }

      let tokenizedAnimatedProps: any = {};
      const { variantProps, restProps } = getVariantProps(rest, styledConfig);
      const variantStyledObject = resolveVariantAnimationProps(
        variantProps,
        styledConfig
      );
      const componentStyledObject = deepMergeObjects(
        styledConfig,
        variantStyledObject
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
        <NewComp
          {...animatedProps}
          sx={resolvedAnimatedStyledWithStyledObject}
          {...restProps}
          ref={ref}
        />
      );
    });

    //@ts-ignore
    Component.styled = {};
    //@ts-ignore
    Component.styled.config = {};
    //@ts-ignore
    Component.styled.config = styledConfig;

    Component.displayName = 'DankStyledComponent';

    return Component;
  }

  wrapperComponentMiddleWare() {
    const AnimatedPresenceComp = React.forwardRef(
      ({ children, ...props }: any, ref: any) => {
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
          if (child?.type?.displayName === 'DankStyledComponent') {
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
              ...mergedAnimatedProps,
              exit: mergedAnimatedProps?.[':exit'],
              ...restProps,
            });
            clonedChildren.push(clonedChild);
          } else {
            clonedChildren.push(child);
          }
        });

        return <AnimatePresence {...props}>{clonedChildren}</AnimatePresence>;
      }
    );

    AnimatedPresenceComp.displayName = `AnimatePresence`;

    return AnimatedPresenceComp;
  }
}

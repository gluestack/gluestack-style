import { getObjectProperty } from '../core/utils';
import { useStyled } from '../StyledProvider';

function isNumeric(str: string) {
  return typeof str === 'number' ? true : false;
  // return /^[-+]?[0-9]*\.?[0-9]+$/.test(str);
}

const resolveStringToken = (string: string, config: any, scale?: any) => {
  let typeofResult = 'string';
  const token_scale = scale;

  const splitTokenBySpace = string.split(' ');

  const result: any = splitTokenBySpace.map((currentToken) => {
    let splitCurrentToken = currentToken.split('$');

    if (currentToken.startsWith('$')) {
      splitCurrentToken = splitCurrentToken.slice(1);
    }

    if (splitCurrentToken.length > 1) {
      const tokenValue = getObjectProperty(config.tokens, splitCurrentToken);
      typeofResult = typeof tokenValue;
      return tokenValue;
    } else {
      if (
        config?.tokens[token_scale] &&
        config?.tokens[token_scale].hasOwnProperty(splitCurrentToken[0])
      ) {
        const tokenValue =
          config?.tokens?.[token_scale]?.[splitCurrentToken[0]];
        typeofResult = typeof tokenValue;

        if (typeof tokenValue !== 'undefined' && tokenValue !== null) {
          return tokenValue;
        } else {
          return '';
        }
      }
      return splitCurrentToken[splitCurrentToken.length - 1];
    }
  });

  let finalResult = result;

  if (finalResult.length !== 0 && finalResult[0] === '') {
    return undefined;
  } else {
    finalResult = result.join(' ');

    if (isNumeric(finalResult) || typeofResult === 'number') {
      return parseFloat(finalResult);
    } else {
      return finalResult;
    }
  }
};

const useTokens = (tokenScale: any, tokenKeys: Array<any> | any = []) => {
  const context = useStyled();

  const tokensArray = Array.isArray(tokenKeys) ? tokenKeys : [tokenKeys];

  const {
    config: { tokens },
  } = context;

  if (!tokenScale) {
    return tokens[tokenScale];
  }

  const resolvedTokenValue = tokensArray.map((tokenKey: any) => {
    const finalToken = resolveStringToken(tokenKey, context.config, tokenScale);

    return finalToken;
  });

  return resolvedTokenValue;
};

export default useTokens;

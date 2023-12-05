const borderStyles = 'borderStyles';
const borderWidths = 'borderWidths';
const colors = 'colors';
const mediaQueries = 'mediaQueries';
const opacity = 'opacity';
const fonts = 'fonts';
const fontSizes = 'fontSizes';
const fontWeights = 'fontWeights';
const letterSpacings = 'letterSpacings';
const lineHeights = 'lineHeights';
const radii = 'radii';
const shadows = 'shadows';
// const sizes = 'sizes';
const space = 'space';
const transitions = 'transitions';
const zIndices = 'zIndices';
export const propertyTokenMap = {
  gap: space,
  gridGap: space,
  columnGap: space,
  gridColumnGap: space,
  rowGap: space,
  gridRowGap: space,
  inset: space,
  insetBlock: space,
  insetBlockEnd: space,
  insetBlockStart: space,
  insetInline: space,
  insetInlineEnd: space,
  insetInlineStart: space,
  margin: space,
  marginTop: space,
  marginRight: space,
  marginBottom: space,
  marginLeft: space,
  marginBlock: space,
  marginBlockEnd: space,
  marginBlockStart: space,
  marginInline: space,
  marginInlineEnd: space,
  marginInlineStart: space,

  marginHorizontal: space,
  marginVertical: space,
  padding: space,
  paddingTop: space,
  paddingRight: space,
  paddingBottom: space,
  paddingLeft: space,

  paddingBlock: space,
  paddingBlockEnd: space,
  paddingBlockStart: space,
  paddingInline: space,
  paddingInlineEnd: space,
  paddingInlineStart: space,

  paddingHorizontal: space,
  paddingVertical: space,
  paddingStart: space,
  paddingEnd: space,

  top: space,
  right: space,
  bottom: space,
  left: space,
  scrollMargin: space,
  scrollMarginTop: space,
  scrollMarginRight: space,
  scrollMarginBottom: space,
  scrollMarginLeft: space,
  scrollMarginX: space,
  scrollMarginY: space,
  scrollMarginBlock: space,
  scrollMarginBlockEnd: space,
  scrollMarginBlockStart: space,
  scrollMarginInline: space,
  scrollMarginInlineEnd: space,
  scrollMarginInlineStart: space,
  scrollPadding: space,
  scrollPaddingTop: space,
  scrollPaddingRight: space,
  scrollPaddingBottom: space,
  scrollPaddingLeft: space,
  scrollPaddingX: space,
  scrollPaddingY: space,
  scrollPaddingBlock: space,
  scrollPaddingBlockEnd: space,
  scrollPaddingBlockStart: space,
  scrollPaddingInline: space,
  scrollPaddingInlineEnd: space,
  scrollPaddingInlineStart: space,
  // shadowOffset: space,
  shadowRadius: space,
  elevation: space,

  fontSize: fontSizes,

  background: colors,
  backgroundColor: colors,
  backgroundImage: colors,
  borderImage: colors,
  border: colors,
  borderBlock: colors,
  borderBlockEnd: colors,
  borderBlockStart: colors,
  borderBottom: colors,
  borderBottomColor: colors,
  borderColor: colors,
  borderInline: colors,
  borderInlineEnd: colors,
  borderInlineStart: colors,
  borderLeft: colors,
  borderLeftColor: colors,
  borderRight: colors,
  borderRightColor: colors,
  borderTop: colors,
  borderTopColor: colors,
  caretColor: colors,
  color: colors,
  columnRuleColor: colors,
  fill: colors,
  outline: colors,
  outlineColor: colors,
  stroke: colors,
  textDecorationColor: colors,
  shadowColor: colors,

  shadowOpacity: opacity,

  shadow: shadows,
  // Media Query
  condition: mediaQueries,

  fontFamily: fonts,

  fontWeight: fontWeights,

  lineHeight: lineHeights,

  letterSpacing: letterSpacings,

  blockSize: space,
  minBlockSize: space,
  maxBlockSize: space,
  inlineSize: space,
  minInlineSize: space,
  maxInlineSize: space,
  width: space,
  minWidth: space,
  maxWidth: space,
  height: space,
  minHeight: space,
  maxHeight: space,
  flexBasis: space,
  gridTemplateColumns: space,
  gridTemplateRows: space,

  borderWidth: borderWidths,
  borderTopWidth: borderWidths,
  borderRightWidth: borderWidths,
  borderBottomWidth: borderWidths,
  borderLeftWidth: borderWidths,

  borderStyle: borderStyles,
  borderTopStyle: borderStyles,
  borderRightStyle: borderStyles,
  borderBottomStyle: borderStyles,
  borderLeftStyle: borderStyles,

  borderRadius: radii,
  borderTopLeftRadius: radii,
  borderTopRightRadius: radii,
  borderBottomRightRadius: radii,
  borderBottomLeftRadius: radii,

  boxShadow: colors,
  textShadow: shadows,

  transition: transitions,

  zIndex: zIndices,
} as const;

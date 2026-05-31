import React, { useMemo } from 'react';
import { fitTextBox } from '../lib/autofit';

interface Props {
  text: string;
  width: number;
  height: number;
  fontFamily: string;
  color: string;
  maxFontSize: number;
  minFontSize?: number;
  lineHeight?: number;
  maxLines?: number;
  fontWeight?: number | string;
  letterSpacing?: string;
  textTransform?: React.CSSProperties['textTransform'];
  align?: 'flex-start' | 'center' | 'flex-end';
  vAlign?: 'flex-start' | 'center' | 'flex-end';
  textShadow?: string;
  italic?: boolean;
}

// Texto que se encaixa automaticamente na caixa (reduz fonte + quebra linha).
// Nunca ultrapassa width/height — base do "textos se encaixam automaticamente".
export const AutoText: React.FC<Props> = ({
  text,
  width,
  height,
  fontFamily,
  color,
  maxFontSize,
  minFontSize = 10,
  lineHeight = 1.05,
  maxLines = 2,
  fontWeight,
  letterSpacing,
  textTransform = 'none',
  align = 'center',
  vAlign = 'center',
  textShadow,
  italic = false,
}) => {
  const { fontSize, lines } = useMemo(
    () =>
      fitTextBox(text || '', width, height, {
        fontFamily,
        fontWeight,
        letterSpacing,
        textTransform,
        maxFontSize,
        minFontSize,
        lineHeight,
        maxLines,
      }),
    [text, width, height, fontFamily, fontWeight, letterSpacing, textTransform, maxFontSize, minFontSize, lineHeight, maxLines],
  );

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: vAlign,
        alignItems: align,
        overflow: 'hidden',
      }}
    >
      {lines.map((linha, i) => (
        <div
          key={i}
          style={{
            fontFamily,
            fontWeight,
            letterSpacing,
            textTransform,
            color,
            fontSize,
            lineHeight,
            textShadow,
            fontStyle: italic ? 'italic' : 'normal',
            textAlign:
              align === 'flex-start' ? 'left' : align === 'flex-end' ? 'right' : 'center',
            whiteSpace: 'nowrap',
          }}
        >
          {linha}
        </div>
      ))}
    </div>
  );
};

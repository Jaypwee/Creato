import styled, { css, createGlobalStyle } from 'styled-components';

// Common Reusable CSS Styles
export const mw1180 = css`
  max-width: 1180px;
`;

export const flexcenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const Button = styled.button`
  border-radius: 4px;
  height: 56px;
  border: none;
  font-size: 16px;
  font-weight: bold;
  color: ${({ theme }) => theme.common.color.white};
  background-color: ${({ theme }) => theme.common.color.green};

  &:disabled {
    background-color: ${({ theme }) => theme.common.color.fillDarkQuarternary};
  }
`;

export const Input = styled.input`
  width: 100%;
  padding-left: 12px;
  height: 42px;
  font-size: 14px;
  
`;

export const Margin = styled.div<{margin: string}>`
  margin: ${props => props.margin};
`

export const GreenHighlight = styled.span`
  color: ${({ theme }) => theme.common.color.green};
  font-weight: bold;
`;

export const GlobalStyles = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    background-color: ${({ theme }) => theme.background.color};
    color: ${({ theme }) => theme.background.text};
  }

  * {
    box-sizing: border-box;
    font-family: 'Roboto', "Apple SD Gothic Neo", "Noto Sans KR", Helvetica, sans-serif;
  }
`;

export const MaxWidth = styled.section`
  ${mw1180}

  width: 100%;
`;

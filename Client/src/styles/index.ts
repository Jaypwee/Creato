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

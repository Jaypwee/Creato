import * as React from 'react';
import { MaxWidth } from 'styles';
import { CreatoHeader } from './style';

const Header: React.FunctionComponent = () => {
  return (
    <CreatoHeader>
      <MaxWidth>Creato</MaxWidth>
    </CreatoHeader>
  );
};

export default Header;

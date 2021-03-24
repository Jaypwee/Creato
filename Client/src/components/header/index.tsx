import * as React from 'react';
import { MaxWidth } from 'styles';
import { ReactComponent as Logo } from 'assets/img-logo-kasabiz.svg';
import { KasaBizHeader } from './style';

const Header: React.FunctionComponent = () => {
  return (
    <KasaBizHeader>
      <MaxWidth>
        <Logo />
      </MaxWidth>
    </KasaBizHeader>
  );
};

export default Header;

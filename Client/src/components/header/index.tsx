import * as React from 'react';
import { MaxWidth } from 'styles';
import { CreatoHeader } from './style';
import { Link } from 'react-router-dom'
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

const Title = styled.div`
  font-size: 22px;
  font-weight: bold;
  width: 20%;
`;

const LinkContainer = styled.div`
  display: flex;
  align-items: center;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: white;
  font-weight: bold;
  margin-right: 16px;
  font-weight: 16px;
`;

const Header: React.FunctionComponent = () => {
  return (
    <CreatoHeader>
      <MaxWidth>
        <Container>
          <Title>Creato</Title>
          <StyledLink to="/">Home</StyledLink>
          <StyledLink to="/trade">Trading</StyledLink>
          <StyledLink to="/offerings">Offerings</StyledLink>
          <StyledLink to="/wallet">Wallet</StyledLink>
          <StyledLink to="/bank">Mock Bank</StyledLink>
        </Container>
      </MaxWidth>
    </CreatoHeader>
  );
};

export default Header;

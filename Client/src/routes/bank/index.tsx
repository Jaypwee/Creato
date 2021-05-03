
import React, { useState, useEffect } from 'react';
import { Button, flexcenter, Input, Margin, MaxWidth } from 'styles';
import styled from 'styled-components';
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux';
import { depositUSD, getSubscriptions } from 'api/balance';
import { isoDatetimeToDisplay } from 'utils';
import { SET_BALANCE } from 'reducers/balance';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
`;

const Title = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 32px;
`;

const LoginBox = styled.div`
  width: 550px;
  padding: 32px;
  border: 1px solid ${({ theme }) => theme.common.color.fillDarkQuarternary};
  border-radius: 4px;
  ${flexcenter}
  flex-direction: column;
`;

const ActionButton = styled(Button)`
  width: 50%;
  margin-top: 32px;

`;

const Info = styled.div`
  color: ${({ theme }) => theme.common.color.green};
  font-size: 12px;
  margin: 12px 0;
`;

const BankComponent: React.FunctionComponent = () => {
  const balance = useSelector((state: RootStateOrAny) => state.balance);
  const username = useSelector((state: RootStateOrAny) => state.auth.username);

  const [deposit, setDeposit] = useState(0);
  const [infoMessage, setinfoMessage] = useState('');
  
  const dispatch = useDispatch();

  const handleDeposit = async () => {
    const response = await depositUSD({ username, amount: deposit });
    dispatch({ type: SET_BALANCE, payload: { usdBalance: response.usdBalance }})
    setinfoMessage('Deposit Successful!')
  }

  return (
    <MaxWidth>
      <Container>
        <Title>Current USD Balance: {balance.usd}</Title>
        <LoginBox>
          <Title>Deposit USD</Title>
          <Input
            type="number"
            onChange={(e) => setDeposit(+e.target.value)}
            placeholder="Enter deposit amount"
          />
          { 
            infoMessage && 
              <Info>{infoMessage}</Info>
          }
          <ActionButton disabled={deposit < 1} onClick={handleDeposit}>Deposit</ActionButton>
        </LoginBox>
      </Container>
    </MaxWidth>
  );
};

export default BankComponent;

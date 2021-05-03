import React, { useState, useEffect } from 'react';
import { Button, Margin, MaxWidth } from 'styles';
import styled from 'styled-components';
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux';
import { getBalance, getSubscriptions } from 'api/balance';
import { isoDatetimeToDisplay } from 'utils';
import { unsubscribe } from 'api/token';
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

const Card = styled.div`
  height: 86px;
  width: 700px;
  padding: 16px;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  border: 1px solid ${({ theme }) => theme.common.color.fillDarkTertiary};
  align-items: center;
  cursor: pointer;
  background-color: ${({ theme }) => theme.common.color.bgBaseSecondary};
`;

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
  /* width: 20%; */
`;

const Wallet: React.FunctionComponent = () => {
  const balance = useSelector((state: RootStateOrAny) => state.balance);
  const username = useSelector((state: RootStateOrAny) => state.auth.username);

  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const dispatch = useDispatch();

  const initialize = async () => {
    const response = await getSubscriptions({ username });
    setSubscriptions(response as any);
    const bal = await getBalance({ username })
    dispatch({ type: SET_BALANCE, payload: { usdBalance: bal.usdBalance }});
  };

  const handleCancel = async (subscription) => {
    await unsubscribe(subscription.uuid);
    initialize();
  }

  useEffect(() => {
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MaxWidth>
      <Container>
        <Title>Total USD Balance: {balance.usd} USD</Title>
        <Margin margin="0 0 32px" />
        <Title>Subscribed Tokens</Title>
        {subscriptions.map((subscription) => (
          <Card key={subscription.uuid}>
            <CardTitle>{subscription.token.name}</CardTitle>
            <div>{isoDatetimeToDisplay(subscription.created_at)}</div>
            <Button onClick={() => handleCancel(subscription)}>Cancel</Button>
          </Card>
        ))}
        <Margin margin="0 0 32px" />
        <Title>Owned Tokens</Title>
        {
          balance.tokens.map(token => (
            <Card key={token.uuid}>
              <CardTitle>{token.name}</CardTitle>
              <div>i</div>
            </Card>
          ))
        }
      </Container>
    </MaxWidth>
  );
};

export default Wallet;

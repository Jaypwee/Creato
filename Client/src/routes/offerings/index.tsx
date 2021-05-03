import React, { useEffect, useState } from 'react';
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux'
import { getTokens, subscribe } from 'api/token';
import { MaxWidth, GreenHighlight, Input, Button } from 'styles';
import styled from 'styled-components';
import { formatDate } from 'utils';
import { getBalance } from 'api/balance';

import { AuthState } from 'reducers/auth'
import { Token } from 'models';
import { SET_BALANCE } from 'reducers/balance';

const Container = styled.div`
  display: flex;
  width: 100%;
  /* min-height: calc(100vh - 100px) */
  min-height: 90vh;
`;

const Title = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 32px;
`;

const MainContainer = styled.div`
  width: 70%;
  padding: 24px;
`;

const SideMenu = styled.aside`
  width: 30%;
  overflow-y: scroll;
  border: 1px solid ${({ theme }) => theme.common.color.fillDarkTertiary};
  border-top: none;
  border-bottom: none;
`;

const Card = styled.div`
  height: 86px;
  width: 100%;
  padding: 16px;
  font-size: 16px;
  display: flex;
  border: 1px solid ${({ theme }) => theme.common.color.fillDarkTertiary};
  align-items: center;
  cursor: pointer;
`;

const CardTitleBox = styled.div`
  width: 70%;
`;

const CardTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
`;

const CardSubtitle = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.common.color.textDarkTeritary};
`;

const CardProgress = styled.div`
  font-size: 18px;
  font-weight: bold;
`;

const Info = styled.div`
  margin: 8px;
  font-size: 16px;
`;

const ActionButton = styled(Button)`
  width: 260px;
  margin-top: 24px;
`;

const TokenComponent: React.FC = () => {
  const [tokenList, setTokenList] = useState<Token[]>([]);
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState(0);

  const usd = useSelector((state: RootStateOrAny )=> state.balance.usd);
  const username = useSelector((state: RootStateOrAny) => state.auth.username);

  const dispatch = useDispatch();

  const initialize = async () => {
    const tokens = await getTokens();
    setTokenList(tokens as Token[]);
  };

  const calculatePercent = (item: Token) => {
    const temp = ((item.subscribedAmount / item.issueLimit) * 100 as number).toFixed(2);
    return temp;
  };

  const handleSubscribe = async () => {
    try {
      await subscribe({
        tokenUuid: currentToken?.uuid,
        amount,
        username
      })
      const balance = await getBalance({ username });
      dispatch({ type: SET_BALANCE, payload: { usdBalance: balance.usdBalance }});
    } catch (e) {
      console.error(e);
      alert('Subscribe failed')
    }
  }

  useEffect(() => {
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MaxWidth>
      <Container>
        <SideMenu>
          {tokenList.map((item) => (
            <Card key={item.uuid} onClick={() => setCurrentToken(item)}>
              <CardTitleBox>
                <CardTitle>{item.name}</CardTitle>
                <CardSubtitle>{formatDate(new Date(item.created_at))}</CardSubtitle>
              </CardTitleBox>
              <CardProgress>{calculatePercent(item)}%</CardProgress>
            </Card>
          ))}
        </SideMenu>
        <MainContainer>
          <Title>Current Balance: <GreenHighlight>{usd}</GreenHighlight> USD</Title>
          {currentToken && (
            <>
              <Info>Token name: {currentToken.name}</Info>
              <Info>Offering amount: {currentToken.issueLimit}</Info>
              <Info>Remaining amount: {currentToken.issueLimit - currentToken.subscribedAmount}</Info>
              <br/>
              <Info>Subscribe amount:</Info>
              <Input type="number" onChange={(e)=>setAmount(+e.target.value)} placeholder="Enter amount" />
              <ActionButton disabled={amount < 1} onClick={handleSubscribe}>Subscribe</ActionButton>
            </>
          )}
        </MainContainer>
      </Container>
    </MaxWidth>
  );
};

export default TokenComponent;

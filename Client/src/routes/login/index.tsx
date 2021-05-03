import React, { useState, useEffect } from 'react';
import { MaxWidth, flexcenter, Button, Input, Margin } from 'styles';
import styled from 'styled-components';
import { signIn, signUp } from 'api/auth';

import { useDispatch } from 'react-redux';
import { LOGIN_SUCCESS } from 'reducers/auth'
import { SET_BALANCE, SET_TOKENS } from 'reducers/balance'
import { useHistory } from 'react-router';

const Container = styled.div`
  ${flexcenter}
  flex-direction: column;
  width: 100%;
  margin-top: 60px;
`;

const Title = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 32px;
`;

const Subtitle = styled.div`
  font-size: 18px;
  margin-bottom: 16px;
  margin-top: 16px;
  &:first-of-type {
    margin-top: 0;
  }
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
  &:first-of-type {
    margin: 0;
  }
`;

const Login: React.FunctionComponent = (): JSX.Element => {
  const [idx, setIdx] = useState(0);
  const [data, setData] = useState({});

  const dispatch = useDispatch();
  const history = useHistory();

  const handleInput = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSignUp = async () => {
    try {
      const response = await signUp(data);
      setIdx(1);
    } catch (e) {
      console.log(e);
      alert('There was an error. Please try again.');
    }
  };

  const handleSignIn = async () => {
    try {
      const response = await signIn(data);
      dispatch({ type: LOGIN_SUCCESS, payload: (response as {username: string}).username });
      dispatch({ type: SET_BALANCE, payload: (response as any).creatouser});
      dispatch({ type: SET_TOKENS, payload: (response as any).creatouser })
      history.push('/');
    } catch (e) {
      console.error(e);
      alert('There was an error. Please try again.');
    }
  };

  return (
    <MaxWidth>
      <Container>
        <Title>Welcome to Creato!</Title>
        <LoginBox>
          {
            // eslint-disable-next-line no-nested-ternary
            idx === 0 ? (
              <>
                <ActionButton onClick={() => setIdx(1)}>Sign Up</ActionButton>
                <ActionButton onClick={() => setIdx(2)}>Sign In</ActionButton>
              </>
            ) : idx === 1 ? (
              <>
                <Subtitle>Email</Subtitle>
                <Input type="email" name="email" onChange={handleInput} />
                <Subtitle>Password</Subtitle>
                <Input type="password" name="password" onChange={handleInput} />
                <Subtitle>Name</Subtitle>
                <Input type="text" name="username" onChange={handleInput} />
                <Margin margin="0 0 32px" />
                <ActionButton onClick={handleSignUp}>Sign Up</ActionButton>
              </>
            ) : (
              <>
                <Subtitle>Username</Subtitle>
                <Input type="text" name="username" onChange={handleInput} />
                <Subtitle>Password</Subtitle>
                <Input type="password" name="password" onChange={handleInput} />
                <Margin margin="0 0 32px" />
                <ActionButton onClick={handleSignIn}>Sign In</ActionButton>
              </>
            )
          }
        </LoginBox>
      </Container>
    </MaxWidth>
  );
};

export default Login;

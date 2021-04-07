import * as React from 'react';
import TradingChart from 'components/graph/TradingChart';
import { MaxWidth } from 'styles';

const Login: React.FunctionComponent = () => {
  return (
    <>
      <MaxWidth>
        <TradingChart />
      </MaxWidth>
    </>
  );
};

export default Login;

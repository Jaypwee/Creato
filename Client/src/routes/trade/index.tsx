import * as React from 'react';
import TradingChart from 'components/graph/TradingChart';
import AssetChart from 'components/graph/assetChart'
import { MaxWidth } from 'styles';

const Login: React.FunctionComponent = () => {
  return (
    <>
      <MaxWidth>
        <TradingChart />
        {/* <AssetChart/> */}
      </MaxWidth>
    </>
  );
};

export default Login;

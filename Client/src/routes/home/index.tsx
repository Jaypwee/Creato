import * as React from 'react';
import AreaChart from 'components/graph/assetChart';
import { MaxWidth } from 'styles';

const Home: React.FunctionComponent = () => {
  return (
    <MaxWidth>
      <AreaChart />
    </MaxWidth>
  );
};

export default Home;

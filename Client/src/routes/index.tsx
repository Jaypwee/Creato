import * as React from 'react';
import { Route, Switch } from 'react-router-dom';
import loadable from '@loadable/component';
import store, { history } from 'store';
import { ConnectedRouter } from 'connected-react-router';

// Components
import Header from 'components/header';
import { ThemeProvider } from 'styled-components';
import { Provider } from 'react-redux';
import theme from 'theme';
import { GlobalStyles } from 'styles';
import { MainContainer } from './style';

// Route-based code splitting
const Home = loadable(() => import('./home'));
const Login = loadable(() => import('./login'));
const Trade = loadable(() => import('./trade'));

const AppRouter: React.FC = () => {
  // FIXME: Props should be dynamic, but set as string for testing purposes

  return (
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <GlobalStyles />
          <Header />
          <MainContainer>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/trade" component={Trade} />
            </Switch>
          </MainContainer>
        </ConnectedRouter>
      </Provider>
    </ThemeProvider>
  );
};

export default AppRouter;

import * as React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import loadable from '@loadable/component';
import store, { history } from 'store';
import { ConnectedRouter } from 'connected-react-router';

// Components
import Header from 'components/header';
import { ThemeProvider } from 'styled-components';
import { Provider, RootStateOrAny, useSelector } from 'react-redux';
import theme from 'theme';
import { GlobalStyles } from 'styles';
import { MainContainer } from './style';
import { AuthState } from 'reducers/auth'

// Route-based code splitting
const Home = loadable(() => import('./home'));
const Login = loadable(() => import('./login'));
const Trade = loadable(() => import('./trade'));
const Offerings = loadable(() => import('./offerings'));
const Wallet = loadable(() => import('./wallet'));
const Bank = loadable(() => import('./bank'))

const PrivateRoute = ({ children, ...rest }) => {
  const username = useSelector((state: RootStateOrAny) => state.auth.username);
  console.log(username)
  return (
    <Route 
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
      render={() => {
        if(!username) {
          return <Redirect to={{pathname: '/login'}} />
        }

        return children;
      }}
    
    />
  )
}

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
              <PrivateRoute>
                <Route exact path="/trade" component={Trade} />
                <Route exact path="/offerings" component={Offerings} />
                <Route exact path='/wallet' component={Wallet} />
                <Route exact path='/bank' component={Bank} />
              </PrivateRoute>
            </Switch>
          </MainContainer>
        </ConnectedRouter>
      </Provider>
    </ThemeProvider>
  );
};

export default AppRouter;

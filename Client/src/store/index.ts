import { applyMiddleware, createStore, Store } from 'redux';
import { createBrowserHistory } from 'history';
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction';

import createRootReducer from 'reducers';
import { routerMiddleware } from 'connected-react-router';


export const history = createBrowserHistory();

const store: Store = createStore(
  createRootReducer(history),
  composeWithDevTools(applyMiddleware(routerMiddleware(history)))
)

export default store;

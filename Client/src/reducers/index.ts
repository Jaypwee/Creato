import { combineReducers, CombinedState } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
import auth from './auth'
import balance from './balance'

const createRootReducer = (history: History): CombinedState<any> =>
  combineReducers({
    auth,
    balance,
    router: connectRouter(history)
  });

export default createRootReducer;

import { combineReducers, CombinedState } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';

const createRootReducer = (history: History): CombinedState<any> =>
  combineReducers({
    router: connectRouter(history)
  });

export default createRootReducer;

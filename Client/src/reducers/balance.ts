import {Token} from "models";

export interface BalanceState {
  usd: number | null;
  tokens: Token[]
}

const initialState: BalanceState = {
  usd: null,
  tokens: []
}

export const SET_BALANCE = 'set balance'
export const SET_TOKENS = 'set tokens'

const balanceReducer = (state=initialState, action) => {
  const { payload } = action;
  switch(action.type) {
    case SET_BALANCE:
      return { ...state, usd: payload.usdBalance };
    case SET_TOKENS:
      return { ...state, tokens: payload.tokens}
    default:
      return state;
  }
}

export default balanceReducer;

// Selectors

export const getUSDBalance = ({ balance }) => balance.usd;
export const getTokenBalances = ({ balance }) => balance.tokens;

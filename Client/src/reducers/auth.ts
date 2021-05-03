
export interface AuthState {
  username: string | null;
}

const initialState: AuthState = {
  username: null
}

export const LOGIN_SUCCESS = 'login successful'

const authReducer = (state=initialState, action) => {
  const { payload } = action;
  switch(action.type) {
    case LOGIN_SUCCESS:
      return { ...state, username: payload };
    default:
      return state;
  }
}

export default authReducer;

// Selectors

export const getLogin = ({ auth }) => auth.username;
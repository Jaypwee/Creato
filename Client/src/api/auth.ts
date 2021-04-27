import api from '.';

// eslint-disable-next-line import/prefer-default-export
export const signUp = async (data) => {
  const response = await api({
    url: '/signUp',
    method: 'POST',
    data
  })

  return response;
}

export const signIn = async (data) => {
  const response = await api({
    url: '/signIn',
    method: 'POST',
    data
  });

  return response;
}
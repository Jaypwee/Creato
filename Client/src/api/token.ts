import api, { CreatoData } from '.';

// eslint-disable-next-line import/prefer-default-export
export const getTokens = async () => {
  const response = await api({
    url: '/tokens',
    method: 'GET'
  })

  return response;
}

export const subscribe = async (data) => {
  const response = await api({
    url: '/subscribe',
    method: 'POST',
    data
  })

  return response;
}

export const unsubscribe = async (uuid) => {
  const response = await api({
    url: `/unsubscribe/${uuid}`,
    method: 'DELETE'
  })

  return response;
}

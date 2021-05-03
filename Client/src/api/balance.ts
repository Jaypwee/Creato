// eslint-disable-next-line import/no-cycle
import {Token} from 'models';
import api from '.';

interface TokenBalance {
  token: Token;
  amount: number;
}

export interface Balance {
  usdBalance: number;
  balance: TokenBalance[]
}

export const getBalance = async (data) => {
  const response = await api({
    url: '/balance',
    method: 'POST',
    data
  })

  return response as Balance;
}

export const addBalance = async (data) => {
  const response = await api({
    url: '/addBalance',
    method: 'POST',
    data
  });

  return response;
}

export const getSubscriptions = async (data) => {
  const response = await api({
    url: '/subscriptions',
    method: 'POST',
    data
  });

  return response;
}

export const depositUSD = async (data) => {
  const response = await api({
    url: '/deposit',
    method: 'POST',
    data
  });

  return response as Balance;
}

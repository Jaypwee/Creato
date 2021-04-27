import axios, { AxiosRequestConfig, Method } from 'axios';

interface CreatoBaseHeaders {
  ['Content-Type']: string;
  Accept: string;
  Authorization?: string;
}

export interface CreatoData<T> {
  data: T;
}

const creatoBaseHeaders: CreatoBaseHeaders = {
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

export interface CreatoAxiosRequestConfig extends AxiosRequestConfig {
  url: string;
  method: Method;
  needAuth?: boolean;
}

function getCookie(name) {
  let cookieValue: string | null = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i += 1) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === `${name}=`) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default async function api<T>(config: CreatoAxiosRequestConfig): Promise<T> {
  const csrftoken = getCookie('csrftoken');
  const cheaders = { ...config.headers, 'X-CSRFToken': csrftoken };

  const headers = { ...creatoBaseHeaders, ...cheaders };
  console.log(process.env.REACT_APP_API_HOST)
  const url = `http://localhost:8000${config.url}`;

  const isExternalUrl = config.url.indexOf('://') > -1 || config.url.indexOf('//') > -1;

  if (isExternalUrl) {
    throw new axios.Cancel('External url is injected');
  }

  const response = (
    await axios({
      ...config,
      headers,
      url
    })
  ).data;

  return response;
}

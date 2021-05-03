export function numberWithCommas(x: number | string | undefined): string {
  if (!x) {
    return '';
  }
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
}

export function formatDate(date: Date | undefined): string {
  if (!date) {
    return '';
  }
  const year = date.getFullYear();
  const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();

  return `${year}-${month}-${day}`;
}

export function isoDatetimeToDisplay(value: string | number): string {
  if (!value) {
    return '';
  }

  const dateTime = new Date(value);

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(dateTime.getTime()) && typeof value === 'string') {
    return value;
  }

  return dateTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}


export function formatHHMM(date: Date | undefined): string {
  if (!date) {
    return '';
  }
  const hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  const minute = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();

  return `${hour}:${minute}`;
}

export function getUTCTimestamp(date: string | undefined): number {
  if (!date) {
    return -1;
  }
  return new Date(date).getTime();
}

export function formatDecimal(value: number | string, decimal = 2): string {
  let numValue = +value;

  // eslint-disable-next-line no-restricted-globals
  if (isNaN(numValue)) {
    return '0';
  }

  const decimalPoint = 10 ** decimal;

  // for (let i = 0; i < decimal; i++) {
  //   numValue = numValue * 10;
  // }

  numValue *= decimalPoint;
  numValue = Math.round(numValue);

  // for (let i = 0; i < decimal; i++) {
  //   numValue = numValue / 10;
  // }

  numValue /= decimalPoint;

  return numValue.toString();
}

/**
 *
 * @param ts: Timestamp of a certain date.
 *
 * Timestamp를 파라미터로 제공받으면 그 날의 시장이 열린 timestamp를 리턴한다. (xxxx-xx 09:00)
 */
export function getTimestampOfOpenMarket(ts: number): number {
  if (!ts) {
    return 0;
  }

  const date = new Date(ts);
  return new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 09:00`).getTime();
}

/**
 *
 * @param ts Timestamp of certain date.
 *
 * Timestamp를 파라미터로 제공받으면 그 전날의 시장이 닫은 timestamp를 리턴한다.
 */
export function getTimestampOfClosedMarket(ts: number): number {
  if (!ts) {
    return 0;
  }

  const date = new Date(ts);
  let day;
  if (date.getDay() === 1) {
    day = date.getDate() - 3;
  } else if (date.getDay() === 0) {
    day = date.getDate() - 2;
  } else {
    day = date.getDate() - 1;
  }
  const month = date.getDate() > 0 ? date.getMonth() : date.getMonth() - 1;
  const year = date.getFullYear();
  return new Date(year, month, day, 18).getTime();
}

import { CandleData, ChartSize } from 'models/chart';
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { RefObject, Suspense, useContext, useEffect, useRef, useState } from 'react';
import {
  axisBottom,
  axisRight,
  bisect,
  curveCardinal,
  extent,
  interpolateNumber,
  line,
  pointer,
  range,
  scaleBand,
  scaleLinear,
  scalePoint,
  scaleQuantize,
  select,
  selectAll
} from 'd3';
import {
  formatDate,
  formatDecimal,
  formatHHMM,
  getTimestampOfClosedMarket,
  getTimestampOfOpenMarket,
  numberWithCommas
} from 'utils';
import styled, { DefaultTheme, ThemeContext } from 'styled-components';

import MenuDownIcon from 'mdi-react/MenuDownIcon';
import MenuUpIcon from 'mdi-react/MenuUpIcon';
import { TickerData } from 'models/ticker';
import axios from 'axios';

/**
 * ------------------------STYLED COMPONENTS------------------------
 */

const TradingChartContainer = styled.section`
  position: relative;
  width: 781px;
  height: 320px;
  overflow: hidden;
`;

const TradeLabelContainer = styled.div`
  position: absolute;
  top: 16px;
  right: 64px;
  font-size: 10px;
  display: flex;
  align-items: center;
`;

const TradeCurrent = styled.span`
  border-right: 1px solid ${({ theme }) => theme.common.color.separatorDarkTertiary};
  padding-right: 12px;
  display: flex;
  align-items: center;
`;

const TradeLabel = styled.span`
  color: ${({ theme }) => theme.common.color.textDarkSecondary};
  margin-left: 8px;
  user-select: none;
`;

const TradeValue = styled.span`
  font-family: Roboto;
  color: ${({ theme }) => theme.common.color.white};
  margin-left: 4px;
  user-select: none;
`;

const Text = styled.text`
  font-size: 10px;
  background: #fff;
  user-select: none;
  pointer-events: none;
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.common.color.textDarkSecondary};
  font-family: Roboto;
  display: flex;
`;

const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
  user-select: none;
`;

const DropdownButton = styled.div<{ isSelected: boolean }>`
  border-radius: 2px;
  background-color: ${({ isSelected, theme }) =>
    isSelected ? theme.common.color.bgBaseSecondary : 'rgba(0,0,0,0)'};
  display: flex;
  width: 48px;
  height: 24px;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  cursor: pointer;
`;

const DropdownBox = styled.div<{ isSelected: boolean }>`
  position: absolute;
  width: 104px;
  top: 26px;
  left: 0;
  display: ${({ isSelected }) => (isSelected ? 'block' : 'none')};
  background-color: ${({ theme }) => theme.common.color.bgBaseSecondary};
  border-radius: 2px;

  div:nth-child(5),
  div:nth-child(7) {
    border-bottom: 1px solid ${({ theme }) => theme.common.color.separatorDarkSecondary};
  }
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
`;

/**
 * ------------------------CONSTANTS & UTIL FN------------------------
 */

const sizes: ChartSize = {
  graphHeight: 290,
  height: 320,
  marginBottom: 44,
  marginLeft: 0,
  marginRight: 48,
  marginTop: 44,
  textPadding: 8,
  textPaddingTop: 4,
  width: 781
};

const graphWidth = sizes.width - sizes.marginRight - 14;
const EPOCH = 60 * 60 * 1000;
const now = new Date();
const nowTick = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
let nextTick;
const OPENTIME = 9 * EPOCH;
// 안보이는 데이터 기준 leftBorderPixel 에서 몇번째 index에 새로 api호출하는지 정하는 상수.
const APICALLTHRESHOLD = 100;
const timeLabels = ['1m', '3m', '5m', '15m', '30m', '1hr', '3hr'];
const typeLabels = ['Line', 'Candle'];
const calculateTo = () => {
  let t;
  if (now.getHours() > 17) {
    t = new Date().setHours(18, 0, 0, 0);
  } else if (now.getHours() < 9) {
    t = getTimestampOfClosedMarket(now.getTime());
  } else {
    t = now.getTime();
  }
  return t;
};
// Number of grid points inside the viewBox
let apiInterval;
let timeInterval;
// let to = calculateTo();
let to = new Date(2020, 7, 12, 18, 0, 0, 0).getTime();
// TE Engine currently down
// Variables used to modify Graph domains.
let MINY;
let MAXY;
let MAXVOL;
let from;
let dragTranslate = 0;
let leftBorderPixel = 0;
let rightBorderPixel = sizes.width - sizes.marginRight;
let isDragging = false;
let xSnapshot;
let leftSaved;
let rightSaved;
let mappedData: any = [];
let recentMappedData: any = [];
let recentTimeStamp;
let oldestTimeStamp;
let nextTimeTick;
let leftIdx;
let rightIdx;

// X-axis, y-axis data scales.
let X;
let Y;
let volumeX;
let volumeY;

const mapData = (data: CandleData) => {
  return data.t.map((t, i) => {
    return {
      c: data.c[i],
      h: data.h[i],
      l: data.l[i],
      o: data.o[i],
      t,
      v: data.v[i]
    };
  });
};

const textRectCreator = (id) => {
  const bbox = select(`text#${id}`).node().getBBox();
  select(`#${id}Rect`)
    .attr('width', bbox.width + sizes.textPadding * 2)
    .attr('height', bbox.height + sizes.textPaddingTop * 2)
    .attr('x', bbox.x - sizes.textPadding)
    .attr('y', bbox.y - sizes.textPaddingTop);
};

interface TickData {
  t: number,
  c: number,
  o: number,
  h: number,
  l: number,
  v: number
}

const TradingChart: React.FC = () => {
  // Ref hooks
  const linePathRef = useRef<SVGPathElement>(null);
  const mouseOverRef = useRef<SVGRectElement>(null);
  const tradeCurrentRef = useRef<HTMLSpanElement>(null);
  const tradePercentRef = useRef<HTMLSpanElement>(null);
  const tradeOpenRef = useRef<HTMLSpanElement>(null);
  const tradeCloseRef = useRef<HTMLSpanElement>(null);
  const tradeHighRef = useRef<HTMLSpanElement>(null);
  const tradeLowRef = useRef<HTMLSpanElement>(null);
  const tradeVolumeRef = useRef<HTMLSpanElement>(null);
  // State hooks
  const [chartType, setChartType] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<number>(1);
  const [ticker, setTicker] = useState<TickerData>({
    close: 0,
    fluctuation: 0,
    fluctuationRate: 0,
    high: 0,
    last: 0,
    low: 0,
    open: 0,
    referencePrice: 0,
    totalTrade: 0,
    volume: 0
  });
  const initialData = {
    c: [],
    h: [],
    l: [],
    o: [],
    s: '',
    t: [],
    v: []
  };
  const [data, setData] = useState<CandleData>({ ...initialData });
  const [dataLength, setDataLength] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [test, setTest] = useState<any>([1]);
  const [dropdownSelected, setDropdownSelected] = useState(0);
  const theme = useContext(ThemeContext);
  // Variables that should not trigger react lifecycle
  // Some depend on data change
  let lastClose = 0;
  let lastVol = 0;
  let lastHigh = 0;
  let lastLow = 0;
  let lastOpen = 0;
  if (data) {
    lastClose = data.c[dataLength - 1];
    lastHigh = data.h[dataLength - 1];
    lastLow = data.l[dataLength - 1];
    lastVol = data.v[dataLength - 1];
    lastOpen = data.o[dataLength - 1];
  }
  const isLineChart = chartType === 0;
  let resolution;
  if (timeRange === 60 * 24 * 7) {
    resolution = '1W';
  } else if (timeRange === 60 * 24) {
    resolution = '1D';
  } else {
    resolution = timeRange;
  }
  /**
   * 4시간, 1일 및 1주 단위의 tick은 tick 개수별로 axis 설정을 해야하기 때문에 따로 count를 저장해놓는다.
   *
   * 이럴 때는 그리드 하나의 12개의 데이터포인트가 있게 설정한다. 기준은 최근으로부터 잡아야하기 때문에, 아래와 같은 initial 로직이 추가된다.
   * 렌더 할때마다 리셋되어야 한다.
   */
  let tickCount = 1 - (dataLength % 12);
  let monthPointer = -1;

  // Logic just used for testing purposes
  const apiRequest = async () => {
    // const res = (
    //   await axios.get(
    //     `https://te.x.staging.kr.kasa.exchange/charts/candles?symbol=KR011A20000013&resolution=${resolution}&from=${from}&to=${to}`
    //   )
    // ).data.data;

    // return res;
    // const tempData: TickData[] = [];
    // const ts = new Date().getTime();

    // for (let i = 0; i < 300; i += 1) {
    //   tempData.push({
    //     t: ts - 6000 * i,
    //     c: 5.5,
    //     h: 6,
    //     l: 5.4,
    //     o: 5.7,
    //     v: 3000
    //   })
    // }
    // return tempData;
  };

  const apiRequestInterval = async () => {
    let t = to;
    let f = from;
    if (new Date().getHours() > 18) {
      t = new Date().setHours(18);
    } else if (new Date().getHours() < 9) {
      t = getTimestampOfClosedMarket(new Date().getTime());
    } else {
      t = new Date().getTime();
    }
    f = t - timeRange * 3 * 60 * 1000;
    const res = (
      await axios.get(
        `https://te.x.staging.kr.kasa.exchange/charts/candles?symbol=KR011A20000013&resolution=${resolution}&from=${f}&to=${t}`
      )
    ).data.data;
    const tempData = { ...data };
    if (res.t) {
      const resLength = res.t.length;
      const lastIdx = tempData.t.length - 1;
      const mappedLastIdx = mappedData.length - 1;
      if (!recentTimeStamp) {
        recentTimeStamp = res.t[resLength - 1];
      }
      if (res.t[resLength - 1] !== recentTimeStamp) {
        console.log('new Timestamp!');
        recentTimeStamp = res.t[resLength - 1];
        mappedData.push({
          c: res.c[resLength - 1],
          h: res.h[resLength - 1],
          l: res.l[resLength - 1],
          o: res.o[resLength - 1],
          t: res.t[resLength - 1],
          v: res.v[resLength - 1]
        });
        Object.keys(tempData).forEach((key) => {
          if (key !== 's') {
            tempData[key].push(res[key][resLength - 1]);
          }
        });
        console.log(mappedData);
      } else {
        Object.keys(tempData).forEach((key) => {
          if (key !== 's') {
            tempData[key][lastIdx] = res[key][resLength - 1];
            mappedData[mappedLastIdx][key] = res[key][resLength - 1];
          }
        });
        console.log(tempData.c[lastIdx], mappedData[lastIdx].c);
        setData(tempData);
        setDataLength(tempData.t.length);
      }
    }
  };

  const fetchData = async (timeRangeChanged = false) => {
    let toSubtract = 4 * timeRange * EPOCH;
    from = to;
    while (toSubtract > 0) {
      const diff = from - getTimestampOfOpenMarket(from);
      if (toSubtract - diff <= 0) {
        from -= toSubtract;
        toSubtract -= diff;
      } else {
        toSubtract -= diff;
        from = getTimestampOfClosedMarket(from);
      }
    }
    // console.log(new Date(from), new Date(to));
    const res = await apiRequest();
    to = from - 1;
    const tempData = timeRangeChanged ? { ...initialData } : { ...data };
    // if (!res.t) {
    // fetchData();
    // } else {
      // Object.keys(tempData).forEach((key) => {
      //   if (key !== 's') {
      //     tempData[key].unshift(...res[key]);
      //   }
      // });
      // const tickerRes = (
      //   await axios.get(
      //     `https://te.x.staging.kr.kasa.exchange/exchange/ticker?marketIDs=KR011A20000013`
      //   )
      // ).data.data;
      // // Check if recentTimestamp is different (It means a new tick data has been received)
      // const mapArr = mapData(res);
      // mappedData.unshift(...mapArr);
      // recentMappedData = mapArr;
      // setInitialized(true);
      // setData({ ...tempData });
      // setDataLength(tempData.t.length);
      // setTicker(tickerRes);
    // }
  };

  useEffect(() => {
    dragTranslate = 0;
    leftBorderPixel = 0;
    rightBorderPixel = sizes.width - sizes.marginRight;
    select('#volumeBar').selectAll('rect').remove();
  }, [chartType]);

  useEffect(() => {
    if (initialized) {
      // Need to update now
      // to = calculateTo();
      select('#volumeBar').selectAll('rect').remove();
      to = new Date(2020, 7, 12, 18, 0, 0, 0).getTime();
      setData({ ...initialData });
      setDataLength(0);
      fetchData(true);
    }
  }, [timeRange]);

  const handleTimeRange = (e: React.MouseEvent<HTMLDivElement, Event>): void => {
    const target = e.target as HTMLDivElement;
    mappedData = [];
    recentMappedData = [];
    dragTranslate = 0;
    select('#volumeBar').selectAll('rect').remove();
    switch (target.id) {
      case '0':
        setTimeRange(1);
        break;
      case '1':
        setTimeRange(3);
        break;
      case '2':
        setTimeRange(5);
        break;
      case '3':
        setTimeRange(15);
        break;
      case '4':
        setTimeRange(30);
        break;
      case '5':
        setTimeRange(60);
        break;
      case '6':
        setTimeRange(240);
        break;
      case '7':
        setTimeRange(60 * 24);
        break;
      case '8':
        setTimeRange(60 * 24 * 7);
        break;
      default:
        setTimeRange(1);
    }
  };

  const tickFormatter = (d): string => {
    const date = new Date(d);
    if (monthPointer !== date.getMonth()) {
      monthPointer = date.getMonth();
      return `${date.getMonth() + 1}M`;
    }
    // Switch case for formatting Days / Months
    switch (timeRange) {
      case 1:
      case 3:
      case 5:
      case 10:
      case 15:
      case 30:
      case 60:
        if (date.getHours() === 9 && date.getMinutes() === 0) {
          return `${date.getDate()}D`;
        }
        break;
      case 240:
      case 60 * 24:
      case 60 * 24 * 7:
        if (tickCount === 12) {
          tickCount = 0;
          return `${date.getDate()}D`;
        }
        tickCount += 1;
        break;
      default:
        return '';
    }
    // Switch Case for formatting HH:MM
    switch (timeRange) {
      case 1:
        if (date.getMinutes() % 15 === 0) {
          return formatHHMM(date);
        }
        break;
      case 3:
        if (date.getMinutes() % 30 === 0) {
          return formatHHMM(date);
        }
        break;
      case 5:
        if (date.getMinutes() === 0) {
          return formatHHMM(date);
        }
        break;
      case 15:
        if (date.getHours() % 3 === 0 && date.getMinutes() === 0) {
          return formatHHMM(date);
        }
        break;
      case 30:
        if (date.getHours() === 13 && date.getMinutes() === 0) {
          return formatHHMM(date);
        }
        break;
      default:
        if (date.getMinutes() % 15 === 0) {
          return formatHHMM(date);
        }
    }
    return '';
  };

  const prettifyTick = (i, n) => {
    n[i].childNodes[0].y2.baseVal.value = -1 * sizes.width;
    n[i].childNodes[0].y1.baseVal.value = 6;
    n[i].childNodes[0].setAttribute('stroke', theme.common.color.separatorDarkPrimary);
    n[i].childNodes[0].setAttribute('opacity', 0.6);
  };

  const tickRemover = (d, i, n): void => {
    const date = new Date(d);
    switch (timeRange) {
      case 1:
        if (date.getMinutes() % 15 !== 0) {
          n[i].remove();
          return;
        }
        break;
      case 3:
        if (date.getMinutes() % 30 !== 0) {
          n[i].remove();
          return;
        }
        break;
      case 5:
        if (date.getMinutes() !== 0) {
          n[i].remove();
          return;
        }
        break;
      case 15:
        if (date.getHours() % 3 !== 0 || date.getMinutes() !== 0) {
          n[i].remove();
          return;
        }
        break;
      case 30:
        if ((date.getHours() !== 9 && date.getHours() !== 13) || date.getMinutes() !== 0) {
          n[i].remove();
          return;
        }
        console.log(date);
        break;
      case 60:
        if (date.getHours() !== 9 || date.getMinutes() !== 0) {
          n[i].remove();
          return;
        }
        break;
      case 240:
      case 60 * 24:
      case 60 * 24 * 7:
        if (tickCount !== 12) {
          tickCount += 1;
          n[i].remove();
          return;
        }
        tickCount = 0;
        break;
      default:
        return;
    }
    prettifyTick(i, n);
  };

  // Test data initialization
  useEffect(() => {
    fetchData();
    // if (!apiInterval) {
    //   apiInterval = setInterval(apiRequestInterval, 2000);
    // }
  }, []);
  /**
   * 아래 useEffect 코드는 새로운 데이터가 뒤에 추가 되거나 혹은 드래그를 하여 그래프가 바뀔 때 사용되는 코드이다.
   * 그래프 자체를 redraw 하는 코드가 있을 거기 때문에 Expensive 하다.
   * 실시간으로 최근 데이터가 변경될 때 처리하는 코드는 이 다음에 있는 useEffect를 참고
   *
   * 추후 최적화 필요.
   */
  useEffect(() => {
    if (dataLength > 0) {
      console.log('DATA', data);
      const handleTickerColor = (d, ind): string => {
        if (ind > 0) {
          if (d[ind] > d[ind - 1]) {
            return theme.common.color.red;
          }
          if (d[ind] < d[ind - 1]) {
            return theme.common.color.blue;
          }
        }
        return theme.common.color.white;
      };

      const setTickerData = (ind) => {
        select(tradeCloseRef.current)
          .text(data.c[ind])
          .attr('style', `color:${handleTickerColor(data.c, ind)}`);
        select(tradeOpenRef.current)
          .text(data.o[ind])
          .attr('style', `color:${handleTickerColor(data.o, ind)}`);
        select(tradeHighRef.current)
          .text(data.h[ind])
          .attr('style', `color:${handleTickerColor(data.h, ind)}`);
        select(tradeLowRef.current)
          .text(data.l[ind])
          .attr('style', `color:${handleTickerColor(data.l, ind)}`);
        select(tradeVolumeRef.current).text(data.v[ind]);
      };

      const MINDATE = data.t[0];
      const MAXDATE = data.t[dataLength - 1];
      const TIMERANGE = timeRange * 60 * 1000;
      // // Initialize x-scale
      const domains = data.t;
      let isCallingApi = false;

      const findMinMax = (left: number, right: number) => {
        let minVal = Infinity;
        let maxVal = 0;
        let maxVol = 0;

        if (isLineChart) {
          for (let i = left; i < right + 1; i += 1) {
            minVal = minVal < data.c[i] ? minVal : data.c[i];
            maxVal = maxVal < data.c[i] ? data.c[i] : maxVal;
            maxVol = maxVol < data.v[i] ? data.v[i] : maxVol;
          }
        } else {
          for (let i = left; i < right + 1; i += 1) {
            minVal = minVal < data.l[i] ? minVal : data.l[i];
            maxVal = maxVal < data.h[i] ? data.h[i] : maxVal;
            maxVol = maxVol < data.v[i] ? data.v[i] : maxVol;
          }
        }

        return [minVal, maxVal, maxVol];
      };

      // Initial Ticker Set when open is 0
      if (select(tradeOpenRef.current).node().innerText === '0') {
        setTickerData(dataLength - 1);
      }

      const xRangeLeft = (graphWidth / 105) * dataLength;

      /**
       * If line graph, x should be scalePoint
       * If candlechart graph, x should be scaleBand
       */

      if (isLineChart) {
        X = scalePoint()
          .domain(domains)
          .range([graphWidth - xRangeLeft, graphWidth]);
      } else {
        X = scaleBand()
          .paddingInner(0.4)
          .domain(domains)
          .range([graphWidth - xRangeLeft, graphWidth]);
      }

      const xDomain = X.domain();
      const xRange = X.range();
      const scale = scaleQuantize().domain(xRange).range(xDomain);
      const rangePoints = range(xRange[0], xRange[1] + 0.1, X.step());
      if (isLineChart) {
        X.invert = (v) => {
          return scale(v);
        };
      } else {
        X.invert = (v) => {
          const idx0 = bisect(rangePoints, v);
          const idx1 = bisect(rangePoints, v) - 1;
          // console.log(xDomain[bisect(rangePoints, v)], v);
          // Point to the right of v
          const d0 = X(xDomain[idx0]);
          // Point to the left of v
          const d1 = X(xDomain[idx1]);
          // Find the nearest point
          // return d;
          const d = d0 - v > v - d1 ? d1 : d0;
          return scale(d) || new Date();
        };
      }
      X.invertIdx = (v) => {
        const idx = bisect(rangePoints, v) - 1;
        return idx;
      };
      // Linechart needs interpolation
      leftIdx = bisect(data.t, X.invert(leftBorderPixel));
      rightIdx = bisect(data.t, X.invert(rightBorderPixel));

      // let rightIdx = dataLength - 1;
      [MINY, MAXY, MAXVOL] = findMinMax(leftIdx, rightIdx - 1);
      console.log(MINY, MAXY);
      // FIXME: Add initial Interpolation
      Y = scaleLinear()
        .domain([MINY, MAXY])
        .range([sizes.graphHeight - sizes.marginBottom, sizes.marginTop]);

      volumeX = scaleBand()
        .paddingInner(0.25)
        .align(0.5)
        .domain(domains)
        .range([graphWidth - xRangeLeft, graphWidth]);

      /**
       * FIXME: Dynamic MaxVol calculation when mouseup event fires.
       */
      volumeY = scaleLinear()
        .domain([0, MAXVOL])
        .range([sizes.graphHeight, sizes.graphHeight - 30]);

      const drawHoverLines = (x, y, ind) => {
        const date = new Date(data.t[ind]);
        select('#mouse-horizontal').attr('d', `M${sizes.width},${y} 0, ${y}`);
        select('#mouse-vertical').attr('d', `M${x},${sizes.height} ${x},0`);
        select('#priceText')
          .attr('y', y)
          .text(numberWithCommas(Math.round(Y.invert(y) / 10) * 10));
        select('#dateText')
          .attr('x', x)
          .text(`${formatDate(date)} ${formatHHMM(date)}`);

        textRectCreator('priceText');
        textRectCreator('dateText');

        setTickerData(ind);
      };

      let lineVal = line()
        .x((d) => X(d.t))
        .y((d) => Y(d.c));

      // console.log(X(data.t[dataLength - 1]));
      // console.log(xRangeLeft);

      if (oldestTimeStamp !== recentMappedData[0].t) {
        // console.log('hello', mappedData);
        console.log(select('#volumeBar').selectAll('rect'));
        select('#volumeBar')
          .selectAll('.bar')
          .data(recentMappedData)
          .enter()
          .append('rect')
          .attr('id', (d) => d.t)
          .attr('x', (d) => X(d.t) - volumeX.bandwidth() / 2)
          .attr('width', volumeX.bandwidth())
          .attr('y', (d) => volumeY(d.v))
          .attr('height', (d) => sizes.graphHeight - volumeY(d.v))
          .attr('fill', (d, i) => {
            if (!isLineChart) {
              return theme.common.color.fillDarkTertiary;
            }
            if (i > 0) {
              if (data.c[i - 1] > d.c) {
                return theme.common.color.blue;
              }
            }
            return theme.common.color.red;
          });
        oldestTimeStamp = recentMappedData[0].t;
      } else {
        // 새로 데이터가 추가될 때마다 기존의 모든 volume 을 지우고 다시 만든다. 최적화 필요
        // 하지만 어떻게?
        // Join 을 사용
        console.log(select('#volumeBar').selectAll('rect').data(mappedData));
        select('#volumeBar').selectAll('rect').remove();
        select('#volumeBar')
          .selectAll('rect')
          .data(mappedData)
          .enter()
          .append('rect')
          .attr('id', (d) => d.t)
          .attr('x', (d) => X(d.t))
          .attr('width', volumeX.bandwidth())
          .attr('y', (d) => volumeY(d.v))
          .attr('height', (d) => sizes.graphHeight - volumeY(d.v))
          .attr('fill', (d, i) => {
            if (!isLineChart) {
              return theme.common.color.fillDarkTertiary;
            }
            if (i > 0) {
              if (data.c[i - 1] > d.c) {
                return theme.common.color.blue;
              }
            }
            return theme.common.color.red;
          });
      }

      if (!isLineChart) {
        select('#candlestick')
          .selectAll('rect')
          .data(mappedData)
          .join(
            (enter) =>
              enter
                .append('rect')
                .attr('id', (d) => `candle-${d.t}`)
                .attr('x', (d) => X(d.t))
                .attr('y', (d) => Y(Math.max(d.o, d.c)))
                .attr('width', X.bandwidth())
                .attr('height', (d) => (d.o === d.c ? 1 : Math.abs(d.o - d.c)))
                .attr('fill', (d) => {
                  if (d.o === d.c) {
                    return theme.common.color.textDarkTeritary;
                  }
                  return d.o > d.c ? theme.common.color.blue : theme.common.color.red;
                }),
            (update) =>
              update
                .attr('x', (d) => X(d.t))
                .attr('y', (d) => Y(Math.max(d.o, d.c)))
                .attr('height', (d) => (d.o === d.c ? 1 : Math.abs(d.o - d.c)))
                .attr('fill', (d) => {
                  if (d.o === d.c) {
                    return theme.common.color.textDarkTeritary;
                  }
                  return d.o > d.c ? theme.common.color.blue : theme.common.color.red;
                })
          );

        select('#candlestick')
          .selectAll('line')
          .data(mappedData)
          .join(
            (enter) =>
              enter
                .append('line')
                .attr('id', (d) => `line-${d.t}`)
                .attr('x1', (d) => X(d.t) + X.bandwidth() / 2)
                .attr('x2', (d) => X(d.t) + X.bandwidth() / 2)
                .attr('y1', (d) => Y(d.l))
                .attr('y2', (d) => Y(d.h))
                .attr('stroke', (d) => {
                  if (d.o === d.c) {
                    return theme.common.color.textDarkTeritary;
                  }
                  return d.o > d.c ? theme.common.color.blue : theme.common.color.red;
                })
                .attr('stroke-width', 1),
            (update) =>
              update
                .attr('class', 'updatted')
                .attr('y1', (d) => Y(d.l))
                .attr('y2', (d) => Y(d.h))
                .attr('stroke', (d) => {
                  if (d.o === d.c) {
                    return theme.common.color.textDarkTeritary;
                  }
                  return d.o > d.c ? theme.common.color.blue : theme.common.color.red;
                })
          );
      }

      const drawGraph = () => {
        if (isLineChart) {
          lineVal = line()
            .x((d) => X(d.t))
            .y((d) => Y(d.c));

          select(linePathRef.current)
            .data([mappedData])
            .attr('d', lineVal)
            .attr('transform', `translate(${-1 * dragTranslate}, 0)`);
        } else {
          select('#candlestick').attr('transform', `translate(${-1 * dragTranslate}, 0)`);
        }
        select('#x-axis').attr(
          'transform',
          `translate(${-1 * dragTranslate}, ${sizes.height - 28})`
        );

        select('#volumeBar').attr('transform', `translate(${-1 * dragTranslate}, 0)`);

        select('#y-axis')
          .call(axisRight(Y).ticks(6))
          .call((g) => g.select('.domain').remove())
          .call((g) =>
            g
              .selectAll('.tick text')
              .attr('fill', theme.common.color.textDarkQuarternary)
              .attr('style', 'user-select:none')
          )
          .call((g) => {
            g.selectAll('.tick line')
              .attr('x1', -1 * xRangeLeft)
              .attr('opacity', 0.6)
              .attr('stroke', theme.common.color.separatorDarkPrimary);
          })
          .attr('transform', `translate(${sizes.width - sizes.marginRight}, 0)`);
      };

      select('#x-axis')
        .call((g) =>
          g.selectAll('.tick').attr('style', 'user-select:none').attr('pointer-events', 'none')
        )
        .call(axisBottom(X).tickFormat(tickFormatter))
        .call((g) => g.select('.domain').remove())
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', theme.common.color.textDarkQuarternary)
            .attr('style', 'user-select:none')
        )
        .call((g) => {
          g.selectAll('.tick').each((d, i, n) => {
            // Reset tickCount that was modified in the tickFormatter;
            // This time, it subtracts from 0 due to different logic
            tickCount = 0 - (dataLength % 12);
            tickRemover(d, i, n);
          });
        });

      select('#y-axis').call((g) => {
        g.selectAll('.tick').attr('style', 'user-select:none').attr('pointer-events', 'none');
      });
      // Dynamic change
      drawGraph();
      // Mouseover events
      select('#mouseover')
        .on('mouseout', () => {
          selectAll('.hover').style('opacity', 0);
        })
        .on('mouseover', () => {
          selectAll('.hover').style('opacity', 1);
          // select('#mouse-horizontal').style('opacity', 1);
          // select('#priceText').style('opacity', 1);
          // select('#dateText').style('opacity', 1);
        })
        .on('mousedown.start', function snapShot(this) {
          isDragging = true;
          [xSnapshot] = pointer(this);
        })
        .on('mouseup.end', () => {
          isDragging = false;
          if (leftIdx < APICALLTHRESHOLD && !isCallingApi) {
            isCallingApi = true;
            fetchData();
          }
          if (!isLineChart) {
            // for (let i = leftIdx - 1; i < rightIdx + 2; i += 1) {
            //   select(`candle-${data[i].t}`)
            //     .attr('y', Y(Math.max(data[i].o, data[i].c)))
            //     .attr('height', data[i].o === data[i].c ? 1 : Math.abs(data[i].o - data[i].c));
            //   select(`line-${data[i].t}`)
            //     .attr('y', Y(Math.max(data[i].o, data[i].c)))
            //     .attr('height', data[i].o === data[i].c ? 1 : Math.abs(data[i].o - data[i].c));
            // }
            // select('#candlestick')
            //   .selectAll('line')
            //   .data(mappedData)
            //   .join('rect')
            //   .attr('y', (d) => Y(Math.max(d.o, d.c)))
            //   .attr('height', (d) => (d.o === d.c ? 1 : Math.abs(d.o - d.c)))
            //   .attr('fill', (d) => {
            //     if (d.o === d.c) {
            //       return theme.common.color.textDarkTeritary;
            //     }
            //     return d.o > d.c ? theme.common.color.blue : theme.common.color.red;
            //   })
            // select('#candlestick')
            //   .selectAll('line')
            //   .data(mappedData)
            //   .join('line')
            //   .attr('y1', (d) => Y(d.l))
            //   .attr('y2', (d) => Y(d.h))
            //   .attr('stroke', (d) => {
            //     if (d.o === d.c) {
            //       return theme.common.color.textDarkTeritary;
            //     }
            //     return d.o > d.c ? theme.common.color.blue : theme.common.color.red;
            //   })
          }
        })
        .on('mousemove', function mouseMove(this) {
          const mouseVal = pointer(this);
          const idx = X.invertIdx(mouseVal[0]);
          const idxWithDrag = X.invertIdx(mouseVal[0] + dragTranslate);
          const hoverX =
            parseFloat(select(`rect[id='${data.t[idx]}']`).attr('x')) + volumeX.bandwidth() / 2;
          // console.log(data.t[idx]);
          // console.log(select(`rect[id='${data.t[idx]}']`));
          drawHoverLines(hoverX, mouseVal[1], idxWithDrag);

          if (isDragging) {
            leftIdx = X.invertIdx(leftBorderPixel);
            rightIdx = X.invertIdx(rightBorderPixel);
            const leftCurr = leftIdx - 1;
            const rightCurr = rightIdx;
            // One day tick left
            const leftNext = leftIdx;
            // One day tick right
            const rightNext = rightIdx === 0 ? 0 : rightIdx - 1;

            if (leftSaved !== undefined && rightSaved !== undefined) {
              if (leftSaved !== leftIdx) {
                // console.log((data as any)[leftIdx], leftIdx);
                [MINY, MAXY, MAXVOL] = findMinMax(leftIdx - 1, rightIdx);
                // volumeY.domain([0, MAXVOL]);
                // select('#volumeBar')
                //   .selectAll('rect')
                //   .data(mappedData)
                //   .attr('y', (d) => volumeY(d.v))
                //   .attr('height', (d) => sizes.graphHeight - volumeY(d.v));
              }
              if (rightSaved !== rightIdx) {
                [MINY, MAXY, MAXVOL] = findMinMax(leftIdx - 1, rightIdx);
                // volumeY.domain([0, MAXVOL]);
                // select('#volumeBar')
                //   .selectAll('rect')
                //   .data(mappedData)
                //   .attr('y', (d) => volumeY(d.v))
                //   .attr('height', (d) => sizes.graphHeight - volumeY(d.v));
              }
            }
            leftSaved = leftIdx;
            rightSaved = rightIdx;
            let newMin;
            let newMax;

            if (isLineChart) {
              let interpolateLeft = MINY;
              let interpolateRight = MAXY;
              const lInt = interpolateNumber(data.c[leftNext], data.c[leftCurr]);
              interpolateLeft = lInt(
                (leftBorderPixel - X(new Date(data.t[leftNext]))) /
                  (X(new Date(data.t[leftCurr])) - X(new Date(data.t[leftNext])))
              );
              const rInt = interpolateNumber(data.c[rightNext], data.c[rightCurr]);
              interpolateRight = rInt(
                (X(new Date(data.t[rightNext])) - rightBorderPixel) /
                  (X(new Date(data.t[rightNext])) - X(new Date(data.t[rightCurr])))
              );
              newMin = interpolateLeft < MINY ? interpolateLeft : MINY;
              newMax = interpolateRight > MAXY ? interpolateRight : MAXY;
            } else {
              newMin = data.l[leftCurr] > data.l[rightCurr] ? data.l[rightCurr] : data.l[leftCurr];
              newMax = data.h[leftCurr] > data.h[rightCurr] ? data.h[leftCurr] : data.h[rightCurr];
            }
            Y.domain([newMin, newMax]);
            volumeY.domain([0, MAXVOL]);

            if (dragTranslate - (mouseVal[0] - xSnapshot) <= 0) {
              dragTranslate -= mouseVal[0] - xSnapshot;
              leftBorderPixel = dragTranslate;
              rightBorderPixel = sizes.width - sizes.marginRight + dragTranslate;
            }

            [xSnapshot] = mouseVal;
            drawGraph();
          }
        });
    }
  }, [dataLength, chartType]);

  useEffect(() => {
    console.log('close updated', lastClose);

    // Maybe create two paths? One path for history and one path for the last two points.
    if (Y) {
      if (rightIdx === dataLength - 1) {
        if (MINY > lastClose) {
          MINY = lastClose;
        } else if (MAXY < lastClose) {
          MAXY = lastClose;
        }
        console.log('domain change');
        Y.domain([MINY, MAXY]);
      }
      if (isLineChart) {
        const lineVal = line()
          .x((d) => X(d.t))
          .y((d) => Y(d.c));
        select(linePathRef.current).data([mappedData]).attr('d', lineVal);
      } else {
        let candleColor = theme.common.color.textDarkTeritary;
        if (lastOpen !== lastClose) {
          candleColor = lastOpen > lastClose ? theme.common.color.blue : theme.common.color.red;
        }
        select(`candle-${data.t[dataLength - 1]}`)
          .attr('y', (d) => Y(Math.max(d.o, d.c)))
          .attr('height', (d) => (d.o === d.c ? 1 : Math.abs(d.o - d.c)))
          .attr('fill', candleColor);
      }
      if (lastClose) {
        selectAll('.last').attr('opacity', 1);
        select('#last-horizontal').attr('d', `M${sizes.width},${Y(lastClose)} 0, ${Y(lastClose)}`);
        select('#lastText')
          .attr('y', Y(lastClose) + sizes.textPaddingTop / 2)
          .text(numberWithCommas(lastClose));
      } else {
        selectAll('.last').attr('opacity', 0);
      }
      textRectCreator('lastText');
    }
  }, [lastClose]);

  useEffect(() => {
    if (!isLineChart) {
      select(`line-${data.t[dataLength - 1]}`)
        .attr('y1', lastLow)
        .attr('y2', lastHigh);
    }
  }, [lastLow, lastHigh]);

  useEffect(() => {
    console.log('volume updated');
    if (volumeY) {
      if (MAXVOL < lastVol) {
        MAXVOL = lastVol;
        volumeY.domain([0, MAXVOL]);
        select('#volumeBar')
          .selectAll('rect')
          .data(mappedData)
          .attr('y', volumeY(lastVol))
          .attr('height', sizes.graphHeight - volumeY(lastVol));
      } else {
        select('#volumeBar')
          .select(`rect[id='${data.t[dataLength - 1]}']`)
          .attr('y', volumeY(lastVol))
          .attr('height', sizes.graphHeight - volumeY(lastVol))
          .attr(
            'fill',
            data.c[dataLength - 2] > data.c[dataLength - 1]
              ? theme.common.color.blue
              : theme.common.color.red
          );
      }
    }
  }, [lastVol]);

  return (
    <TradingChartContainer>
      {/* -------------------------- 좌측 상단 드롭다운 -------------------------- */}
      <DropdownContainer>
        <DropdownWrapper>
          <DropdownButton
            isSelected={dropdownSelected === 1}
            onClick={() =>
              dropdownSelected !== 1 ? setDropdownSelected(1) : setDropdownSelected(0)
            }
          >
            <span>1분</span>
            <MenuDownIcon size={12} color={theme.common.color.textDarkSecondary} />
          </DropdownButton>
          <DropdownBox isSelected={dropdownSelected === 1}>
            {timeLabels.map((label, i) => (
              <DropdownItem id={i.toString()} key={label} onClick={handleTimeRange}>
                {label}
              </DropdownItem>
            ))}
          </DropdownBox>
        </DropdownWrapper>
        <DropdownWrapper>
          <DropdownButton
            isSelected={dropdownSelected === 2}
            onClick={() =>
              dropdownSelected !== 2 ? setDropdownSelected(2) : setDropdownSelected(0)
            }
          >
            <span>{typeLabels[chartType]}</span>
            <MenuDownIcon size={12} color={theme.common.color.textDarkSecondary} />
          </DropdownButton>
          <DropdownBox isSelected={dropdownSelected === 2}>
            {typeLabels.map((label, i) => (
              <DropdownItem key={label} onClick={() => setChartType(i)}>
                {label}
              </DropdownItem>
            ))}
          </DropdownBox>
        </DropdownWrapper>
      </DropdownContainer>
      {/* -------------------------- 우측 상단에 있는 Ticker 정보 DOM -------------------------- */}
      <TradeLabelContainer>
        <TradeCurrent>
          <TradeValue ref={tradeCurrentRef}>current</TradeValue>
          <MenuUpIcon size={16} color={theme.common.color.red} />
          <TradeValue ref={tradePercentRef}>Percent</TradeValue>
        </TradeCurrent>
        <TradeLabel>S</TradeLabel>
        <TradeValue ref={tradeOpenRef}>0</TradeValue>
        <TradeLabel>H</TradeLabel>
        <TradeValue ref={tradeHighRef}>0</TradeValue>
        <TradeLabel>C</TradeLabel>
        <TradeValue ref={tradeCloseRef}>0</TradeValue>
        <TradeLabel>L</TradeLabel>
        <TradeValue ref={tradeLowRef}>0</TradeValue>
        <TradeLabel>Vol</TradeLabel>
        <TradeValue ref={tradeVolumeRef}>0</TradeValue>
      </TradeLabelContainer>
      {/* -------------------------- 차트 SVG DOM 요소 -------------------------- */}
      <svg
        id="mainSvg"
        onClick={() => dropdownSelected !== 0 && setDropdownSelected(0)}
        viewBox={`0, 0, ${sizes.width}, ${sizes.height}`}
      >
        <defs>
          <clipPath id="graphRect">
            <rect x="0" y="0" width={sizes.width - sizes.marginRight} height={sizes.height} />
          </clipPath>
        </defs>

        <BaseGrid theme={theme} data={data} />
        {/* -------------------------- 차트 SVG 컨테이너 내 그래프가 보여지는 SVG 영역 -------------------------- */}
        <svg width={sizes.width - sizes.marginRight} height={sizes.height}>
          <path
            id="mouse-vertical"
            strokeDasharray="1,3"
            className="hover"
            strokeWidth="1"
            stroke="rgba(236,236,248,0.35)"
            clipPath="url(#graphRect)"
          />
          <path
            id="mouse-horizontal"
            strokeDasharray="1,3"
            className="hover"
            strokeWidth="1"
            stroke="rgba(236, 236, 248, 0.35)"
            clipPath="url(#graphRect)"
          />
          <g id="x-axis" />
          <g id="volumeBar" opacity="0.5" />
          <path
            id="last-horizontal"
            className="last"
            strokeDasharray="2,2"
            strokeWidth="1"
            stroke={theme.common.color.green}
            clipPath="url(#graphRect)"
          />
          {chartType === 0 ? (
            <LineChart linePathRef={linePathRef} theme={theme} />
          ) : (
            <CandleChart linePathRef={linePathRef} theme={theme} />
          )}
        </svg>
        <rect
          id="dateTextRect"
          className="hover"
          height={20}
          fill={theme.common.color.bgElevatedSecondary}
        />
        <rect id="lastTextRect" className="last" height={20} fill={theme.common.color.green} />
        <Text
          id="lastText"
          className="last"
          fill="#fff"
          x={sizes.width - sizes.marginRight + sizes.textPadding}
        />
        <rect
          id="priceTextRect"
          className="hover"
          height={20}
          fill={theme.common.color.bgElevatedSecondary}
        />
        <Text
          id="priceText"
          className="hover"
          x={sizes.width - sizes.marginRight + sizes.textPadding}
          fill="#fff"
        />
        <Text
          id="dateText"
          className="hover"
          textAnchor="middle"
          y={sizes.graphHeight + 10 + sizes.textPaddingTop}
          fill="#fff"
        />
        <rect
          id="mouseover"
          width={sizes.width - sizes.marginRight}
          height={sizes.graphHeight}
          fill="none"
          pointerEvents="all"
        />
      </svg>
    </TradingChartContainer>
  );
};

export default TradingChart;

interface BaseGridProps {
  theme: DefaultTheme;
  data: CandleData;
}

const BaseGrid: React.FC<BaseGridProps> = ({ theme, data }: BaseGridProps) => {
  return (
    <>
      <rect
        x="0"
        y="0"
        height={sizes.height}
        width={sizes.width}
        rx="2"
        fillOpacity="0"
        strokeWidth="1"
        stroke={theme.common.color.separatorDarkPrimary}
      />
      <rect
        x="0"
        y="0"
        height={sizes.graphHeight}
        width={sizes.width - sizes.marginRight}
        fillOpacity="0"
        strokeWidth="1"
        stroke={theme.common.color.separatorDarkPrimary}
      />
      <g id="y-axis" />
    </>
  );
};

interface LineChartProps {
  theme: DefaultTheme;
  linePathRef: RefObject<SVGPathElement>;
}

const LineChart: React.FunctionComponent<LineChartProps> = ({
  theme,
  linePathRef
}: LineChartProps) => {
  return (
    <>
      <path ref={linePathRef} strokeWidth="2" stroke={theme.common.color.green} fill="none" />
    </>
  );
};

interface LineChartProps {
  theme: DefaultTheme;
  linePathRef: RefObject<SVGPathElement>;
}
const CandleChart: React.FC<LineChartProps> = ({ theme, linePathRef }: LineChartProps) => {
  return (
    <>
      {/* <path ref={linePathRef} strokeWidth="2" stroke={theme.common.color.green} fill="none" /> */}
      <g id="candlestick" />
    </>
  );
};

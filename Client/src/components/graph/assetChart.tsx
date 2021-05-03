/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import React, { useEffect, useState, useRef, useContext } from 'react';
import styled, { ThemeContext } from 'styled-components';
import { rgba } from 'polished';
import MenuUp from 'mdi-react/MenuUpIcon';
import MenuDown from 'mdi-react/MenuDownIcon';
import {
  select,
  selectAll,
  bisect,
  bisector,
  extent,
  interpolateNumber,
  range,
  scalePoint,
  scaleQuantize,
  scaleLinear,
  axisBottom,
  line,
  area,
  pointer
} from 'd3';
import axios from 'axios';
import { numberWithCommas, formatDate, getUTCTimestamp, formatDecimal } from 'utils';
import { ChartSize } from 'models/chart';

interface LabelProps {
  left?: string;
  right?: string;
}

/**
 * ------------------------STYLED COMPONENTS------------------------
 */
const GraphContainer = styled.div`
  position: relative;
  overflow: hidden;
`;
const StyledStopTop = styled.stop`
  stop-color: ${({ theme }) => rgba(theme.common.color.green, 0.2)};
`;

const StyledStopBottom = styled.stop`
  stop-color: ${({ theme }) => rgba(theme.common.color.green, 0)};
`;

const LabelContainer = styled.div<LabelProps>`
  position: absolute;
  top: 24px;
  left: ${({ left }) => left}px;
  right: ${({ right }) => right}px;
  display: flex;
`;

const PriceLabel = styled.div`
  pointer-events: none;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.common.color.textDarkTeritary};
  line-height: 1.43;
  margin-right: 24px;
`;

const CurrentPrice = styled(PriceLabel)`
  div:last-child {
    font-weight: 400;
    font-size: 32px;
    color: ${({ theme }) => theme.common.color.white};
  }
`;

const ComparePrice = styled(PriceLabel)`
  div:last-child {
    margin-top: 4px;
    font-weight: 400;
    font-size: 18px;
    color: ${({ theme }) => theme.common.color.white};
  }
`;

const TimeRangeLabel = styled.div<{ clicked: boolean }>`
  margin-right: 16px;
  text-align: center;
  color: ${({ theme, clicked }) =>
    clicked ? theme.common.color.white : theme.common.color.textDarkQuarternary};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
`;

const Text = styled.text`
  font-size: 10px;
  background: #fff;
  user-select: none;
  pointer-events: none;
`;

const TextBubble = styled.div`
  position: absolute;
  padding: 4px 12px;
  font-size: 12px;
  background-color: ${({ theme }) => theme.common.color.green};
  border-radius: 2px;
  user-select: none;
  pointer-events: none;
  z-index: 2;
  opacity: 0;
`;

const TextBubbleTail = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  transform: translateX(-50%) rotate(45deg);
  background-color: ${({ theme }) => rgba(theme.common.color.green, 0.9)};
  pointer-events: none;
  opacity: 0;
  z-index: -1;
`;

// Types

interface TradeData {
  tradeDate: string;
  
}

/**
 * ------------------------CONSTANTS & LOCAL UTIL FN------------------------
 */

const sizes: ChartSize = {
  graphHeight: 280,
  height: 320,
  marginBottom: 20,
  marginLeft: 84,
  marginRight: 84,
  marginTop: 44,
  textPadding: 8,
  textPaddingTop: 2,
  width: 1180
};
const BALANCE = 400000;

const computeBalance = (price) => {
  return price * BALANCE;
};

const drawHoverLines = (x, y, xData, yData) => {
  select('#mouse-horizontal').attr('d', `M${sizes.width},${y} 0, ${y}`);
  select('#mouse-vertical').attr('d', `M${x},${sizes.height} ${x},0`);
  select('#priceText').attr('y', y).text(numberWithCommas(yData));
  select('#dateText').attr('x', x).text(formatDate(xData));
};

const EPOCH = 24 * 60 * 60 * 1000;
const TIMEOFFSET = 9 * 60 * 60 * 1000;
const ONEMONTH = 30;
const THREEMONTH = 90;
const SIXMONTH = 180;
const ONEYEAR = 365;

const AreaChart: React.FC = () => {
  const theme = useContext(ThemeContext);
  // TEST DATA
  // INITIALIZERS
  const ref = useRef(null);
  const gradientPathRef = useRef<SVGPathElement>(null);
  const linePathRef = useRef<SVGPathElement>(null);
  const pointRef = useRef(null);
  const mouseOverRef = useRef<SVGRectElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleTailRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLOrSVGElement>(null);
  const [data, setData] = useState<any>(null);
  const [comparePriceValue, setComparePriceValue] = useState<number>(0);
  const [timeRange, setTimeRange] = useState<number | string>(30);

  const handleTimeRange = (e: any) => {
    const target = e.target as HTMLDivElement;
    switch (target.id) {
      // 1개월 단위
      case '0':
        setTimeRange(30);
        break;
      // 3개월 단위
      case '1':
        setTimeRange(90);
        break;
      // 전체
      case '2':
        setTimeRange('total');
        break;
      default:
        setTimeRange(30);
    }
  };

  const UpOrDown = () => {
    if (comparePriceValue < 0) {
      return <MenuDown size={16} />;
    }
    if (comparePriceValue > 0) {
      return <MenuUp size={16} />;
    }
    return '-';
  };

  // 상용화에서는 데이터를 graph 컴포넌트에서 호출하지 않고 따로 호출할 것이다.
  // 테스트용 코드라 추후에 변경 예정.
  useEffect(() => {
    const fetchData = async () => {
      // Need to connect to socket
      // const res = await axios.get(
      // );
      // res.data.data.items.splice(16, 2);
      // setData(res.data.data.items);
      // console.log(res.data.data.items);
     const tempData = [
      {
        tradeDate : '2021-04-28',
        close: 5
      },
      {
        tradeDate : '2021-04-29',
        close: 5
      },
      {
        tradeDate : '2021-04-30',
        close: 5
      },
       {
         tradeDate : '2021-05-01',
         close: 5
       },
       {
        tradeDate : '2021-05-02',
        close: 5.1
      },
      {
        tradeDate: '2021-05-03',
        close: 5.2
      }
     ]
     setData(tempData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const gradientPath = select(gradientPathRef.current);
    const linePath = select(linePathRef.current);
    const pointPath = select(pointRef.current);
    const mouseOverRect = select(mouseOverRef.current);
    const [bubbleNode, tailNode] = [bubbleRef.current, bubbleTailRef.current];
    const dataLength = data ? (data as any).length : 1;
    const TIMERANGE =
      timeRange === 'total'
        ? new Date((data as any)[dataLength - 1].tradeDate).getTime() * EPOCH
        : (timeRange as number) * EPOCH;
    let mPointer;
    // Used as a variable to track translated pixels from drag event
    let dragTranslate = 0;
    let tickCount = 0;
    let tickMonth = -1;
    let leftBorderPixel = 0;
    let rightBorderPixel = sizes.width;

    const initializeGraph = async () => {
      const [MINDATE, MAXDATE] = extent(data, (d) => new Date(d.tradeDate));
      const [MINPRICE, MAXPRICE] = extent(data, (d) => computeBalance(d.close));

      console.log(new Date(MAXDATE.getTime() - TIMERANGE));
      setComparePriceValue(
        computeBalance((data as any)[0].close) - computeBalance((data as any)[1].close)
      );

      const tickFormatter = (d: Date): number | string | null => {
        const day = d.getDate();
        tickCount += 1;
        // Helpers
        const getMonth = (): string | null => {
          if (tickMonth !== d.getMonth() + 1) {
            tickMonth = d.getMonth() + 1;
            // 1월 일때는 연도를 보여준다.
            if (d.getMonth() === 0) {
              return `${d.getFullYear()}yr`;
            }
            return `${d.getMonth() + 1}`;
          }
          return null;
        };
        const getDay = (interval): number | null => {
          // Return day Every `interval` days
          if (tickCount > interval - 1) {
            tickCount = 0;
            return day;
          }
          return null;
        };
        const timeDiff = MAXDATE.getTime() - MINDATE.getTime();
        switch (timeRange) {
          case ONEMONTH:
            return getMonth() || getDay(2);
          case THREEMONTH:
            return getMonth() || getDay(6);
          case 'total':
            if (timeDiff < THREEMONTH * EPOCH) {
              return getMonth() || getDay(2);
            }
            if (timeDiff < SIXMONTH * EPOCH) {
              return getMonth() || getDay(6);
            }
            if (timeDiff < ONEYEAR * EPOCH) {
              return getMonth() || getDay(10);
            }
            // If more than 365 data points, we go with showing months only
            return getMonth();
          default:
            return null;
        }
      };

      // EXPENSIVE!
      const findMinMaxY = (left: number, right: number) => {
        let minVal = Infinity;
        let maxVal = 0;

        for (let i = right; i < left + 1; i += 1) {
          if ((data as any)[i]) {
            minVal = minVal < (data as any)[i].close ? minVal : (data as any)[i].close;
            maxVal = maxVal < (data as any)[i].close ? (data as any)[i].close : maxVal;
          }
        }

        return [computeBalance(minVal), computeBalance(maxVal)];
      };

      // TODO: Apply time.format ting when fixed
      const graphWidth = sizes.width - sizes.marginRight;

      // Function that finds the index closest to the EPOCH time given.
      const bisectDate = bisector((d, dx: number) => {
        return dx - getUTCTimestamp(d.tradeDate);
      }).left;

      const domains = (data as any).map((item) => {
        return new Date(item.tradeDate);
      });

      domains.reverse();

      let leftIdx = bisectDate(data, MAXDATE.getTime() - TIMERANGE) - 1;

      /**
       * Ordinal Scale 은 직접 데이터 갯수에 따른 range 를 세팅해야한다.
       * viewBox 안에있는 데이터를 더 만이 보여주고 싶으면 range 를 줄이면 된다.
       */
      const xRangeLeft = (graphWidth / leftIdx - 1) * dataLength;
      console.log(leftIdx, xRangeLeft, (data as any)[leftIdx]);
      let rightIdx = 0;
      // console.log(domains.slice(domains.length - leftIdx - 1), data[leftIdx]);

      // Initialize x-scale
      const x = scalePoint()
        // .domain([MAXDATE.getTime() - TIMERANGE, MAXDATE.getTime()])
        .domain(domains)
        .range([graphWidth - xRangeLeft, graphWidth]);

      const moveTooltip = (xVal, yVal) => {
        const offset = select(bubbleNode).node().getBoundingClientRect().width / 2;
        select(bubbleNode).attr(
          'style',
          `top:${yVal - 36}px;left:${
            xVal - offset - dragTranslate >= 0 ? xVal - offset - dragTranslate : 0
          }px;opacity:1;`
        );
        select(tailNode).attr(
          'style',
          `top:${yVal - 30}px;left:${xVal - dragTranslate}px;opacity:1;`
        );
      };

      // Custom x.invert function for ordinalScale
      const xDomain = x.domain();
      const xRange = x.range();
      const scale = scaleQuantize().domain(xRange).range(xDomain);
      const rangePoints = range(xRange[0], xRange[1] + 0.1, x.step());

      x.invert = (v) => {
        const idx0 = bisect(rangePoints, v);
        const idx1 = bisect(rangePoints, v) - 1;
        // console.log(xDomain[bisect(rangePoints, v)], v);
        // Point to the right of v
        const d0 = x(xDomain[idx0]);
        // Point to the left of v
        const d1 = x(xDomain[idx1]);
        // Find the nearest point
        // return d;
        const d = d0 - v > v - d1 ? d1 : d0;
        return scale(d) || new Date();
      };
      x.invertIdx = (v) => {
        const idx = bisect(rangePoints, v) - 1;
        return xDomain.length - idx - 1;
      };

      let [MINY, MAXY] = findMinMaxY(leftIdx - 1, rightIdx);
      let newMin = MINY;
      let newMax = MAXY;
      let leftBorder;
      let rightBorder;

      console.log('leftIdx', leftIdx);

      const initialInt = interpolateNumber(
        computeBalance((data as any)[leftIdx].close),
        computeBalance((data as any)[leftIdx - 1].close)
      );
      const interpolatedValue = initialInt(
        (leftBorderPixel - x(new Date((data as any)[leftIdx].tradeDate))) /
          (x(new Date((data as any)[leftIdx - 1].tradeDate)) -
            x(new Date((data as any)[leftIdx].tradeDate)))
      );
      const initialMinY = interpolatedValue > MINY ? MINY : interpolatedValue;
      const y = scaleLinear()
        .domain([initialMinY, MAXY])
        .range([sizes.graphHeight - sizes.marginBottom, sizes.marginTop]);
      // Path Height computed to have dynamic gradient effect

      const points = line()
        .x((d) => x(new Date(d.tradeDate)))
        .y((d) => y(computeBalance(d.close)));

      pointPath.datum(data).attr('d', points).attr('id', 'pointPath').attr('fill', 'none');

      select('#x-axis')
        .call((g) =>
          g.selectAll('.tick').attr('style', 'user-select:none').attr('pointer-events', 'none')
        )
        .call(axisBottom(x).tickFormat(tickFormatter))
        .call((g) => g.select('.domain').remove())
        .call((g) =>
          g
            .selectAll('.tick text')
            .attr('fill', theme.common.color.textDarkQuarternary)
            .attr('style', 'user-select:none')
        )
        .call((g) => g.selectAll('.tick line').remove());

      // Last trailing dot
      select('#points')
        .append('circle')
        .attr('cx', x(MAXDATE))
        .attr('cy', y(computeBalance((data as any)[0].close)))
        .attr('r', 4)
        .attr('id', 'last-trailing-dot')
        .attr('fill', theme.common.color.green);

      // Hover dots
      select('#points')
        .selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(new Date(d.tradeDate)))
        .attr('cy', (d) => y(computeBalance(d.close)))
        .attr('r', 6)
        .attr('opacity', 0)
        .attr('stroke-width', 2)
        .attr('stroke', theme.common.color.white)
        .attr('fill', theme.common.color.green)
        .attr('name', (d) => `${getUTCTimestamp(d.tradeDate)}`);

      // EXPENSIVE!
      const drawGraph = () => {
        const pathHeight = y(MINPRICE) - y(MAXPRICE);
        const lineVal = area()
          .x((d) => x(new Date(d.tradeDate)))
          .y((d) => y(computeBalance(d.close)));

        const areaVal = area()
          .x((d) => x(new Date(d.tradeDate)))
          .y0(280)
          .y1((d) => y(computeBalance(d.close)));

        select('#last-trailing-dot')
          .attr('cx', x(MAXDATE))
          .attr('cy', y(computeBalance((data as any)[0].close)))
          .attr('transform', `translate(${-1 * dragTranslate}, 0)`);

        selectAll('#points circle:not([id])')
          .attr('cx', (d) => x(new Date(d.tradeDate)))
          .attr('cy', (d) => y(computeBalance(d.close)))
          .attr('transform', `translate(${-1 * dragTranslate}, 0)`);

        select('#x-axis').attr(
          'transform',
          `translate(${-1 * dragTranslate}, ${sizes.height - 32})`
        );

        select('#gradient-top').attr(
          'offset',
          `${((y(newMax) - y(MAXPRICE)) / pathHeight) * 100}%`
        );
        select('#gradient-bottom').attr(
          'offset',
          `${100 - ((y(MINPRICE) - y(newMin)) / pathHeight) * 100}%`
        );
        // Initialize linegraph and area gradient
        gradientPath
          .datum(data)
          .attr('fill', 'url(#graphColor)')
          .attr('d', areaVal)
          .attr('transform', `translate(${-1 * dragTranslate}, 0)`);
        linePath
          .datum(data)
          .attr('d', lineVal)
          .attr('transform', `translate(${-1 * dragTranslate}, 0)`);
      };

      // Initial Drawing
      drawGraph();

      // Variables for mouseover Effects
      let isDragging = false;
      let xSnapshot = 0;
      let leftSaved;
      let rightSaved;

      // Mouseover Effects
      mouseOverRect
        .on('mouseout', () => {
          select('#mouse-vertical').style('opacity', 0);
          select('#mouse-horizontal').style('opacity', 0);
          select('#priceText').style('opacity', 0);
          select('#dateText').style('opacity', 0);
          if (mPointer) {
            mPointer.attr('opacity', 0);
          }
          if (bubbleNode && tailNode) {
            bubbleNode.style.opacity = '0';
            tailNode.style.opacity = '0';
          }
        })
        .on('mouseover', () => {
          select('#mouse-vertical').style('opacity', 1);
          select('#mouse-horizontal').style('opacity', 1);
          select('#priceText').style('opacity', 1);
          select('#dateText').style('opacity', 1);
          if (mPointer) {
            mPointer.attr('opacity', 1);
          }
        })
        .on('mousedown.start', function snapshot(this) {
          isDragging = true;
          [xSnapshot] = pointer(this);
        })
        .on('mouseup.end', () => {
          isDragging = false;
        })
        .on('mousemove', function mouseEvent(this: any) {
          const mouseVal = pointer(this);
          // Hover functionality
          const xData = x.invert(mouseVal[0] + dragTranslate);
          // 만원 단위로 반올림하는 로직이 추가되어있다.
          const yData = (Math.round(y.invert(mouseVal[1]) / 10000) * 10000).toString();
          const idx = bisectDate(data, xData.getTime());
          const d = new Date((data as any)[idx]?.tradeDate) || null;
          const yVal = computeBalance((data as any)[idx].close);

          // Code unnecessary during drag for optimization
          if (!isDragging) {
            const point = selectAll(`[name='${d.getTime()}']`);
            const pointX = select(`[name='${d.getTime()}']`).attr('cx');
            if (mPointer) {
              mPointer.attr('opacity', 0);
            }
            point.attr('opacity', 1);
            mPointer = point;
            if (yVal) {
              select(bubbleNode).text(numberWithCommas(yVal));
              moveTooltip(x(d), y(yVal));
              if (pointX < leftBorderPixel || pointX > rightBorderPixel) {
                select(bubbleNode).attr('style', 'opacity:0');
                select(tailNode).attr('style', 'opacity:0');
                mPointer.attr('opacity', 0);
              }
            } else if (bubbleNode && tailNode) {
              bubbleNode.style.opacity = '0';
              tailNode.style.opacity = '0';
            }
          }

          // Drag functionality
          if (isDragging) {
            // dynamic y range
            leftBorder = x.invert(0 + dragTranslate);
            rightBorder = x.invert(sizes.width + dragTranslate);
            // Index 0 is the most recent, Last index is the oldest
            // leftIdx = bisectDate(data, leftBorder.getTime()) - 1;
            leftIdx = x.invertIdx(leftBorderPixel);
            // rightIdx = bisectDate(data, rightBorder.getTime());
            rightIdx = x.invertIdx(rightBorderPixel);

            const leftCurr = (data as any)[leftIdx - 1];
            const rightCurr = (data as any)[rightIdx];
            // One day tick left
            const leftNext = (data as any)[leftIdx] || leftCurr;
            // One day tick right
            const rightNext = (data as any)[rightIdx - 1] || rightCurr;
            /**
             * Save Index pointers to know if a new point is introduced into the domain
             * leftIdx is the index that is closest to the leftborder VISIBLE to the user
             * rightIdx is similar but at the rightborder.
             * If a new data point is introduced OR removed, we find the new min, max value for Y.
             *
             * ***** findMinMaxY has a computation of O(n), where n is the number of data points for data[leftIdx ~ rightIdx].
             * Maximum of n should be around 350, if user sees a year worth of data points
             */

            console.log(leftNext, leftCurr);
            if (leftSaved !== undefined && rightSaved !== undefined) {
              if (leftSaved !== leftIdx) {
                // console.log((data as any)[leftIdx], leftIdx);
                [MINY, MAXY] = findMinMaxY(leftIdx - 1, rightIdx);
              }
              if (rightSaved !== rightIdx) {
                [MINY, MAXY] = findMinMaxY(leftIdx - 1, rightIdx);
              }
            }
            leftSaved = leftIdx;
            rightSaved = rightIdx;
            /**
             * leftNext is the data point that is the closest to the leftmost border that is currently INVISIBLE to the user.
             * rightNext is the data point that is the closest to the right most border similar to leftNext
             * If the computed balance in the leftNext.close is smaller current Minimum Y value (MINY), it must interpolate the difference and redraw graph
             * Same goes to the rightNext value
             *
             * Might be improved using webworkter.
             */
            let interpolateLeft = MINY;
            let interpolateRight = MAXY;
            // console.log(computeBalance(leftNext.close), MINY);
            const lInt = interpolateNumber(
              computeBalance(leftNext.close),
              computeBalance(leftCurr.close)
            );
            interpolateLeft = lInt(
              (leftBorderPixel - x(new Date(leftNext.tradeDate))) /
                (x(new Date(leftCurr.tradeDate)) - x(new Date(leftNext.tradeDate)))
            );
            const rInt = interpolateNumber(
              computeBalance(rightNext.close),
              computeBalance(rightCurr.close)
            );
            console.log(rightNext, rightCurr);
            interpolateRight = rInt(
              (x(new Date(rightNext.tradeDate)) - rightBorderPixel) /
                (x(new Date(rightNext.tradeDate)) - x(new Date(rightCurr.tradeDate)))
            );
            newMin = interpolateLeft < MINY ? interpolateLeft : MINY;
            newMax = interpolateRight > MAXY ? interpolateRight : MAXY;
            y.domain([newMin, newMax]);
            if (
              dragTranslate - (mouseVal[0] - xSnapshot) <= 0 &&
              dragTranslate - (mouseVal[0] - xSnapshot) >
                -1 * xRangeLeft - sizes.marginLeft + graphWidth
            ) {
              dragTranslate -= mouseVal[0] - xSnapshot;
              leftBorderPixel = dragTranslate;
              rightBorderPixel = sizes.width + dragTranslate;
              moveTooltip(x(d), yVal);
            }

            [xSnapshot] = mouseVal;

            drawGraph();
          }

          drawHoverLines(mouseVal[0], mouseVal[1], xData, yData);
        });
      return () => {
        mouseOverRect
          .on('mouseout', null)
          .on('mouseover', null)
          .on('mousedown.start', null)
          .on('mouseup.end', null)
          .on('mousemove', null);
      };

      // Draggable event
    };
    if (data) {
      initializeGraph();
    }
  }, [
    timeRange,
    data,
    theme.common.color.green,
    theme.common.color.textDarkQuarternary,
    theme.common.color.white
  ]);

  return (
    <GraphContainer>
      <TextBubble ref={bubbleRef} />
      <TextBubbleTail ref={bubbleTailRef} />
      <LabelContainer left="24">
        <CurrentPrice>
          <div>Total Balance</div>
          <div>{data && numberWithCommas(computeBalance((data as any)[0].close))}</div>
        </CurrentPrice>
        <ComparePrice>
          <div>Net Change</div>
          <div>
            {/* {comparePriceValue > 0 ? (
              <MenuUp size={16} />
            ) : comparePriceValue < 0 ? (
              <MenuDown size={16} />
            ) : (
              '-'
            )}{' '} */}
            {UpOrDown()} <span>{numberWithCommas(Math.abs(comparePriceValue))}</span>{' '}
            <span>
              (
              {data &&
                formatDecimal((comparePriceValue / computeBalance((data as any)[1].close)) * 100)}
              %)
            </span>
          </div>
        </ComparePrice>
      </LabelContainer>
      <LabelContainer right="36">
        <TimeRangeLabel id="0" clicked={timeRange === ONEMONTH} onClick={handleTimeRange}>
          1M
        </TimeRangeLabel>
        <TimeRangeLabel id="1" clicked={timeRange === THREEMONTH} onClick={handleTimeRange}>
          3M
        </TimeRangeLabel>
        <TimeRangeLabel id="2" clicked={timeRange === 'total'} onClick={handleTimeRange}>
          Total
        </TimeRangeLabel>
      </LabelContainer>
      <svg ref={ref} viewBox={`0, 0, ${sizes.width}, ${sizes.height}`}>
        <rect
          x="0"
          y="0"
          height="320"
          width="1180"
          rx="4"
          fillOpacity="0"
          strokeWidth="1"
          stroke={theme.common.color.separatorDarkPrimary}
        />
        <line x1="0" x2="1180" y1="280" y2="280" strokeWidth="1" stroke="#323234" />
        <g id="x-axis" />
        <defs>
          <linearGradient id="graphColor" x1="0%" y1="0%" x2="0%" y2="100%">
            <StyledStopTop id="gradient-top" offset="0%" />
            <StyledStopBottom id="gradient-bottom" offset="100%" />
          </linearGradient>
        </defs>
        <path ref={gradientPathRef} fill="url(#graphColor)" />
        <path ref={linePathRef} strokeWidth="2" stroke="#19b96e" />
        <g id="mouseOver">
          <path
            id="mouse-vertical"
            strokeDasharray="1,3"
            strokeWidth="1"
            stroke="rgba(236,236,248,0.25)"
          />
          <path
            id="mouse-horizontal"
            strokeDasharray="1,3"
            strokeWidth="1"
            stroke="rgba(236, 236, 248, 0.25)"
          />
          <Text
            id="priceText"
            className="tooltip"
            textAnchor="end"
            x={sizes.width - 10}
            fill="#fff"
          />
          <Text
            id="dateText"
            className="tooltip"
            textAnchor="middle"
            y={sizes.graphHeight + 10 + sizes.textPaddingTop}
            fill="#fff"
          />
          <g id="points">
            <path id="pointPath" fill="none" ref={pointRef} />
          </g>
          <rect
            width={sizes.width}
            height={sizes.graphHeight}
            fill="none"
            ref={mouseOverRef}
            pointerEvents="all"
          />
        </g>
      </svg>
    </GraphContainer>
  );
};

export default AreaChart;

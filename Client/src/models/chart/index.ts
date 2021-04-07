export interface ChartSize {
  width: number;
  height: number;
  marginBottom: number;
  marginTop: number;
  graphHeight: number;
  marginRight: number;
  marginLeft: number;
  textPadding: number;
  textPaddingTop: number;
}

export interface CandleData {
  c: Array<number>;
  h: Array<number>;
  l: Array<number>;
  o: Array<number>;
  t: Array<number>;
  v: Array<number>;
  s: string;
}

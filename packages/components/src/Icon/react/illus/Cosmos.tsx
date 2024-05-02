import Svg, { SvgProps, Path, Circle, Ellipse } from 'react-native-svg';
const SvgCosmos = (props: SvgProps) => (
  <Svg viewBox="0 0 16 16" fill="none" accessibilityRole="image" {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.743 8.016c0-3.147.57-5.698 1.273-5.698.704 0 1.274 2.551 1.274 5.698 0 3.148-.57 5.699-1.274 5.699-.703 0-1.273-2.551-1.273-5.699Zm1.2 5.404s.081.08.161-.027c0 0 .378-.322.648-1.85 0 0 .35-2.012.297-3.808 0 0 .054-2.065-.539-4.264 0 0-.2-.709-.44-.878a.1.1 0 0 0-.129.01c-.164.163-.649.897-.915 4.006 0 0-.135 3.915.432 5.738 0 0 .162.698.486 1.073Z"
      fill="#8C8CA1"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.381 6.911c2.731-1.566 5.228-2.34 5.578-1.73.35.61-1.577 2.374-4.308 3.94-2.73 1.566-5.228 2.341-5.578 1.731-.35-.61 1.577-2.374 4.308-3.94Zm-4.089 3.73s-.03.11.104.127c0 0 .467.168 1.928-.359 0 0 1.919-.696 3.45-1.637 0 0 1.818-.981 3.43-2.59 0 0 .516-.526.543-.818a.1.1 0 0 0-.073-.107c-.223-.062-1.102-.117-3.93 1.199 0 0-3.463 1.83-4.764 3.23 0 0-.523.487-.688.955Z"
      fill="#8C8CA1"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.656 6.913c2.722 1.578 4.643 3.35 4.29 3.96-.352.61-2.845-.176-5.568-1.753-2.724-1.578-4.645-3.35-4.292-3.96.352-.61 2.849.175 5.57 1.753Zm-5.278-1.67s-.11.03-.058.153v.001s.09.488 1.277 1.488c0 0 1.564 1.312 3.145 2.165 0 0 1.76 1.08 3.96 1.67 0 0 .714.183.98.06a.1.1 0 0 0 .056-.116c-.059-.224-.45-1.012-3.007-2.8 0 0-3.32-2.08-5.182-2.504 0 0-.684-.21-1.171-.118Z"
      fill="#8C8CA1"
    />
    <Circle cx={8.003} cy={8.003} r={0.67} fill="#8C8CA1" />
    <Ellipse cx={10.752} cy={5.429} rx={0.389} ry={0.402} fill="#8C8CA1" />
    <Ellipse cx={4.369} cy={6.796} rx={0.389} ry={0.402} fill="#8C8CA1" />
    <Ellipse cx={7.212} cy={11.731} rx={0.389} ry={0.402} fill="#8C8CA1" />
  </Svg>
);
export default SvgCosmos;

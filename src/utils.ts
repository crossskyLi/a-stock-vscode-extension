import { StockItem } from './type';
import * as vscode from 'vscode';

// 定时器
export function intervalHandle(
  timer: NodeJS.Timeout | null,
  handle: Function = () => {},
  gap: number = 1000,
) {
  if (timer) {
    clearInterval(timer);
  }

  setInterval(() => handle(), gap);
}

// fixed
export function calcFixedNumber(item: StockItem) {
  var high =
    String(item.high).indexOf('.') === -1
      ? 0
      : String(item.high).length - String(item.high).indexOf('.') - 1;
  var low =
    String(item.low).indexOf('.') === -1
      ? 0
      : String(item.low).length - String(item.low).indexOf('.') - 1;
  var open =
    String(item.open).indexOf('.') === -1
      ? 0
      : String(item.open).length - String(item.open).indexOf('.') - 1;
  var yest =
    String(item.yestclose).indexOf('.') === -1
      ? 0
      : String(item.yestclose).length - String(item.yestclose).indexOf('.') - 1;
  var updown =
    String(item.updown).indexOf('.') === -1
      ? 0
      : String(item.updown).length - String(item.updown).indexOf('.') - 1;
  var max = Math.max(high, low, open, yest, updown);

  if (max === 0) {
    max = 2;
  }

  return max;
}

// 获取配置项的stocks
export function getStockCodes() {
  const config = vscode.workspace.getConfiguration();
  const stocks: string[] | undefined = config.get('stock-watch.stocks');
  if (!stocks) {
    return [];
  }
  return stocks.map((code: string = '') => {
    if (isNaN(Number(code[0]))) {
      if (code.toLowerCase().indexOf('us_') > -1) {
        return code.toUpperCase();
      } else if (code.indexOf('hk') > -1) {
        return code;
      } else {
        return code.toLowerCase().replace('sz', '1').replace('sh', '0');
      }
    } else {
      return (code[0] === '6' ? '0' : '1') + code;
    }
  });
}

// 获取当前是否显示时间 根据 showTime 判断
export function isShowTime() {
  const config = vscode.workspace.getConfiguration();
  const configShowTime = config.get('stock-watch.showTime');
  let showTime = [0, 23];
  if (
    Array.isArray(configShowTime) &&
    configShowTime.length === 2 &&
    configShowTime[0] <= configShowTime[1]
  ) {
    showTime = configShowTime;
  }
  const now = new Date().getHours();
  return now >= showTime[0] && now <= showTime[1];
}

// 获取更新间隔时间
export function getUpdateInterval(): number {
  const config = vscode.workspace.getConfiguration();
  return config.get('stock-watch.updateInterval') || 3000;
}

// 获取每个item 显示的颜色
export function getItemColor(item: StockItem): string {
  const config = vscode.workspace.getConfiguration();
  const riseColor: string = config.get('stock-watch.riseColor') || '#444';
  const fallColor: string = config.get('stock-watch.fallColor') || '#222';

  return item.percent >= 0 ? riseColor : fallColor;
}
// 保留小数点
export function keepDecimal(num: string | number, fixed: number) {
  var result = parseFloat(String(num));
  if (isNaN(result)) {
    return '--';
  }
  return result.toFixed(fixed);
}

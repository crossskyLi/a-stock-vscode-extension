import { calcFixedNumber, keepDecimal } from './utils';
import { StockItem } from './type';

export function getItemText(item: StockItem) {
  return `${item.name} ${keepDecimal(item.price, calcFixedNumber(item))} ${
    item.percent >= 0 ? '⬆' : '⬇'
  } ${keepDecimal(item.percent * 100, 2)}%`;
}

export function getTooltipText(item: StockItem) {
  return `
	code: ${item.type}${item.symbol}
	updown: ${item.updown}  
	percent: ${keepDecimal(item.percent * 100, 2)}%
	high: ${item.high}
	low: ${item.low}
	opening:${item.open}
	last：${item.yestclose}`;
}

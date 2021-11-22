// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
let statusBarItems: Record<string, any> = {};
let stockCodes: string[] = [];
let updateInterval = 10000;
let timer: NodeJS.Timeout | null = null;
let showTimer: NodeJS.Timeout | null = null;

interface StockItem {
  name: string;
  price: string;
  percent: number;
  type: string;
  symbol: string;
  updown: string;
  high: string;
  low: string;
  open: string;
  yestclose: number;
  code: string;
}

function initShowTimeChecker() {
  showTimer && clearInterval(showTimer);
  showTimer = setInterval(() => {
    if (isShowTime()) {
      init();
    } else {
      timer && clearInterval(timer);
      hideAllStatusBar();
    }
  }, 1000 * 60 * 10);
}

function hideAllStatusBar() {
  Object.keys(statusBarItems).forEach((item) => {
    statusBarItems[item].hide();
    statusBarItems[item].dispose();
  });
}

function handleConfigChange() {
  timer && clearInterval(timer);
  showTimer && clearInterval(showTimer);
  const codes = getStockCodes();
  Object.keys(statusBarItems).forEach((item) => {
    if (codes.indexOf(item) === -1) {
      statusBarItems[item].hide();
      statusBarItems[item].dispose();
      delete statusBarItems[item];
    }
  });
  init();
}

function getStockCodes() {
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

function getUpdateInterval(): number {
  const config = vscode.workspace.getConfiguration();
  return config.get('stock-watch.updateInterval') || 3000;
}

function isShowTime() {
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

function getItemText(item: StockItem) {
  return `${item.name} ${keepDecimal(
    item.price,
    calcFixedNumber(item),
  )} ${item.percent >= 0 ? '⬆' : '⬇'} ${keepDecimal(item.percent * 100, 2)}%`;
}

function getTooltipText(item: StockItem) {
  return `
    code: ${item.type}${item.symbol}
		updown: ${item.updown}  percent: ${keepDecimal(item.percent * 100, 2)}%
	  high: ${item.high}   low: ${item.low}
    opening:${item.open} last：${item.yestclose}
  `;
}

function getItemColor(item: StockItem): string {
  const config = vscode.workspace.getConfiguration();
  const riseColor: string = config.get('stock-watch.riseColor') || '#444';
  const fallColor: string = config.get('stock-watch.fallColor') || '#222';

  return item.percent >= 0 ? riseColor : fallColor;
}

function fetchAllData() {
  const baseUrl = 'https://api.money.126.net/data/feed/';

  axios
    .get(`${baseUrl}${stockCodes.join(',')}?callback=a`)
    .then(
      (rep) => {
        try {
          const result = JSON.parse(rep.data.slice(2, -2));
          const data: StockItem[] = [];
          Object.keys(result).map((item) => {
            if (!result[item].code) {
              result[item].code = item; //兼容港股美股
            }
            data.push(result[item]);
          });
          displayData(data);
        } catch (error) {}
      },
      (error) => {
        console.error(error);
      },
    )
    .catch((error) => {
      console.error(error);
    });
}

function displayData(data: any[]) {
  data.map((item) => {
    const key = item.code;
    if (statusBarItems[key]) {
      statusBarItems[key].text = getItemText(item);
      statusBarItems[key].color = getItemColor(item);
      statusBarItems[key].tooltip = getTooltipText(item);
    } else {
      statusBarItems[key] = createStatusBarItem(item);
    }
  });
}

function createStatusBarItem(item: StockItem) {
  const barItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    0 - stockCodes.indexOf(item.code),
  );
  barItem.text = getItemText(item);
  barItem.color = getItemColor(item);
  barItem.tooltip = getTooltipText(item);
  barItem.show();
  return barItem;
}

function keepDecimal(num: string | number, fixed: number) {
  var result = parseFloat(String(num));
  if (isNaN(result)) {
    return '--';
  }
  return result.toFixed(fixed);
}

function calcFixedNumber(item: StockItem) {
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

function init() {
  initShowTimeChecker();
  if (isShowTime()) {
    stockCodes = getStockCodes();
    updateInterval = getUpdateInterval();
    fetchAllData();
    timer = setInterval(fetchAllData, updateInterval);
  } else {
    hideAllStatusBar();
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "a-stock-for-money" is now active!',
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'a-stock-for-money.show',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'show stock from a-stock-for-money!',
      );
    },
  );

  context.subscriptions.push(disposable);

  init();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(handleConfigChange),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

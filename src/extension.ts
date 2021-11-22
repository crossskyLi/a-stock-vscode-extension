// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import axios from 'axios';
import { StockItem } from './type';
import {
  intervalHandle,
  calcFixedNumber,
  getStockCodes,
  isShowTime,
  getUpdateInterval,
  getItemColor,
} from './utils';

import { getTooltipText, getItemText } from './render';
import { fetchAllData } from './api';

let statusBarItems: Record<string, any> = {};
let stockCodes: string[] = [];
let updateInterval = 10000;
let timer: NodeJS.Timeout | null = null;
let showTimer: NodeJS.Timeout | null = null;

function initShowTimeChecker() {
  intervalHandle(
    showTimer,
    () => {
      timer && clearInterval(timer);
      if (isShowTime()) {
        init();
      } else {
        hideAllStatusBar();
      }
    },
    1000 * 60 * 10,
  );
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

function init() {
  initShowTimeChecker();
  if (isShowTime()) {
    stockCodes = getStockCodes();
    updateInterval = getUpdateInterval();
    fetchAllData(displayData, stockCodes);
    intervalHandle(
      timer,
      () => fetchAllData(displayData, stockCodes),
      updateInterval,
    );
  } else {
    hideAllStatusBar();
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  init();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(handleConfigChange),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

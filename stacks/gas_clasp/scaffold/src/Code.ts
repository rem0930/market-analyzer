/**
 * Google Apps Script エントリポイント
 * 
 * このファイルはGASのメインエントリポイントです。
 * グローバル関数として公開される関数を定義してください。
 */

/**
 * スプレッドシートを開いた時に実行される関数
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('カスタムメニュー')
    .addItem('サンプル実行', 'sampleFunction')
    .addToUi();
}

/**
 * サンプル関数
 */
function sampleFunction(): void {
  const sheet = SpreadsheetApp.getActiveSheet();
  const message = getMessage();
  SpreadsheetApp.getUi().alert(message);
  Logger.log(`Function executed on sheet: ${sheet.getName()}`);
}

/**
 * メッセージを取得する
 */
function getMessage(): string {
  return 'Hello from Google Apps Script!';
}

// グローバルスコープに公開（clasp用）
declare const global: { [key: string]: unknown };
if (typeof global !== 'undefined') {
  global.onOpen = onOpen;
  global.sampleFunction = sampleFunction;
}

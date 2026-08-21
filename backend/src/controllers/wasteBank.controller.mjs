import * as customerController from './customer.controller.mjs';
import * as customerAccountController from './customerAccount.controller.mjs';
import * as customerHistoryController from './customerHistory.controller.mjs';
import * as catalogController from './catalog.controller.mjs';
import * as transactionController from './transaction.controller.mjs';
import * as withdrawalController from './withdrawal.controller.mjs';
import * as settingsController from './settings.controller.mjs';
import * as dashboardController from './dashboard.controller.mjs';
import * as monthlyReportController from './monthlyReport.controller.mjs';
import * as transferController from './transfer.controller.mjs';

export * from './customer.controller.mjs';
export * from './customerAccount.controller.mjs';
export * from './customerHistory.controller.mjs';
export * from './catalog.controller.mjs';
export * from './transaction.controller.mjs';
export * from './withdrawal.controller.mjs';
export * from './settings.controller.mjs';
export * from './dashboard.controller.mjs';
export * from './monthlyReport.controller.mjs';
export * from './transfer.controller.mjs';
export * from './wasteBankEducation.controller.mjs';

export default {
  ...customerController,
  ...customerAccountController,
  ...customerHistoryController,
  ...catalogController,
  ...transactionController,
  ...withdrawalController,
  ...settingsController,
  ...dashboardController,
  ...monthlyReportController,
  ...transferController,
};

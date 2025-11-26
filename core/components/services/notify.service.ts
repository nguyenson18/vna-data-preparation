import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export const alertType = {
  success: 'success',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

export interface IConfigModalConfirm {
  id?: string;
  title: string;
  noTitle?: string;
  yesTitle?: string;
  describe: string;
  hasReason?: boolean;
  onClose?: () => void;
  onAgree?: (mess?: any) => void;
}

export class NotifyService {
  static alertSubject = new Subject();
  static confirmSubject = new Subject();
  static defaultId = 'default-alert';

  static onAlert = (alertId: string) => {
    const id = alertId || NotifyService.defaultId;
    return NotifyService.alertSubject.asObservable().pipe(filter((x: any) => x && x.id === id));
  };

  static onConfirm = () => {
    return NotifyService.confirmSubject.asObservable();
  };

  // convenience methods
  static success = (message: string, options?: any) => {
    NotifyService.alert({ ...options, type: alertType.success, message });
  };

  static error = (message: string, options?: any) => {
    NotifyService.alert({ ...options, type: alertType.error, message });
  };

  static info = (message: string, options?: any) => {
    NotifyService.alert({ ...options, type: alertType.info, message });
  };

  static warn = (message: string, options?: any) => {
    NotifyService.alert({ ...options, type: alertType.warning, message });
  };

  // core alert method
  static alert = (alert: any) => {
    alert.id = alert.id || NotifyService.defaultId;
    NotifyService.alertSubject.next(alert);
  };

  // clear alerts
  static clear = (id: string) => {
    id = id || NotifyService.defaultId;
    NotifyService.alertSubject.next({ id });
  };

  static confirm = (config: IConfigModalConfirm) => {
    NotifyService.confirmSubject.next(config);
  };
}

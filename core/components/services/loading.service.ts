import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export class LoadingService {
  static alertSubject = new Subject();

  static onLoader = () => {
    return LoadingService.alertSubject.asObservable();
  }

  static start = () => {
    LoadingService.alertSubject.next(true);
  }

  static stop = () => {
    LoadingService.alertSubject.next(false);
  }
}
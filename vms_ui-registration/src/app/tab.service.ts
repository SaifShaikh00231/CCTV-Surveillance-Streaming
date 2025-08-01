// tab.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TabService {
  private activeTabSubject = new BehaviorSubject<number>(1);
  activeTab$ = this.activeTabSubject.asObservable();

  setActiveTab(tabNumber: number): void {
    this.activeTabSubject.next(tabNumber);
  }
}

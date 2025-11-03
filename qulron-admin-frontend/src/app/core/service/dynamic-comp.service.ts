import { Injectable } from '@angular/core';
import { DynamicItem } from '../models/class/dynamic-item';
import { BehaviorSubject } from 'rxjs';
import {
  DynamicButtonData,
  DynamicPageData,
} from '../models/interface/dynamic-component.interface';

@Injectable({
  providedIn: 'root',
})
export class DynamicCompService {
  constructor() {}

  private componentSubject = new BehaviorSubject<DynamicItem | null>(null);
  private pageDataSubject = new BehaviorSubject<any>(null);
  private buttonDataSubject = new BehaviorSubject<any>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private currentComponentReady = new BehaviorSubject<boolean>(false);

  component$ = this.componentSubject.asObservable();
  pageData$ = this.pageDataSubject.asObservable();
  buttonData$ = this.buttonDataSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  componentReady$ = this.currentComponentReady.asObservable(); // for loading component

  loadComponent(component: DynamicItem) {
    this.clearMainNavData();
    this.setLoading(true);
    this.componentSubject.next(component);
  }

  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  setComponentReady(ready: boolean) {
    this.currentComponentReady.next(ready);
  }

  setPageData(pageData: DynamicPageData) {
    this.pageDataSubject.next(pageData);
  }

  setButtonData(buttonData: DynamicButtonData[]) {
    this.buttonDataSubject.next(buttonData);
  }

  clearMainNavData() {
    this.pageDataSubject.next(null);
    this.buttonDataSubject.next(null);
  }
}

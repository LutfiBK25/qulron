import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';
import { OrderManagementService } from '../../../core/service/order-management.service';
import { PopupService } from '../../../core/service/popup.service';
import {
  DynamicButtonData,
  DynamicPageData,
} from '../../../core/models/interface/dynamic-component.interface';
import * as XLSX from 'xlsx-js-style';
import { DynamicItem } from '../../../core/models/class/dynamic-item';
import { CustomMapComponent } from './custom-map/custom-map.component';

@Component({
  selector: 'app-live-order-map',
  imports: [CommonModule, CustomMapComponent],
  templateUrl: './live-order-map.component.html',
  styleUrl: './live-order-map.component.css',
})
export class LiveOrderMapComponent {
  @Input() data: any;
  @ViewChild(CustomMapComponent) customMap!: CustomMapComponent;
  componentReady = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly orderService: OrderManagementService,
    private dcService: DynamicCompService,
    private popupService: PopupService
  ) {}

  activeLoads: any[] = [];
  filteredTableData: any[] = [];

  componentName: string = 'OrderList';

  currentPage: number = 1;
  pageSize: number = 18;
  pageSizes: Array<number> = [10, 25, 50, 100];
  startIndex: number = 0;
  endIndex: number = this.pageSize;
  lastVisiblePage: number = 0;
  totalItems: number = 0;

  ngOnInit() {
    // Pass Page Data dynamiclly based on the component
    const pageData: DynamicPageData = {
      pageTitle: 'Orders List',
    };
    this.dcService.setPageData(pageData);

    // Pass button data dynamically based on the component
    const buttonData: DynamicButtonData[] = [
      {
        buttonVisible: true,
        buttonLabel: 'Refresh',
        svg: `
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c9c9c9">
            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
        `,
        action: () => this.RefreshDriverLocations(),
      },
    ];
    this.dcService.setButtonData(buttonData);

    this.loadActiveOrders();
  }

  //*** Data Visibility ***/
  visibleData() {
    let startIndex = (this.currentPage - 1) * this.pageSize;
    let endIndex = Math.min(
      startIndex + this.pageSize,
      this.filteredTableData.length
    );
    this.startIndex = startIndex;
    this.endIndex = endIndex;
    this.totalItems = this.filteredTableData.length;
    return this.filteredTableData.slice(startIndex, endIndex); // starting from 0 and going before 5 index
  }

  firstPage() {
    this.currentPage = 1;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (
      this.currentPage <
      Math.ceil(this.filteredTableData.length / this.pageSize)
    ) {
      this.currentPage++;
    }
  }

  lastPage() {
    this.currentPage = Math.ceil(this.filteredTableData.length / this.pageSize);
  }

  pageNumbers(): (number | string)[] {
    const totalPages = Math.ceil(this.filteredTableData.length / this.pageSize);
    const pageWindowSize = 4;

    let startPage = Math.max(
      this.currentPage - Math.floor(pageWindowSize / 2),
      1
    );
    let endPage = startPage + pageWindowSize - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - pageWindowSize + 1, 1);
    }

    const pages: (number | string)[] = [];

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    this.lastVisiblePage = endPage;

    if (endPage < totalPages) {
      pages.push('...');
    }

    return pages;
  }

  handlePageClick(page: number | string) {
    const totalPages = Math.ceil(this.filteredTableData.length / this.pageSize);

    if (typeof page === 'number') {
      this.changePage(page);
    } else if (page === '...') {
      const nextPage = this.lastVisiblePage + 1;
      if (nextPage <= totalPages) {
        this.changePage(nextPage);
      }
    }
  }

  changePage(pageNumber: number) {
    this.currentPage = pageNumber;
    this.visibleData();
  }

  filterData(searchText: string) {
    this.filteredTableData = this.activeLoads.filter((item) =>
      Object.values(item).some(
        (val) =>
          val != null &&
          val.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
    this.currentPage = 1; // Reset to first page after filtering
  }

  changePageSize(pageSize: number) {
    this.pageSize = Number(pageSize);
    this.visibleData();
    this.currentPage = 1;
  }

  async loadActiveOrders() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      this.orderService.getActiveOrdersForMap(token).subscribe({
        next: (response) => {
          if (response.statusCode == 200) {
            console.log(response);
            this.activeLoads = response.activeLoadInfoList;
            if(this.activeLoads){
              this.filteredTableData = this.activeLoads;
            } else {
              this.popupService.show(
              `No Active Orders`,
              `There is currently no Active Orders`
            );
            }
          } else {
            this.popupService.show(
              `Error`,
              `Order Retrival Failed, Please try again`
            );
          }
          this.componentReady.next(true);
        },
        error: (err) =>
          this.popupService.show(
            `Error1`,
            `Order Retrival Failed, Please try again`
          ),
      });
    } catch (error: any) {
      this.popupService.show(
        `Error2`,
        `Order Retrival Failed, Please try again`
      );
    }
  }

  async RefreshDriverLocations() {
    this.loadActiveOrders();
  }

  focusOnDriver(order: any) {
    this.customMap.focusOnDriver(order.orderNumber);
  }
}

import { Component, Input } from '@angular/core';
import { DynamicItem } from '../../../core/models/class/dynamic-item';
import { BehaviorSubject } from 'rxjs';
import { OrderManagementService } from '../../../core/service/order-management.service';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';
import { PopupService } from '../../../core/service/popup.service';
import {
  DynamicButtonData,
  DynamicPageData,
} from '../../../core/models/interface/dynamic-component.interface';
import * as XLSX from 'xlsx-js-style';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unbooked-order-list',
  imports: [CommonModule],
  templateUrl: './unbooked-order-list.component.html',
  styleUrl: './unbooked-order-list.component.css',
})
export class UnbookedOrderListComponent {
  @Input() data: any;
  componentReady = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly orderService: OrderManagementService,
    private dcService: DynamicCompService,
    private popupService: PopupService
  ) {}

  orders: any[] = [];
  filteredTableData: any[] = [];

  componentName: string = 'OrderList';

  currentPage: number = 1;
  pageSize: number = 10;
  pageSizes: Array<number> = [10, 25, 50, 100];
  startIndex: number = 0;
  endIndex: number = this.pageSize;
  lastVisiblePage: number = 0;
  totalItems: number = 0;

  ngOnInit() {
    // Pass Page Data dynamiclly based on the component
    const pageData: DynamicPageData = {
      pageTitle: 'UnBooked Orders List',
    };
    this.dcService.setPageData(pageData);

    // Pass button data dynamically based on the component
    const buttonData: DynamicButtonData[] = [
      {
        buttonVisible: true,
        buttonLabel: 'Export',
        svg: `
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#c9c9c9">
              <path d="m720-120 160-160-56-56-64 64v-167h-80v167l-64-64-56 56 160 160ZM560 0v-80h320V0H560ZM240-160q-33 0-56.5-23.5T160-240v-560q0-33 23.5-56.5T240-880h280l240 240v121h-80v-81H480v-200H240v560h240v80H240Zm0-80v-560 560Z"/>
            </svg>
          `,
        action: () => this.exportToExcel(),
      },
    ];
    this.dcService.setButtonData(buttonData);

    this.loadUnBookedOrders();
  }

  exportToExcel() {
    const fileName = `${this.componentName} Report.xlsx`;

    // Define which columns you want to export
    const columnsToExport = [
      'orderNumber',
      'brokerName',
      'orderStatus',
      'driverName',
      'phoneNumber',
      'recordCreateDate',
      'recordUpdateDate',
    ]; // Add your desired columns here

    // Filter the data to include only the specified columns
    const Data = this.orders.map((user) => {
      const filteredUser: any = {};
      columnsToExport.forEach((column) => {
        if (user[column] !== undefined) {
          filteredUser[column] = user[column];
        }
      });
      return filteredUser;
    });

    if (!Data.length) {
      this.popupService.show(`Error`, 'No data available for export.');
      return;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(Data);

    // Generate workbook and add the worksheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Save to file
    XLSX.writeFile(wb, fileName);
  }

  //*** Data Visibility ***/
  visibleData() {
    if (!this.filteredTableData) {
      return null;
    }
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
    if (!this.filteredTableData) {
      return
    }
    if (
      this.currentPage <
      Math.ceil(this.filteredTableData.length / this.pageSize)
    ) {
      this.currentPage++;
    }
  }

  lastPage() {
    if (!this.orders) {
      return
    }
    this.currentPage = Math.ceil(this.filteredTableData.length / this.pageSize);
  }

  pageNumbers(): (number | string)[] {
    if (!this.filteredTableData) {
      return []
    }
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
    if (!this.filteredTableData) {
      return
    }
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
    if (!this.filteredTableData) {
      return
    }
    this.filteredTableData = this.orders.filter((item) =>
      Object.values(item).some(
        (val) =>
          val != null &&
          val.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
    this.currentPage = 1; // Reset to first page after filtering
  }

  changePageSize(pageSize: number) {
    if (!this.filteredTableData) {
      return
    }
    this.pageSize = Number(pageSize);
    this.visibleData();
    this.currentPage = 1;
  }

  async loadUnBookedOrders() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      this.orderService.getUnBookedOrders(token).subscribe({
        next: (response) => {
          if (response.statusCode == 200) {
            this.orders = response.unbookedOrderInfoList;
            if (this.orders) {
              this.filteredTableData = this.orders;
            } else {
              this.popupService.show(`No Orders`, `There is currently no unbooked orders`);
            }
            this.componentReady.next(true);
          } else {
            this.popupService.show(`Error`, response.message);
            this.componentReady.next(true);
          }
        },
        error: (err) =>
          this.popupService.show(
            `Error`,
            `Order Retrival Failed, Please try again`
          ),
      });
    } catch (error: any) {
      this.popupService.show(
        `Error`,
        `Order Retrival Failed, Please try again`
      );
    }
  }
}

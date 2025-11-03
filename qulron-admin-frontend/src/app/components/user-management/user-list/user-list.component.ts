import { Component, Input, OnInit } from '@angular/core';
import {
  DynamicButtonData,
  DynamicComponent,
  DynamicPageData,
} from '../../../core/models/interface/dynamic-component.interface';
import { UserManagementService } from '../../../core/service/user-management.service';
import { DynamicCompService } from '../../../core/service/dynamic-comp.service';
import { PopupService } from '../../../core/service/popup.service';
import { BehaviorSubject } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx-js-style';
import { DynamicItem } from '../../../core/models/class/dynamic-item';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
})
export class UserListComponent implements OnInit, DynamicComponent {
  @Input() data: any;
  componentReady = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly userService: UserManagementService,
    private dcService: DynamicCompService,
    private popupService: PopupService
  ) {}

  orders: any[] = [];
  filteredTableData: any[] = [];

  componentName: string = 'UserList';

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
      pageTitle: 'Users List',
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

    this.loadUsers();
  }

  exportToExcel() {
    const fileName = `${this.componentName} Report.xlsx`;

    // Define which columns you want to export
    const columnsToExport = [
      'username',
      'email',
      'role',
      'firstName',
      'lastName',
      'phoneNumber',
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
    this.pageSize = Number(pageSize);
    this.visibleData();
    this.currentPage = 1;
  }

  async loadUsers() {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      this.userService.getAllUsers(token).subscribe({
        next: (response) => {
          if (response.statusCode == 200) {
            this.orders = response.userList;
            this.filteredTableData = this.orders;
            this.componentReady.next(true);
          } else {
            this.popupService.show(`Error`, `${response.message}`);
          }
        },
        error: (err) => this.popupService.show(`Error`, `${err.message}`),
      });
    } catch (error: any) {
      this.popupService.show(`Error`, `${error.message}`);
    }
  }

  deleteUser(username: string) {
    this.popupService.confirm(
      'Delete User',
      `Are you sure you want to delete this user: ${username} ?`,
      () => {
        try {
          const token = sessionStorage.getItem('token');
          if (!token) {
            throw new Error('No token found');
          }
          this.userService.deleteUser(username, token).subscribe({
            next: (response) => {
              if (response.statusCode == 200) {
                this.popupService.show(
                  `User Deleted Successfully`,
                  `${response.message}`
                );
                this.loadUsers();
              } else {
                this.popupService.show(`Error`, `${response.message}`);
              }
            },
          });
        } catch (error: any) {
          this.popupService.show(`Error`, `${error.message}`);
        }
      }
    );
  }

  async updateUser(username: string) {
    const { UpdateUserComponent } = await import(
      '../update-user/update-user.component'
    );
    this.dcService.loadComponent(
      new DynamicItem(UpdateUserComponent, { username })
    );
  }

  resetPassword(username: string) {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No Token Found');
      }
      this.userService.resetUserPassword(username, token).subscribe({
        next: (response) => {
          if (response.statusCode == 200) {
            this.popupService.show(
              'Password Reset Successful',
              `${response.message}`
            );
          } else {
            this.popupService.show(`Error`, `${response.message}`);
          }
        },
      });
    } catch (error: any) {
      this.popupService.show(`Error`, `${error.message}`);
    }
  }
}

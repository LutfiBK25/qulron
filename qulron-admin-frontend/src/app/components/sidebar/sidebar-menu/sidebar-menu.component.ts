import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from '../../../core/models/interface/MenuItem.interface';
import { DynamicComponent } from '../../../core/models/interface/dynamic-component.interface';
import { NavType } from '../../../core/enums/nav-type.enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-menu',
  imports: [CommonModule],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.css',
})
export class SidebarMenuComponent {
  @Input() items: MenuItem[] = [];
  @Output() loadComponent: EventEmitter<DynamicComponent> = new EventEmitter();
  navType = NavType; // Add this line so you can reference the enum in the template

  toggle(item: MenuItem): void {
    if (item.children) {
      // First, close all other paths
      this.closeAllExcept(item, this.items);
      item.open = !item.open;

      // If closing, recursively close all nested children
      if (!item.open) {
        this.closeChildren(item.children);
      }
    }
    if (item.type == NavType.PAGE && item.componentName) {
      this.loadComponent.emit({
        componentName: item.componentName,
        data: {
          pageId: item.pageId,
          appName: item.appName,
          parameters: {},
        },
      });
    }
  }

  private closeChildren(children: MenuItem[]): void {
    for (const child of children) {
      child.open = false;
      if (child.children) {
        this.closeChildren(child.children);
      }
    }
  }

  private closeAllExcept(targetItem: MenuItem | null, items: MenuItem[]): void {
    for (const item of items) {
      if (item !== targetItem) {
        item.open = false;
        if (item.children) {
          this.closeAllExcept(null, item.children);
        }
      } else if (item.children) {
        // Keep its children open if it's the target
        for (const child of item.children) {
          this.closeAllExcept(null, item.children); // Clear other children just in case
        }
      }
    }
  }
}

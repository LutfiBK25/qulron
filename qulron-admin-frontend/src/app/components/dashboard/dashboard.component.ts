import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  componentReady = new BehaviorSubject<boolean>(false);

  ngOnInit() {
    this.componentReady.next(true);
  }
}

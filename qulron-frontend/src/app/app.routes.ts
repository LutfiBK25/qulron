import { Routes } from '@angular/router';
import { UserGatewayComponent } from './components/user-management/user-gateway/user-gateway.component';
import { BrokerGatewayComponent } from './components/user-management/broker-gateway/broker-gateway.component';
import { DriverGatewayComponent } from './components/user-management/driver-gateway/driver-gateway.component';

export const routes: Routes = [
  { path: 'driver', component: DriverGatewayComponent },
  { path: 'broker', component: BrokerGatewayComponent },
  { path: '', component: UserGatewayComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];

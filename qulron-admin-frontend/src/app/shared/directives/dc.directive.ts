import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDc]',
  standalone: true,
})
export class DcDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}

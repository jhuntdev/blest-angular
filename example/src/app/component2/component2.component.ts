import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { BlestService, BlestRequestState } from 'blest-angular';

@Component({
  selector: 'app-component2',
  templateUrl: './component2.component.html',
  styleUrls: ['./component2.component.scss']
})
export class Component2Component {

  name: string = 'Steve';

  data: any = null;
  error: any = null;
  loading: boolean = false;

  constructor(@Inject(BlestService) private blestService: BlestService) {}

  onNameChange(): void {
    this.sendRequest()
  }

  sendRequest(): void {
    this.blestService.request('greet', { name: this.name }).subscribe({
      next: (response: BlestRequestState) => {
        this.data = response.data ? JSON.stringify(response.data) : null;
        this.error = response.error;
        this.loading = response.loading;
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }

  ngOnInit(): void {
    this.sendRequest()
  }

}

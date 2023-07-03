import { Component } from '@angular/core';
import { BlestService } from 'blest-angular';

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

  constructor(private blestService: BlestService) {}

  updateName(): void {
    this.sendRequest()
  }

  sendRequest(): void {
    this.blestService.request('greet', { name: this.name }).subscribe({
      next: (response) => {
        this.data = response.data ? JSON.stringify(response.data) : null;
        this.error = response.error;
        this.loading = response.loading;
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

  ngOnInit(): void {
    this.sendRequest()
  }

}

import { Component, Inject } from '@angular/core';
import { BlestService, BlestRequestState } from 'blest-angular';

@Component({
  selector: 'app-component1',
  templateUrl: './component1.component.html',
  styleUrls: ['./component1.component.scss']
})
export class Component1Component {

  data:any = null;
  error:any = null;
  loading:boolean = false;

  constructor(@Inject(BlestService) private blestService: BlestService) {}

  ngOnInit(): void {

    this.blestService.request('hello', null, ["hello"]).subscribe({
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

}

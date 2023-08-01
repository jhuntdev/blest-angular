import { Component, Inject } from '@angular/core';
import { BlestService, BlestRequestState } from 'blest-angular';

@Component({
  selector: 'app-component4',
  templateUrl: './component4.component.html',
  styleUrls: ['./component4.component.scss']
})
export class Component4Component {

  data:any = null;
  error:any = null;
  loading:boolean = false;

  constructor(@Inject(BlestService) private blestService: BlestService) {}

  ngOnInit(): void {

    this.blestService.request('missing').subscribe({
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

import { Component } from '@angular/core';
import { BlestService } from 'blest-angular';

@Component({
  selector: 'app-component3',
  templateUrl: './component3.component.html',
  styleUrls: ['./component3.component.scss']
})
export class Component3Component {

  data:any = null;
  error:any = null;
  loading:boolean = false;

  constructor(private blestService: BlestService) {}

  ngOnInit(): void {

    this.blestService.request('fail').subscribe({
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

}

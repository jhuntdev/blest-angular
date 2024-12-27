# BLEST Angular

An Angular client for BLEST (Batch-able, Lightweight, Encrypted State Transfer), an improved communication protocol for web APIs which leverages JSON, supports request batching by default, and provides a modern alternative to REST.

To learn more about BLEST, please visit the website: https://blest.jhunt.dev

## Features

- Built on JSON - Reduce parsing time and overhead
- Request Batching - Save bandwidth and reduce load times
- Compact Payloads - Save even more bandwidth
- Single Endpoint - Reduce complexity and facilitate introspection
- Fully Encrypted - Improve data privacy

## Installation

Install BLEST Angular from npm

With npm:
```bash
npm install --save blest-angular
```
or using yarn:
```bash
yarn add blest-angular
```

## Usage

Add `BlestService` to your AppModule providers.

```typescript
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BlestService } from 'blest-angular';

import { AppComponent } from './app.component';
import { ExampleComponent } from './example/example.component';

@NgModule({
  declarations: [
    AppComponent,
    ExampleComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    { provide: BlestService, useFactory: () => new BlestService({ url: 'http://localhost:8080', headers: { 'Authorization': 'Bearer token' } }) },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Include `blestService` in your component constructor and use its `request` method to perform requests.

```typescript
import { Component } from '@angular/core';
import { BlestService } from 'blest-angular';

@Component({
  selector: 'example-component',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {

  data:any = null;
  error:any = null;
  loading:boolean = false;

  constructor(private blestService: BlestService) {}

  ngOnInit(): void {
    this.blestService.request('listItems', { limit: 24 }, { select: ['nodes', ['pageInfo', ['endCursor', 'hasNextPage']]] })
    .subscribe({
      next: (response) => {
        this.data = response.data;
        this.error = response.error;
        this.loading = response.loading;
      },
      error: (error) => {
        console.error(error);
      }
    })
  }

}
```

## License

This project is licensed under the [MIT License](LICENSE).
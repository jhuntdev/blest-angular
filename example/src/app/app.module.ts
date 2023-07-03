import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BlestService } from 'blest-angular';

import { AppComponent } from './app.component';
import { Component1Component } from './component1/component1.component';
import { Component2Component } from './component2/component2.component';
import { Component3Component } from './component3/component3.component';
import { Component4Component } from './component4/component4.component';

@NgModule({
  declarations: [
    AppComponent,
    Component1Component,
    Component2Component,
    Component3Component,
    Component4Component
  ],
  imports: [
    FormsModule,
    BrowserModule
  ],
  providers: [
    { provide: BlestService, useFactory: () => new BlestService({ url: 'http://localhost:8080', headers: { 'Authorization': 'Bearer token' } }) },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

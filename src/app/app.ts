import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNav } from './layout/main-nav/main-nav';
import { SiteFooter } from './layout/site-footer/site-footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNav, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
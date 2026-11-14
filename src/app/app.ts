import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainNav } from './layout/main-nav/main-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainNav],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
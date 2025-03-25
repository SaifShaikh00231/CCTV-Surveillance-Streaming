import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TabService } from '../tab.service';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  activeTab: number = 1;

  constructor(private router: Router, private route: ActivatedRoute ,private tabService: TabService) {}

  ngOnInit(): void {
    this.tabService.activeTab$.subscribe(tab => {
      this.activeTab = tab;
    });
  }

  setActiveTab(tabNumber: number): void {
    this.tabService.setActiveTab(tabNumber);
  }


  getGliderPosition(): string {
    const tabWidth = 300; // Adjust this according to your tab width
    return `${(this.activeTab - 1) * tabWidth}px`;
  }

  navigateTo(path: string): void {
    this.router.navigateByUrl(path);
  }
}

import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css'],
})
export class DemoComponent implements AfterViewInit {
  sliderValue = 30; // Default slider value
  @ViewChild('slider') slider!: ElementRef<HTMLInputElement>;
  @ViewChild('section3') section3!: ElementRef;
  @ViewChild('thumb') thumb!: ElementRef;
  @ViewChild('bar') bar!: ElementRef;

  ngAfterViewInit(): void {
    this.updateSlider();
  }

  updateDonut() {
    const percent = this.sliderValue;
    const offset = percent < 50
      ? (360 / 100) * percent
      : ((360 / 100) * percent) - 180;

    const section3Element = this.section3.nativeElement;
    const section3ItemElement = section3Element.querySelector('.item') as HTMLElement;

    if (percent < 50) {
      section3Element.style.transform = `rotate(${offset}deg)`;
      section3ItemElement.style.transform = `rotate(${180 - offset}deg)`;
      section3ItemElement.style.backgroundColor = '#41A8AB';
    } else {
      section3Element.style.transform = 'rotate(180deg)';
      section3ItemElement.style.transform = `rotate(${offset}deg)`;
      section3ItemElement.style.backgroundColor = '#E64C65';
    }
  }

  updateSlider() {
    const parent = this.slider.nativeElement.parentElement;
    const thumb = this.thumb.nativeElement;
    const bar = this.bar.nativeElement;

    const pct = this.sliderValue * ((parent!.clientHeight - thumb.clientHeight) / parent!.clientHeight);

    thumb.style.bottom = `${pct}%`;
    bar.style.height = `calc(${pct}% + ${thumb.clientHeight / 2}px)`;
    thumb.textContent = `${this.sliderValue}%`;

    this.updateDonut();
  }

  onSliderChange(): void {
    this.updateSlider();
  }
}

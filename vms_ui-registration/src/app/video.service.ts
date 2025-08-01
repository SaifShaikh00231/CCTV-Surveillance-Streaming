  import { Injectable } from '@angular/core';
  import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
  import { Observable, BehaviorSubject } from 'rxjs';

  @Injectable({
    providedIn: 'root'
  })
  export class VideoService {
    private videoUrl = 'http://localhost:8007/video_feed';
    private videoSource = new BehaviorSubject<any>(null);

    constructor(private http: HttpClient) {}
    
    getVideoSource(): Observable<any> {
      return this.videoSource.asObservable();
    }

    startVideoStream(): void {
      this.http.get(this.videoUrl, { responseType: 'arraybuffer' })
        .subscribe((data: any) => {
          let arrayBufferView = new Uint8Array(data);
          let blob = new Blob([arrayBufferView], { type: 'image/jpeg' });
          let urlCreator = window.URL || window.webkitURL;
          let imageUrl = urlCreator.createObjectURL(blob);
          this.videoSource.next(imageUrl);
        });
    }

    stopVideoStream(): void {
      this.videoSource.next(null);
    }
  }
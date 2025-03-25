import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ApiService } from '../api.service';
import { Renderer2 } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';


declare function ffmpeg(libPath: string): any;


@Component({
  selector: 'app-playback',
  templateUrl: './playback.component.html',
  styleUrls: ['./playback.component.css']
})
export class PlaybackComponent implements OnInit {


  isPlaying = false;

  @ViewChild('cameraFeed') cameraFeed!: ElementRef;
  @ViewChild('recordedVideo') recordedVideo!: ElementRef;
  @ViewChild('liveFeed') liveFeed!: ElementRef;
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;

  recording = false;
  stopRecording = false;
  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];
  connect = true;
  isStreamActive = false;
  capturedImage: string | undefined;
  showCaptureIconAnimation = false;
  devices: string[][] = [];
  isSidebarClosed: any;
  rtspLink = 'http://127.0.0.1:8000/camera_ip_feed';
  webcamImageUrl: string | ArrayBuffer | null = null;
  webcamActive = false;
  stream: any;
  gridColumns = 1; // Default number of columns
  gridRows = 1;    // Default number of rows
  containerWidth = 1680 / this.gridColumns; // Calculate container width dynamically
  containerHeight = 740 / this.gridRows;    // Calculate container height dynamically


  constructor(
    private apiService: ApiService,
    private renderer: Renderer2,
    private el: ElementRef,
    private sanitizer: DomSanitizer // Inject DomSanitizer
  ) { }

  ngOnInit(): void {
    this.fetchCameraList();
    ffmpeg('path/to/ffmpeg/library').then((ffmpeg: any) => {
      ffmpeg.load();
    });
  }

  async toggleWebcam(event: MouseEvent) {
    try {
      event.preventDefault(); // Prevent default behavior of anchor tag
      if (!this.webcamActive) {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
        this.webcamActive = true;
      } else {
        this.stopWebcam();
      }
    } catch (error) {
      console.error('Error accessing the webcam:', error);
    }
  }

  stopWebcam() {
    if (this.stream) {
      this.stream.getTracks().forEach((track: { stop: () => any; }) => track.stop());
      this.videoElement.nativeElement.srcObject = null;
      this.webcamActive = false;
    }

  }

  fetchCameraList() {
    this.apiService.getCameraList().subscribe(
      (response) => {
        if (response.status === 'success') {
          this.devices = response.camera_list || [];

          // Calculate number of columns and rows based on the number of cameras
          const totalCameras = this.devices.length;
          this.gridColumns = Math.ceil(Math.sqrt(totalCameras));
          this.gridRows = Math.ceil(totalCameras / this.gridColumns);

          // Calculate container width and height dynamically based on the grid
          this.containerWidth = 1680 / this.gridColumns;
          this.containerHeight = 700 / this.gridRows;
        } else {
          console.error('Failed to fetch camera list:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching camera list:', error);
      }
    );
  }



  toggleSidebar() {
    this.isSidebarClosed = !this.isSidebarClosed;
    const sidebar = this.el.nativeElement.querySelector('.right-sidebar');

    if (sidebar.classList.contains('close')) {
      this.renderer.removeClass(sidebar, 'close');
    } else {
      this.renderer.addClass(sidebar, 'close');
    }
  }


  async startRecording() {
    try {
      this.recording = true;

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.cameraFeed.nativeElement.srcObject = stream;

      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      });
      this.mediaRecorder.start();
      this.isStreamActive = true;
      this.recording = true;
    } catch (error) {
      console.error('Error starting the stream:', error);
    }
  }

  stopRecord() {
    console.log('Stop recording method called');
    this.stopRecording = true; // Set stopRecording to true if recording was ongoing
    setTimeout(() => {
      console.log('Resetting stopRecording to false');
      this.stopRecording = false;
    }, 1000);
    if (this.recording) { // Check if recording is ongoing
      console.log('Recording is ongoing');
      this.mediaRecorder.stop(); // Stop the recording
      this.recording = false;
      console.log('stopRecording set to true');

      if (this.recordedVideo) { // Check if recordedVideo is defined
        const superBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedVideo.nativeElement.srcObject = null;
        this.recordedVideo.nativeElement.src = window.URL.createObjectURL(superBlob);
        this.recordedChunks = [];
      } else {
        console.log('recordedVideo element is not defined');
      }

      // Reset stopRecording to false after 1 second

    } else {
      console.log('No ongoing recording to stop');
    }
  }



  captureImage() {
    console.log('Image captured');
    this.showCaptureIconAnimation = true;
    setTimeout(() => {
      this.showCaptureIconAnimation = false;
    }, 1000);
    const video: HTMLVideoElement = this.cameraFeed.nativeElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d')!;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg');

    // Simulate sending the captured image to the server
    this.sendToServer(imageData);

    // Add class to trigger animation

    // Remove class after 3 seconds

  }

  private sendToServer(imageData: string) {
    // In a real application, you would use Angular HttpClient to send the image to the server
    console.log('Sending image data to the server:', imageData);

    // Simulating server response
    setTimeout(() => {
      console.log('Server response received');
      // For demonstration purposes, we'll set the capturedImage to the sent image data
      this.capturedImage = imageData;
    }, 1000);
  }



  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;

  }

  startPlayback(): void {
    // Add logic to start playback
    // This is where you might play your video or audio
  }

  pausePlayback(): void {
    // Add logic to pause playback
    // This is where you might pause your video or audio
  }

  @ViewChild('fileInput') fileInput: any;

  openFileExplorer() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const selectedFile = event.target.files[0];
    if (this.videoElement) {
      this.playVideo(selectedFile);
    }
  }

  playVideo(file: File) {
    if (this.videoElement) {
      const videoURL = URL.createObjectURL(file);
      this.videoElement.nativeElement.src = videoURL;
      this.videoElement.nativeElement.play();
    }
  }
}
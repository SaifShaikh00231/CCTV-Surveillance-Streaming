import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../api.service';
import { Renderer2 } from '@angular/core';

@Component({
  selector: 'app-live-view',
  templateUrl: './live-view.component.html',
  styleUrls: ['./live-view.component.css']
})
export class LiveViewComponent implements OnInit {
  addRole() {
    throw new Error('Method not implemented.');
  }

  currentDateTime: string = '';
  showScheduleForm: boolean = false;
  scheduleDateTime: string = ''; elapsedTime: number = 0;
  private recordingInterval: any;

  @ViewChild('cameraFeed') cameraFeed!: ElementRef;
  @ViewChild('recordedVideo') recordedVideo!: ElementRef;
  @ViewChild('liveFeed') liveFeed!: ElementRef;
  @ViewChild('video') videoElement!: ElementRef;
  startDateTime: string = ''; // New property to hold start date-time
  endDateTime: string = '';   // New property to hold end date-time
  recording = false;
  stopRecord = false;
  mediaRecorder!: MediaRecorder;
  recordedChunks: Blob[] = [];
  connect = true;
  isStreamActive = false;
  capturedImage: string | undefined;
  showCaptureIconAnimation = false;
  devices: string[][] = [];
  isSidebarClosed: any;
  rtspLinks: string[] = [];

  webcamImageUrl: string | ArrayBuffer | null = null;
  webcamActive = false;
  stream: any;
  gridColumns = 1;
  gridRows = 1;  // Default number of rows
  containerWidth = 1750 / this.gridColumns; // Calculate container width dynamically
  containerHeight = 760 / this.gridRows;    // Calculate container height dynamically
  channelsPerCamera: number[] = []; // Array to store the number of channels for each camera
  selectedCameraIndex: number | null = null;
  selectedChannelIndex: number | null = null;

  constructor(
    private apiService: ApiService,
    private renderer: Renderer2,
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    this.fetchCameraList();
    // Set default selection to the first camera after fetching the camera list
    if (this.devices.length > 0) {
      this.selectedCameraIndex = 0;
      this.channelsPerCamera = this.getChannelsForCamera(this.devices[0]);
    }
  }
  

  fetchCameraList() {
    this.apiService.getCameraList().subscribe(
      (response) => {
        if (response.status === 'success' && response.camera_list) {
          // Filter out cameras that are not deleted
          const filteredCameras = response.camera_list.filter((camera: any) => {
            return camera[camera.length - 5] === false; // Considering the last column is is_deleted
          });

          // Separate non-IP cameras and IP cameras
          const nonIPCameras: any[] = [];
          const IPCameras: any[] = [];

          filteredCameras.forEach((camera: any) => {
            if (camera[2] === 'camera_ip') {
              IPCameras.push(camera);
            } else {
              nonIPCameras.push(camera);
            }
          });

          // Sort IP cameras by some criteria if needed
          // For example, you can sort them by camera ID or name
          IPCameras.sort((a, b) => {
            // Your sorting logic here
            return a.id - b.id; // Sorting by camera ID
          });

          // Concatenate IP cameras followed by non-IP cameras
          this.devices = IPCameras.concat(nonIPCameras);

          // Calculate the number of channels per camera
          const channelsPerCamera: number[] = this.devices.map((camera: any) => {
            if (camera[2] === 'camera_ip') {
              return parseInt(camera[camera.length - 7], 10); // Assuming the number of channels is at index -3
            } else {
              return 1; // Non-IP cameras have 1 channel
            }
          });

          // Count total channels
          const totalChannels = channelsPerCamera.reduce((acc, channels) => acc + channels, 0);

          // Calculate total number of cameras
          const totalCameras = this.devices.length;

          // Calculate number of columns and rows based on the total number of cameras and channels
          this.calculateGridDimensions(totalCameras, channelsPerCamera);

          // Generate RTSP links based on fetched cameras and channels
          this.generateRtspLinks();
        } else {
          console.error('Failed to fetch camera list:', response.message);
        }
      },
      (error) => {
        console.error('Error fetching camera list:', error);
      }
    );
  }



  



  calculateGridDimensions(totalCameras: number, channelsPerCamera: number[]): void {
    let channelsCount = 0; // Renamed variable to avoid duplication
    let camerasCount = 0; // Renamed variable to avoid duplication

    this.devices.forEach((camera: any, index: number) => {
      const cameraType = camera[2]; // Assuming camera type is at index 2
      const channels = parseInt(camera[camera.length - 7], 10); // Assuming the number of channels is at the last index

      if (cameraType === 'camera_ip') {
        channelsCount += channels;
        camerasCount++;
        this.channelsPerCamera.push(channels);
      } else {
        // Add a single camera container if the camera type is not 'camera_ip'
        channelsCount++;
        camerasCount++;
        this.channelsPerCamera.push(1); // Assuming a single channel for non-IP cameras
      }
    });

    // Calculate number of columns and rows based on the total number of cameras and channels
    if (channelsCount <= 12) {
      this.gridColumns = Math.ceil(Math.sqrt(channelsCount));
      this.gridRows = Math.ceil(channelsCount / this.gridColumns);
    } else {
      this.gridColumns = 4; // Fixed number of columns after the 12th container
      this.gridRows = Math.ceil(channelsCount / this.gridColumns);
      // Set a fixed container size after the 12th container
      this.containerWidth = 1750 / this.gridColumns;
      this.containerHeight = 800 / 3; // Height for 3 rows
    }

    // Calculate container width and height dynamically based on the grid
    if (channelsCount <= 12) {
      this.containerWidth = 1750 / this.gridColumns;
      this.containerHeight = 800 / this.gridRows;
    }
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
  generateRtspLinks() {
    this.rtspLinks = [];
    const baseRtspLink = 'http://127.0.0.1:8000/camera_ip_feed/';

    console.log('Devices:', this.devices); // Log the devices array to check its content

    // Iterate over all devices and generate RTSP links for connected IP cameras
    this.devices.forEach((camera: any) => {
        const cameraType = camera[2]; // Assuming camera type is at index 2
        const cameraID = camera[0]; // Assuming camera ID is at index 0
        const status = camera[4]; // Assuming status is at index 4

        console.log('Processing camera:', cameraID, 'Type:', cameraType, 'Status:', status); // Log camera details

        // Check if the camera is of type 'camera_ip' and is connected
        if (cameraType === 'camera_ip' && status === 'connected') {
            const channels = parseInt(camera[10], 10); // Number of channels for the current camera
            console.log('Channels:', channels); // Log the number of channels

            for (let channelIndex = 1; channelIndex <= channels; channelIndex++) {
                // Generate RTSP link for each channel of the current camera
                const rtspLink = `${baseRtspLink}${cameraID}/${channelIndex}`;
                console.log('Generated RTSP Link:', rtspLink); // Log the generated RTSP link
                this.rtspLinks.push(rtspLink);
            }
        }
    });

    console.log('Generated RTSP Links:', this.rtspLinks); // Log the generated RTSP links array
}

  

  getRtspLink(cameraIndex: number, channelIndex: number): string {
    const adjustedIndex = cameraIndex * this.channelsPerCamera[cameraIndex] + channelIndex;
    return this.rtspLinks[adjustedIndex];
  }



  stopWebcam() {
    if (this.stream) {
      this.stream.getTracks().forEach((track: { stop: () => any; }) => track.stop());
      this.videoElement.nativeElement.srcObject = null;
      this.webcamActive = false;
    }

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



  stopRecording() {
    this.stopRecord = true;
    setTimeout(() => {
      this.stopRecord = false;
    }, 1000);
    clearInterval(this.recordingInterval); // Stop the elapsed time interval
    this.recording = false;
    this.stopRecord = true;
    setTimeout(() => {
      this.stopRecord = false;
    }, 1000);
    if (this.selectedCameraIndex !== null && this.selectedChannelIndex !== null) {
      const selectedCamera = this.devices[this.selectedCameraIndex][0]; // Get camera ID
      const selectedChannel = (this.selectedChannelIndex + 1).toString(); // Get channel number
      if (selectedCamera) {
        this.apiService.stopRecording(selectedCamera, selectedChannel).subscribe(
          (response) => {
            if (response.status === 'success') {
              console.log('Recording stopped successfully.');
              this.recording = false;
            } else {
              console.error('Failed to stop recording:', response.message);
            }
          },
          (error) => {
            console.error('Error stopping recording:', error);
          }
        );
      }
    }
  }

  startRecording() {
    if (this.selectedCameraIndex !== null && this.selectedChannelIndex !== null) {
      const selectedCamera = this.devices[this.selectedCameraIndex][0]; // Get camera ID
      const selectedChannel = (this.selectedChannelIndex + 1).toString(); // Get channel number



      if (selectedCamera) {
        this.apiService.startRecording(selectedCamera, selectedChannel).subscribe(
          (response) => {
            if (response.status === 'success') {
              console.log('Recording started successfully.');
              this.recording = true;
              this.elapsedTime = 0; // Reset elapsed time
              this.recordingInterval = setInterval(() => {
                this.elapsedTime++;
              }, 1000); // Update elapsed time every second
            } else {
              console.error('Failed to start recording:', response.message);
            }
          },
          (error) => {
            console.error('Error starting recording:', error);
          }
        );
      }
    }
  }

  selectCameraChannel(cameraIndex: number, channelIndex: number) {
    this.selectedCameraIndex = cameraIndex;
    this.selectedChannelIndex = channelIndex;
  }
  captureImage() {
    this.showCaptureIconAnimation = true;
    setTimeout(() => {
      this.showCaptureIconAnimation = false;
    }, 1000);


    if (this.selectedCameraIndex !== null && this.selectedChannelIndex !== null) {
      const selectedCamera = this.devices[this.selectedCameraIndex][0]; // Get camera ID
      const selectedChannel = (this.selectedChannelIndex + 1).toString(); // Get channel number
      if (selectedCamera) {
        this.apiService.captureAndSaveImage(selectedCamera, selectedChannel,).subscribe(
          (response) => {
            if (response.status === 'success') {
              console.log('Image captured successfully.');


              // Update elapsed time every second
            } else {
              console.error('Failed to Capture:', response.message);
            }
          },
          (error) => {
            console.error('Error start Capturing:', error);
          }
        );
      }
    }
  }



  private sendToServer(imageData: string) {
    // In a real application, you would use Angular HttpClient to send the image to the server
    console.log('Sending image data to the server:', imageData);

    // Simulating server response
    setTimeout(() => {
      console.log('Server response received');
      // For demonstration purposes, you might want to handle the server response here
    }, 1000);
  }
  selectCamera(index: number) {
    this.selectedCameraIndex = index;
  }


  formatElapsedTime(): string {
    const minutes = Math.floor(this.elapsedTime / 60);
    const seconds = this.elapsedTime % 60;

    // Ensure two-digit formatting
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  }

  scheduleRecording() {
    this.showScheduleForm = true;
  }

  cancelSchedule() {
    this.showScheduleForm = false;
    this.scheduleDateTime = ''; // Reset schedule date and time
  }

  onScheduleSubmit() {
    if (this.selectedCameraIndex !== null && this.selectedChannelIndex !== null && this.startDateTime && this.endDateTime) {
      const selectedCamera = this.devices[this.selectedCameraIndex][0]; // Get camera ID
      const selectedChannel = (this.selectedChannelIndex + 1).toString(); // Get channel number
      if (selectedCamera) {
        // Make API call to schedule recording
        this.apiService.scheduleRecording(selectedCamera, selectedChannel, this.startDateTime, this.endDateTime).subscribe(
          (response) => {
            if (response.status === 'success') {
              console.log('Recording scheduled successfully.');
              // Hide the form and reset the startDateTime and endDateTime
              this.showScheduleForm = false;
              this.startDateTime = '';
              this.endDateTime = '';
            } else {
              console.error('Failed to schedule recording:', response.message);
            }
          },
          (error) => {
            console.error('Error scheduling recording:', error);
          }
        );
      }
    } else {
      console.error('Invalid form data');
    }
  }




  getChannelsForCamera(camera: any): number[] {
    if (camera[2] === 'camera_ip') {
      // Assuming the number of channels is at index 10 of the camera array
      const channels = parseInt(camera[10], 10);
      return Array(channels).fill(0).map((_, index) => index);
    } else {
      // Non-IP cameras have no channels
      return [];
    }
  }
  


  // Function to check if a camera channel is selected



  isSelectedCameraChannel(cameraIndex: number, channelIndex: number): boolean {
    return this.selectedCameraIndex === cameraIndex && this.selectedChannelIndex === channelIndex;
  }
  showContextMenu(event: MouseEvent, cameraIndex: number, channelIndex: number): void {
    // Prevent the default context menu
    event.preventDefault();
  
    // Store the selected camera and channel for later use
    this.selectedCameraIndex = cameraIndex;
    this.selectedChannelIndex = channelIndex;
  
    // Create a custom context menu
    const contextMenu = this.renderer.createElement('div');
    this.renderer.addClass(contextMenu, 'custom-context-menu');
  
    // Create remove option in the context menu
    const removeOption = this.renderer.createElement('div');
    this.renderer.addClass(removeOption, 'context-menu-option');
    this.renderer.setProperty(removeOption, 'innerText', 'Remove');
  
    // Pass cameraIndex and channelIndex to the removeContainer function
    this.renderer.listen(removeOption, 'click', (event: MouseEvent) => {
        event.stopPropagation(); // Prevent event propagation to the document click listener
        this.removeContainer(); // Call the removeContainer function
    });
  
    this.renderer.appendChild(contextMenu, removeOption);
  
    // Set the position of the context menu
    this.renderer.setStyle(contextMenu, 'position', 'absolute');
    this.renderer.setStyle(contextMenu, 'left', `${event.clientX}px`);
    this.renderer.setStyle(contextMenu, 'top', `${event.clientY}px`);
  
    // Append the context menu to the body
    this.renderer.appendChild(document.body, contextMenu);
  
    // Listen for clicks outside the context menu to close it
    const closeContextMenu = (event: MouseEvent) => {
        if (!contextMenu.contains(event.target as Node)) { // Check if the click is outside the context menu
            this.renderer.removeChild(document.body, contextMenu); // Remove the context menu
            this.selectedCameraIndex = null; // Reset selected indices
            this.selectedChannelIndex = null;
            document.removeEventListener('click', closeContextMenu); // Remove the event listener
        }
    };
    document.addEventListener('click', closeContextMenu);
}

  removeContainer(): void {
    if (this.selectedCameraIndex !== null && this.selectedChannelIndex !== null) {
      const selectedCamera = this.devices[this.selectedCameraIndex];
      const cameraType = selectedCamera[2]; // Assuming camera type is at index 2
  
      if (cameraType === 'camera_ip') {
        // Remove the container based on cameraIndex and channelIndex
        const containerToRemove = document.querySelector(`.image-container[data-camera-index="${this.selectedCameraIndex}"][data-channel-index="${this.selectedChannelIndex}"]`);
  
        if (containerToRemove) {
          containerToRemove.remove();
          this.channelsPerCamera[this.selectedCameraIndex]--; // Decrement channel count
        }
      } else {
        // For non-IP cameras, remove the entire camera
        this.devices.splice(this.selectedCameraIndex, 1);
  
        // Update channelsPerCamera to remove channels associated with the removed camera
        this.channelsPerCamera.splice(this.selectedCameraIndex, 1);
      }
  
      // Reset the selected indices
      this.selectedCameraIndex = null;
      this.selectedChannelIndex = null;
  
      // Recalculate total channels and total cameras
      const totalChannels = this.channelsPerCamera.reduce((acc, channels) => acc + channels, 0);
      const totalCameras = this.devices.length;
  
      // Recalculate grid dimensions after container removal
      this.calculateGridDimensions2(totalCameras, this.channelsPerCamera);
    }
  }
  
  calculateGridDimensions2(totalCameras: number, channelsPerCamera: number[]): void {
    let totalChannels = 0;
  
    // Calculate total channels based on channelsPerCamera array
    channelsPerCamera.forEach(channels => {
      totalChannels += channels;
    });
  
    // Determine the number of columns and rows based on the total number of cameras and channels
    let gridColumns, gridRows, containerWidth, containerHeight;
  
    if (totalChannels <= 12) {
      gridColumns = Math.ceil(Math.sqrt(totalChannels));
      gridRows = Math.ceil(totalChannels / gridColumns);
      containerWidth = 1750 / gridColumns;
      containerHeight = 800 / gridRows;
    } else {
      gridColumns = 4; // Fixed number of columns after the 12th container
      gridRows = Math.ceil(totalChannels / gridColumns);
      containerWidth = 1750 / gridColumns;
      containerHeight = 800 / 3; // Height for 3 rows
    }
  
    // Set the calculated values to your grid properties
    this.gridColumns = gridColumns;
    this.gridRows = gridRows;
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
  }
  
  
  }
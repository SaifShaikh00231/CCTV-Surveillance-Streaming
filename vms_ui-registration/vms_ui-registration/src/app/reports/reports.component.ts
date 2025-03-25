  import { Component, OnInit, OnDestroy } from '@angular/core';
  import { ApiService, ApiResponse } from '../api.service';
  import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
  import { interval, merge, Subscription, throwError } from 'rxjs';
  import { catchError, switchMap } from 'rxjs/operators';
  import { Chart, ChartConfiguration, registerables } from 'chart.js';

  import jsPDF from 'jspdf';
  import html2canvas from 'html2canvas';




  interface CardData1 {
    cpu_percent: number;
    cpu_temp:number;
    ram_percent: number;
    chrome_usage: number;
  }
  interface CardData2 {

    gpu_name: string;
    gpu_load: number; // Corrected data type to number
    
  }


  @Component({
    selector: 'app-reports',
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.css']
  })
  export class ReportsComponent implements OnInit, OnDestroy {


    chart: any;
    barChart: any;
    lineChart: any;
    cardData: any[] = [];
    cameraLocations: any = {};
    cameraTypes: any[] = [];
    cardData1: CardData1 = { 
      cpu_percent: 0,  
      cpu_temp:0,

      ram_percent: 0,
      chrome_usage: 0,
    };
    cardData2: CardData2 = { 
    
      gpu_name: '', // Corrected initialization to an empty string
      gpu_load: 0, // Initialize as a number
  
    };
    statsSubscription: Subscription | undefined;

    constructor(private apiService: ApiService, private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
      // Call fetchData() when the component initializes
      this.fetchData();
      this.fetchstats(); // Fetch initially
      this.fetchgpustats();

      // Fetch GPU, RAM, Chrome, and memory every 5 seconds
      this.statsSubscription = interval(5000).pipe(
        switchMap(() => this.apiService.getsystemresources())
      ).subscribe(
        (statsdata: ApiResponse) => {
          console.log('Received data from API:', statsdata);
          this.processReportData1(statsdata);
          this.fetchgpustats(); // Fetch GPU stats along with other system resources
        },
        (error: any) => {
          console.error('Error fetching system resources:', error);
        }
      );

      // Call createLineChart() when the component initializes
      Chart.register(...registerables); // Register Chart.js plugins
      this.createLineChart();
    }

    ngOnDestroy(): void {
      // Unsubscribe from stats subscription to avoid memory leaks
      if (this.statsSubscription) {
        this.statsSubscription.unsubscribe();
      }
    }

    calculateDashOffset(cpuPercent: number): number {
      if (cpuPercent < 30) {
        return 245; // Full length (no fill) for CPU < 30%
      } else if (cpuPercent < 50) {
        return 122.5 - ((cpuPercent - 30) / 20) * 122.5; // Dynamic calculation for CPU between 30% and 50%
      } else {
        return 245 - ((cpuPercent - 50) / 50) * 245; // Dynamically calculate offset for CPU >= 50%
      }
    }
  calculateDashOffsetram(ramPercent: number): number {
      if (ramPercent <30) {
        return 245; // Full length (no fill) for CPU < 30%
      } else if (ramPercent < 50) {
        return 122.5 - ((ramPercent - 30) / 20) * 122.5; // Dynamic calculation for CPU between 30% and 50%
      } else {
        return 245 - ((ramPercent - 50) / 50) * 245; // Dynamically calculate offset for CPU >= 50%
      }
    }
    calculateDashOffsetgpu(ramPercent: number): number {
      if (ramPercent <3) {
        return 245; // Full length (no fill) for CPU < 30%
      } else if (ramPercent < 90) {
        return 122.5 - ((ramPercent - 30) / 20) * 122.5; // Dynamic calculation for CPU between 30% and 50%
      } else {
        return 245 - ((ramPercent - 50) / 50) * 245; // Dynamically calculate offset for CPU >= 50%
      }
    }
    
    
    hasPermission(permission: string): boolean {
      const sessionPermissions = localStorage.getItem('session-permissions');
      if (sessionPermissions) {
        const permissions = JSON.parse(sessionPermissions);
        return permissions.includes(permission);
      }
      return false;
    }

    hasAdminPermissions(): boolean {
      return this.hasPermission('update_reports');
    }
    fetchData(): void {
    
      this.apiService.getAdminReportData().subscribe(
        (data: ApiResponse) => {
          this.processReportData(data);
        },
        (error: any) => {
          console.error('Error fetching admin report data:', error);
        }
      );
    }
    fetchstats(): void {
      if (this.hasAdminPermissions()) {
          this.apiService.getsystemresources().subscribe(
              (statsdata: ApiResponse) => {
                  console.log('Received data from API:', statsdata);
                  this.processReportData1(statsdata);
              },
              (error: any) => {
                  console.error('Error fetching admin report data:', error);
              }
          );
      } else {
          this.apiService.getsystemresources().subscribe(
              (statsdata: ApiResponse) => {
                  console.log('Received data from API:', statsdata);
                  this.processReportData1(statsdata);
              },
              (error: any) => {
                  console.error('Error fetching non-admin report data:', error);
              }
          );
      }
  }
  fetchgpustats(): void {
    if (this.hasAdminPermissions()) {
      this.apiService.getgpuStats().subscribe(
        (statsdata: ApiResponse) => {
          console.log('Received data from API:', statsdata);
          this.processReportGpu(statsdata);
        },
        (error: any) => {
          console.error('Error Gpu stats:', error);
        }
      );
    } else {
      this.apiService.getgpuStats().subscribe(
        (statsdata: ApiResponse) => {
          console.log('Received data from API:', statsdata);
          this.processReportGpu(statsdata);
        },
        (error: any) => {
          console.error('Error fetching Error Gpu stats:', error);
        }
      );
    }
  }
  

  processReportData(data: ApiResponse): void {
    const cameraData = data.camera_data;

    // Process data based on permissions
      this.cardData = [
        { 
          title: 'Cameras Online',
          content: `${data.active_cameras} / ${data.total_cameras}  `
        },
 
        { title: 'Active Users', content: ` ${data.active_users} / ${data.total_users} `},
        { title: 'Pending recordings', content: `${data.pending_recordings} / ${data.scheduled_recordings}  `},
        { title: 'Total recordings', content: `${data.total_scheduled_recordings}  `},
 //      { title: 'Active Cameras', content: data.active_cameras },
  //      { title: 'Inactive Cameras', content: data.inactive_cameras },
  //      { title: 'Total Users', content: data.total_users },
   //     { title: 'Inactive Users', content: data.inactive_users },
      ];
   
    
  

    // Count occurrences for each location
    this.cameraLocations = {};
    cameraData.forEach((item: any) => {
      this.cameraLocations[item.location] = (this.cameraLocations[item.location] || 0) + 1;
    });

    // Populate cameraTypes array based on unique camera_type values
    this.cameraTypes = Array.from(new Set(cameraData.map((item: any) => item.camera_type)));

    // Create pie chart using the fetched data
    this.createPieChart();

    // Create bar chart using the fetched data
    this.createBarChart();
  }

  processReportData1(statsdata: ApiResponse): void {
    console.log(statsdata);
    // Process data based on permissions
    if (this.hasAdminPermissions()) {
      this.cardData1 = {
        cpu_percent: statsdata.cpu_percent,
        ram_percent: statsdata.ram_percent,
        chrome_usage: statsdata.chrome_usage,
        cpu_temp:statsdata.cpu_temp,
      };
    } else {
      this.cardData1 = {
        cpu_percent: statsdata.cpu_percent,
        ram_percent: statsdata.ram_percent,
        chrome_usage: statsdata.chrome_usage,
        cpu_temp:statsdata.cpu_temp,
      };
    }
    console.log('Dash offset:', this.calculateDashOffset(this.cardData1.cpu_percent));
  }

  processReportGpu(statsdata: ApiResponse): void {
    console.log(statsdata);
    // Process data based on permissions
    if (this.hasAdminPermissions()) {
      this.cardData2 = {
        gpu_name: statsdata.gpu_name,
        gpu_load: statsdata.gpu_load, // Assign directly without any manipulation
      };
    } else {
      this.cardData2 = {
        gpu_name: statsdata.gpu_name,
        gpu_load: statsdata.gpu_load, // Assign directly without any manipulation
      };
    }
    console.log('Dash offset:', this.calculateDashOffset(this.cardData1.cpu_percent));
  }
  


  createPieChart(): void {
    const canvas = document.getElementById('cameraLocationChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Could not find cameraLocationChart canvas element');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    const labels = Object.keys(this.cameraLocations);
    const data = Object.values(this.cameraLocations).map(value => Number(value));

    // If no values, create a default dataset with a single value
    if (labels.length === 0) {
      labels.push('Default Location');
      data.push(1); // or any default value you prefer
    }

    // Initial set of pastel colors
    let pastelColors = [
      'rgba(255, 153, 153, 0.2)',
      'rgba(179, 204, 255, 0.2)',
      'rgba(255, 229, 153, 0.2)',
      'rgba(179, 255, 204, 0.2)',
    ];

    // Generate random pastel colors if more labels exist
    const additionalColorsCount = labels.length - pastelColors.length;
    if (additionalColorsCount > 0) {
      const generatedColors = this.generateRandomPastelColors(additionalColorsCount);
      pastelColors = pastelColors.concat(generatedColors);
    }

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          label: 'Camera Distribution by Location',
          data,
          backgroundColor: pastelColors, // Use pastel colors here
          borderColor: pastelColors.map(color => color.replace('0.2', '1')), // Use darker version for border
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Distribution of Cameras by Location',
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  generateRandomPastelColors(count: number): string[] {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const pastelColor = this.generateRandomPastelColor();
      colors.push(pastelColor);
    }
    return colors;
  }

  generateRandomPastelColor(): string {
    const max = 150; // Adjust as needed for lighter or darker colors
    const r = Math.floor(Math.random() * max + 55);
    const g = Math.floor(Math.random() * max + 55);
    const b = Math.floor(Math.random() * max + 55);
    const alpha = 0.2; // Adjust as needed for transparency
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }


  createBarChart(): void {
    const canvas = document.getElementById('cameraTypeChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Could not find cameraTypeChart canvas element');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    if (this.hasAdminPermissions()) {
      // If user has admin permissions, fetch admin report data
      this.apiService.getAdminReportData().subscribe(
        (response: ApiResponse) => {
          const cameraData = response.camera_data;

          // Initialize counts for each camera type
          const cameraTypeCounts: { [key: string]: number } = {};
          this.cameraTypes.forEach((type: string) => {
            cameraTypeCounts[type] = 0;
          });

          // Count occurrences of each camera type from the camera data
          cameraData.forEach((item: any) => {
            cameraTypeCounts[item.camera_type]++;
          });

          const labels = Object.keys(cameraTypeCounts);
          const barChartData: number[] = Object.values(cameraTypeCounts);

          const config: ChartConfiguration<'bar'> = {
            type: 'bar',
            data: {
              labels,
              datasets: [{
                label: 'Camera Type Counts',
                data: barChartData,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }]
            },
            options: {
              plugins: {
                title: {
                  display: true,
                  text: 'Camera Type Counts',
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: false,
                  },
                },
                x: {
                  title: {
                    display: true,
                    text: 'Camera Type'
                  }
                }
              }
            }
          };

          this.barChart = new Chart(ctx, config);
        },
        (error: any) => {
          console.error('Error fetching admin report data:', error);
        }
      );
    } else {
      // If user doesn't have admin permissions, fetch non-admin report data
      this.apiService.getNonAdminReportData().subscribe(
        (response: ApiResponse) => {
          const cameraData = response.camera_data;

          // Initialize counts for each camera type
          const cameraTypeCounts: { [key: string]: number } = {};
          this.cameraTypes.forEach((type: string) => {
            cameraTypeCounts[type] = 0;
          });

          // Count occurrences of each camera type from the camera data
          cameraData.forEach((item: any) => {
            cameraTypeCounts[item.camera_type]++;
          });

          const labels = Object.keys(cameraTypeCounts);
          const barChartData: number[] = Object.values(cameraTypeCounts);

          // Convert barChartData values to integers
        const barChartDataIntegers = barChartData.map(value => Math.round(value));

        const config: ChartConfiguration<'bar'> = {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Camera Type Counts',
              data: barChartDataIntegers,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            plugins: {
              title: {
                display: true,
                text: 'Camera Type Counts',
              }
            },
            scales: {
              y: {
                type: 'linear',
                beginAtZero: true,
                grid: {
                  display: false,
                },
                ticks: {
                  stepSize: 1, // Ensure ticks are integers
                  precision: 0, // Ensure ticks are integers
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Camera Type'
                }
              }
            }
          }
        };
        

          this.barChart = new Chart(ctx, config);
        },
        (error: any) => {
          console.error('Error fetching non-admin report data:', error);
        }
      );
    }
  }
  createLineChart(): void {
    const canvas = document.getElementById('recordingsLineChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Could not find recordingsLineChart canvas element');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Fetch recording data from the API endpoint based on user permissions
    if (this.hasAdminPermissions()) {
      this.apiService.getAdminReportData().subscribe(
        (data: ApiResponse) => {
          this.processLineChartData(data, ctx);
        },
        (error: any) => {
          console.error('Error fetching admin report data:', error);
        }
      );
    } else {
      this.apiService.getNonAdminReportData().subscribe(
        (data: ApiResponse) => {
          this.processLineChartData(data, ctx);
        },
        (error: any) => {
          console.error('Error fetching non-admin report data:', error);
        }
      );
    }
  }

  processLineChartData(data: ApiResponse, ctx: CanvasRenderingContext2D): void {
    // Extract recording data from the API response
    const recordingsData = data.daily_recordings;

    // Extract timestamps and count recordings for each day
    const dayCounts: { [key: string]: number } = {};
    recordingsData.forEach((item: any) => {
      const recordingDate = item.date;
      // Extract date without time zone
      const dateWithoutTimeZone = new Date(recordingDate).toLocaleDateString('en-US');
      dayCounts[dateWithoutTimeZone] = item.daily_recordings;
    });

    // Aggregate recordings per week, per month, and per year
    const weekCounts: { [key: string]: number } = {};
    const monthCounts: { [key: string]: number } = {};
    const yearCounts: { [key: string]: number } = {};
    Object.keys(dayCounts).forEach(date => {
      const recordingDate = new Date(date);
      const weekKey = `${recordingDate.getFullYear()}-W${this.getISOWeek(recordingDate)}`;
      const monthKey = `${recordingDate.getFullYear()}-${recordingDate.getMonth() + 1}`;
      const yearKey = `${recordingDate.getFullYear()}`;
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + dayCounts[date];
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + dayCounts[date];
      yearCounts[yearKey] = (yearCounts[yearKey] || 0) + dayCounts[date];
    });

    const dayLabels = Object.keys(dayCounts);
    const weekLabels = Object.keys(weekCounts);
    const monthLabels = Object.keys(monthCounts);
    const yearLabels = Object.keys(yearCounts);

    const dayLineChartData: number[] = Object.values(dayCounts);
    const weekLineChartData: number[] = Object.values(weekCounts);
    const monthLineChartData: number[] = Object.values(monthCounts);
    const yearLineChartData: number[] = Object.values(yearCounts);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: dayLabels,
        datasets: [
          {
            label: 'Recordings per Day',
            data: dayLineChartData,
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            fill: false
          },
          {
            label: 'Recordings per Week',
            data: weekLineChartData,
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            fill: false,
            hidden: true // Initially hidden
          },
          {
            label: 'Recordings per Month',
            data: monthLineChartData,
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1,
            fill: false,
            hidden: true // Initially hidden
          },
          {
            label: 'Recordings per Year',
            data: yearLineChartData,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false,
            hidden: true // Initially hidden
          }
        ]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Number of Recordings',
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
            },
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        },
        onClick: (event, activeElements) => {
          if (activeElements.length > 0) {
            const datasetIndex = activeElements[0].datasetIndex;
            switch (datasetIndex) {
              case 0:
                // Do nothing, already displaying recordings per day
                break;
              case 1:
              case 2:
              case 3:
                // Toggle visibility of recordings per week, per month, and per year
                this.lineChart.data.datasets[datasetIndex].hidden = !this.lineChart.data.datasets[datasetIndex].hidden;
                break;
              default:
                break;
            }
            this.lineChart.update();
          }
        }
      }
    };

    // Create the line chart with the fetched data
    this.lineChart = new Chart(ctx, config);
  }

  // Helper function to get ISO week number
  getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  }

  readonly options = {
    margin: 10,
    filename: 'reports.pdf',
    image: { type: 'jpeg', quality: 10 }, // Adjust quality as needed
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  };

  // ... (other code)
  exportToPDF(): void {
    this.openSnackBar('Your report is exported Successfully', 'custom-snackbar');
    const content = document.getElementById('export-content');
    console.log('Content Element:', content);
    if (content) {
      // Use jsPDF as default import
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'landscape',
      });

      // Convert the content to canvas and add it to the PDF
      html2canvas(content, { scale: this.options.html2canvas.scale }).then((canvas) => {
        const imgData = canvas.toDataURL('image/jpeg', this.options.image.quality);

        // Adjust the dimensions and position for PDF rendering
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const adjustedWidth = canvas.width * ratio;
        const adjustedHeight = canvas.height * ratio;

        // Add the image to the PDF with appropriate dimensions and center it
        const offsetX = (pdfWidth - adjustedWidth) / 10;
        const offsetY = (pdfHeight - adjustedHeight) / 10;

        // Adjust offsets to create margins
        const marginLeft = 0; // Adjust as needed
        const marginTop = 0; // Adjust as needed

        pdf.addImage(imgData, 'JPEG', offsetX + marginLeft, offsetY + marginTop, adjustedWidth, adjustedHeight);

        // Save or open the PDF
        pdf.save(this.options.filename);
      }).catch(error => {
        console.error('Error capturing content:', error);
      });
    }
  }


  openSnackBar(message: string, panelClass: string) {
    const config = new MatSnackBarConfig();
    config.duration = 2000;
    config.panelClass = [panelClass];
    this.snackBar.open(message, 'Close', config);
  }


}


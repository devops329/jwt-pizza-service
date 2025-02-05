class Info {
    constructor() {
      this.data = [];
    }
  }
  
  class Weather extends Info {
    constructor() {
        super();
    }
  
    report(weatherInfo) {
        this.data.push(weatherInfo);
    }
  
    getAverageTemperature() {
      let sum = 0;
      if (this.data.length > 0) {
        for (let i = 0; i < this.data.length; i++) {
          sum += this.data[i].temperature;
        }
  
        return sum / this.data.length;
      }
      return sum;
    }
  }
  
  let weather = new Weather();
  weather.report({ temperature: 25, humidity: 60 });
  weather.report({ temperature: 30, humidity: 70 });
  console.log(weather.getAverageTemperature());
  
  weather = new Weather();
  console.log(weather.getAverageTemperature());
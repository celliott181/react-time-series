const { useEffect, useState } = React;
const { Subscription, interval } = rxjs;
const { debounceTime, map } = rxjs.operators;

function getSineWaveData(periodInSeconds, totalTimeInSeconds) {
  const intervalInMs = 1000; // Emit data points every 1000ms (1 second)
  const totalDataPoints = totalTimeInSeconds;
  const omega = (2 * Math.PI) / periodInSeconds;

  return interval(intervalInMs).pipe(
    map(i => ({
      time: i, // Each point is one second apart
      value: Math.sin(omega * i),
    })),
    map(({ time, value }) => ({
      time,
      value: (value + 1) / 2, // Normalize value between 0 and 1
    })),
    map((data, index) => (index < totalDataPoints ? data : null)),
    map(data => (data ? data : { time: totalTimeInSeconds, value: null }))
  );
}

function TimeSeries() {
  const [data, setData] = useState([]);
  const chartWidth = 600; // Width of the SVG component in pixels
  const chartHeight = 300; // Height of the SVG component in pixels
  const timeWindow = 10; // Time window in seconds to display
  const pixelsPerSecond = chartWidth / timeWindow; // Pixels per second to scale the x-axis

  useEffect(() => {
    const sineWaveData$ = getSineWaveData(27, 60);
    const subscription = new Subscription();

    const sub = sineWaveData$.subscribe({
      next: newPoint => {
        if (newPoint.value !== null) {
          setData(prevData => {
            const currentTime = newPoint.time;
            // Remove data points that are outside the time window
            const filteredData = prevData.filter(point => currentTime - point.time <= timeWindow);
            return [...filteredData, newPoint];
          });
        }
      },
      complete: () => {
        console.log('Data stream complete');
      },
    });

    subscription.add(sub);

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <h1>Time Series Data Visualization</h1>
      <svg width={chartWidth} height={chartHeight}>
        {data.map((point, index) => {
          const currentTime = data[data.length - 1]?.time || 0; // Get the most recent time point
          const xPosition = chartWidth - (currentTime - point.time) * pixelsPerSecond;
          return (
            <circle
              key={index}
              cx={xPosition} // Align to the right and shift older points left
              cy={(1 - point.value) * chartHeight} // Map value to y-axis
              r="2"
              fill="blue"
            />
          );
        })}
      </svg>
    </div>
  );
}

ReactDOM.render(<TimeSeries />, document.getElementById('root'));

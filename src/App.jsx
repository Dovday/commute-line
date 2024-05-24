import { useEffect, useState } from 'react';
import * as cheerio from 'cheerio';
import axios from 'axios';
import moment from 'moment';
import { AutoComplete, Input } from 'antd';
import './App.css';

// UTILS - start
const initStation = () => {
  return {
    'id': null,
    'name': null
  };
};

const cleanArray = (array) => {
  // remove all new lines and white string in the elements and remove empty elements
  return array.map((el) => el.replace(/\n/g, '').trim());
};
// UTILS - end

function App() {
  const [stations, setStations] = useState([]);

  const [inputOrigin, setInputOrigin] = useState('');
  const [inputDestination, setInputDestination] = useState('');

  const [origin, setOrigin] = useState(initStation());
  const [destination, setDestination] = useState(initStation());

  // states for train solutions from origin to destination and viceversa
  const [origin2destination, setOrigin2destination] = useState([]);
  const [destination2origin, setDestination2origin] = useState([]);

  // CHEERIO - start
  const getStationsId = async () => {
    const response = await axios.get('/stations', {
      headers: {}
    });
    // Load the HTML into Cheerio
    const html = response.data;

    // Use Cheerio to parse the HTML
    const $ = cheerio.load(html);
    // get all options with value attribute

    const stations = $('select > option').map((i, el) => {
      return {
        id: $(el).attr('value'),
        name: $(el).text()
      };
    }).toArray();

    setStations(stations);
  };

  const getRFI = async (stationId, destination) => {
    const response = await axios.get(`/rfi/${stationId}`, {
      headers: {},
    });

    // Load the HTML into Cheerio
    const html = response.data;

    // Use Cheerio to parse the HTML
    const $ = cheerio.load(html);
    // get all options with value attribute

    let numbers = $('td#RTreno').map((i, el) => {
      return $(el).text().replace(' ', '');
    }).toArray();

    let plannedTimes = $('td#ROrario').map((i, el) => {
      return $(el).text();
    }).toArray();

    let delays = $('td#RRitardo').map((i, el) => {
      return $(el).text();
    }).toArray();

    let platforms = $('td#RBinario > div').map((i, el) => {
      return $(el).text();
    }).toArray();

    let blinking = $('td#RExLampeggio').map((i, el) => {
      return $(el).attr('aria-label');
    }).toArray();

    let moreInfo = $('.FermateSuccessivePopupStyle > .testoinfoaggiuntive').map((i, el) => {
      return $(el).text();
    }).toArray();

    numbers = cleanArray(numbers);
    plannedTimes = cleanArray(plannedTimes);
    delays = cleanArray(delays);
    platforms = cleanArray(platforms);
    blinking = cleanArray(blinking);
    moreInfo = cleanArray(moreInfo);

    // push each train data like an object to the array
    const trains = [];
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === '') continue;

      // filter only the trains that go to the destination
      if (moreInfo[i] == null || !moreInfo[i].includes(`- ${destination} (`)) continue;

      trains.push({
        number: numbers[i],
        plannedTime: plannedTimes[i],
        // if train is late, calculate the real time using moment.js
        realTime: delays[i] === '0' ? plannedTimes[i] : moment(plannedTimes[i], 'HH:mm').add(delays[i], 'minutes').format('HH:mm'),
        delay: delays[i],
        platform: platforms[i],
        blinking: !blinking[i].includes('No'),
        nextStops: moreInfo[i]
      });
    }
    return trains;
  };

  getStationsId(); // output: stations
  // CHEERIO - end

  useEffect(() => {
    const savedOrigin = localStorage.getItem('origin');
    const savedDestination = localStorage.getItem('destination');

    console.log(`💾 ${savedOrigin}, ${savedDestination}`);

    if (savedOrigin != null && savedDestination != null) {
      setOrigin(JSON.parse(savedOrigin));
      setDestination(JSON.parse(savedDestination));
    }
  }, []);

  const getTrainSolutions = async () => {
    setOrigin2destination(await getRFI(origin.id, destination.name));
    setDestination2origin(await getRFI(destination.id, origin.name));
  };

  // setting origin and destination stations based on inputs (adding id)
  useEffect(() => {
    if (!stations.length) return;

    const originStation = stations.find((station) => station.name === inputOrigin);

    if (originStation == null) return;

    localStorage.setItem('origin', JSON.stringify(originStation));
    setOrigin(originStation);
  }, [inputOrigin]);
  useEffect(() => {
    if (!stations.length) return;

    const destinationStation = stations.find((station) => station.name === inputDestination);

    if (destinationStation == null) return;

    localStorage.setItem('destination', JSON.stringify(destinationStation));
    setDestination(destinationStation);
  }, [inputDestination]);

  useEffect(() => {
    if (origin.id == null || destination.id == null) return;

    if (origin.id === destination.id) return;

    getTrainSolutions();
  }, [origin, destination]);

  return (
    <>
      <div>
        <h1></h1>
        <div>
          <div>
            <AutoComplete
              popupClassName="certain-category-search-dropdown"
              popupMatchSelectWidth={350}
              style={{
                width: 250,
              }}
              onChange={(value) => setInputOrigin(value)}
              filterOption
              options={stations.map(station => ({ value: station.name }))}
              size="large"
            >
              <Input.Search size="large" placeholder={origin.id != null ? origin.name : "Origin station"} />
            </AutoComplete>
            {origin2destination.length > 0 && (
              origin2destination.map(train => (
                <div key={train.id}>
                  {`${train.number}: ${train.plannedTime} ${train.delay ?? ''} @ ${train.platform}`}
                </div>
              ))
            )}
          </div>
          <div>
            <AutoComplete
              popupClassName="certain-category-search-dropdown"
              popupMatchSelectWidth={350}
              style={{
                width: 250,
              }}
              onChange={(value) => setInputDestination(value)}
              filterOption
              options={stations.map(station => ({ value: station.name }))}
              size="large"
            >
              <Input.Search size="large" placeholder={destination.id != null ? destination.name : "Destination station"} />
            </AutoComplete>
            {destination2origin.length > 0 && (
              destination2origin.map(train => (
                <div key={train.id}>
                  {`${train.number}: ${train.plannedTime} ${train.delay ?? ''} @ ${train.platform}`}
                </div>
              ))
            )}
          </div>
        </div>
      </div >
    </>
  )
}

export default App

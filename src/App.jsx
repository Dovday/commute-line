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
    console.log(trains);
  };

  getStationsId(); // output: stations
  // CHEERIO - end

  // setting origin and destination stations based on inputs (adding id)
  useEffect(() => {
    if (!stations.length) return;

    const originStation = stations.filter((station) => station.name === inputOrigin);

    if (originStation.length === 0) return;
    setOrigin(originStation[0]);
  }, [inputOrigin]);
  useEffect(() => {
    if (!stations.length) return;

    const destinationStation = stations.filter((station) => station.name === inputDestination);

    if (destinationStation.length === 0) return;
    setDestination(destinationStation[0]);
  }, [inputDestination]);

  useEffect(() => {
    if (origin.id == null || destination.id == null) return;
    console.log('🚨 Origin and destination are set and not null');

    if (origin.id === destination.id) {
      console.log('🚨 Origin and destination are the same');
      return;
    }
    console.log(`FROM ${origin.name} TO ${destination.name}`);
    getRFI(origin.id, destination.name);

    console.log(`FROM ${destination.name} TO ${origin.name}`);
    getRFI(destination.id, origin.name);
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
              <Input.Search size="large" placeholder="Origin station" />
            </AutoComplete>
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
              <Input.Search size="large" placeholder="Destination station" />
            </AutoComplete>
          </div>
        </div>
      </div >
    </>
  )
}

export default App

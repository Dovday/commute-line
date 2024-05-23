import { useEffect, useState } from 'react';
import * as cheerio from 'cheerio';
import axios from 'axios';
import moment from 'moment';
import './App.css';

const initStation = () => {
  return {
    'id': null,
    'name': null
  };
};

function App() {
  const [stations, setStations] = useState([]);

  const [inputOrigin, setInputOrigin] = useState('');
  const [inputDestination, setInputDestination] = useState('');

  const [origin, setOrigin] = useState(initStation());
  const [destination, setDestination] = useState(initStation());

  const [originMatchedStations, setOriginMatchedStations] = useState([]);
  const [destinationMatchedStations, setDestinationMatchedStations] = useState([]);

  // 1) CHEERIO
  // 1) start
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

  // getStationsId();

  const cleanArray = (array) => {
    // remove all new lines and white string in the elements and remove empty elements
    return array.map((el) => el.replace(/\n/g, '').trim());
  };

  const getRFI = async (stationId) => {
    const response = await axios.get('/rfi', {
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

    numbers = cleanArray(numbers);
    plannedTimes = cleanArray(plannedTimes);
    delays = cleanArray(delays);
    platforms = cleanArray(platforms);
    blinking = cleanArray(blinking);

    // push each train data like an object to the array
    const trains = [];
    for (let i = 0; i < numbers.length; i++) {
      if (numbers[i] === '') continue;
      trains.push({
        number: numbers[i],
        plannedTime: plannedTimes[i],
        // if train is late, calculate the real time using moment.js
        realTime: delays[i] === '0' ? plannedTimes[i] : moment(plannedTimes[i], 'HH:mm').add(delays[i], 'minutes').format('HH:mm'),
        delay: delays[i],
        platform: platforms[i],
        blinking: blinking[i]
      });
    }
    console.log(trains);
  };

  getRFI(1852);

  // 1) end

  // const getMatchedStations = (input) => {
  //   const matchedStations = stations.filter(station => station.name.includes(input.toUpperCase()));

  //   // sort by name length
  //   matchedStations.sort((a, b) => a.name.length - b.name.length);

  //   // limit to 3 only if there are more than 3
  //   matchedStations.length = matchedStations.length > 3 ? 3 : matchedStations.length;

  //   return matchedStations;
  // };

  // useEffect(() => {
  //   if (!stations.length) return;

  //   console.log(getMatchedStations(inputOrigin));

  //   setOriginMatchedStations(getMatchedStations(inputOrigin));

  //   // has to be the one user selectes
  //   // setOrigin({...origin, 'rfi': getMatchedStations(inputOrigin)[0]});
  // }, [inputOrigin]);

  // useEffect(() => {
  //   if (!stations.length) return;

  //   console.log(`🚂 ${inputDestination}:`);

  //   setDestinationMatchedStations(getMatchedStations(inputDestination));

  //   // has to be the one user selectes
  //   // setOrigin({...origin, 'rfi': getMatchedStations(inputOrigin)[0]});
  // }, [inputDestination]);

  // const renderStationOptions = (station) => {
  //   if (station === 'origin') {
  //     return (<>{(inputOrigin && originMatchedStations.length > 0 && origin.rfi.id == null) && (
  //       <select
  //         value={origin.rfi.id != null ? origin.rfi.name : ''}
  //         onChange={(e) => setOrigin({ ...origin, 'rfi': JSON.parse(e.target.value) })}
  //       >
  //         {originMatchedStations.map((station) => {
  //           return (
  //             <option key={station.id} value={`${JSON.stringify(station)}`}>
  //               {station.name}
  //             </option>
  //           );
  //         })}
  //       </select>
  //     )}</>);
  //   } else {
  //     // destination
  //     return (<>{(inputDestination && destinationMatchedStations.length > 0 && destination.rfi.id == null) && (
  //       <select
  //         value={destination.rfi.id != null ? destination.rfi.name : ''}
  //         onChange={(e) => setDestination({ ...destination, 'rfi': JSON.parse(e.target.value) })}
  //       >
  //         {destinationMatchedStations.map((station) => {
  //           return (
  //             <option key={station.id} value={`${JSON.stringify(station)}`}>
  //               {station.name}
  //             </option>
  //           );
  //         })}
  //       </select>
  //     )}</>);
  //   }
  // };

  return (
    <>
      <div>
        <h1>Commutrain</h1>
        <form>
          <label>
            Origin Station:
            {/* <input type="text" value={origin.rfi.id != null ? origin.rfi.name : inputOrigin} onChange={e => setInputOrigin(e.target.value)} /> */}
          </label>
          {/* {renderStationOptions('origin')}
          <label>
            Destination Station:
            <input type="text" value={inputDestination} onChange={e => setInputDestination(e.target.value)} />
          </label>
          {renderStationOptions('destination')}
          <button type="submit">Get Train Times</button> */}
        </form>
      </div >
    </>
  )
}

export default App

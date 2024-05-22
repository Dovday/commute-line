import { useEffect, useState } from 'react';
import * as cheerio from 'cheerio';
import axios from 'axios';
import './App.css';

const initStation = () => {
  return {
    'rfi': {
      'id': null,
      'name': null
    },
    'viaggioTreno': {
      'id': null,
      'name': null
    }
  };
};

function App() {
  const [stations, setStations] = useState([]);

  const [inputOrigin, setInputOrigin] = useState('');
  const [inputDestination, setInputDestination] = useState('');

  const [origin, setOrigin] = useState(initStation());
  const [destination, setDestination] = useState(initStation());

  const [originMatchedRFI, setOriginMatchedStations] = useState([]);
  const [destinationMatchedRFI, setDestinationMatchedRFI] = useState([]);

  let $ = [];

  const getRFI = async (stationId) => {
    const response = await axios.get('/rfi', {
      headers: {},
      params: {
        stationId
      }
    });

    console.log(response.data);
  };

  const getStationsId = async () => {
    const response = await axios.get('/monitor', {
      headers: {}
    });
    // Load the HTML into Cheerio
    const html = response.data;

    // Use Cheerio to parse the HTML
    $ = cheerio.load(html);
    // get all options with value attribute

    const stations = $('select > option').map((i, el) => {
      return {
        id: $(el).attr('value'),
        name: $(el).text()
      };
    }).toArray();

    setStations(stations);
  };

  getStationsId();

  const getMatchedStations = (input) => {
    const matchedStations = stations.filter(station => station.name.includes(input.toUpperCase()));

    // sort by name length
    matchedStations.sort((a, b) => a.name.length - b.name.length);

    // limit to 3 only if there are more than 3
    matchedStations.length = matchedStations.length > 3 ? 3 : matchedStations.length;

    return matchedStations;
  };

  useEffect(() => {
    console.log(origin);
  }, [origin]);

  useEffect(() => {
    if (!stations.length) return;

    console.log(getMatchedStations(inputOrigin));

    setOriginMatchedStations(getMatchedStations(inputOrigin));

    // has to be the one user selectes
    // setOrigin({...origin, 'rfi': getMatchedStations(inputOrigin)[0]});
  }, [inputOrigin]);

  useEffect(() => {
    if (!stations.length) return;

    console.log(`🚂 ${inputDestination}:`);

    setDestinationMatchedRFI(getMatchedStations(inputDestination));

    // has to be the one user selectes
    // setOrigin({...origin, 'rfi': getMatchedStations(inputOrigin)[0]});
  }, [inputDestination]);

  // print everything
  useEffect(() => {
    // console.log('stations', stations);
    console.log('inputOrigin', inputOrigin);
    // console.log('inputDestination', inputDestination);
    console.log('origin', origin);
    // console.log('destination', destination);
    console.log('originMatchedStations', originMatchedRFI);
    // console.log('destinationMatchedStations', destinationMatchedRFI);
    console.log('===================');
  });

  const renderStationOptions = (station) => {
    if (station === 'origin') {
    return (<>{(inputOrigin && originMatchedRFI.length > 0 && origin.rfi.id == null) && (
      <select
        value={origin.rfi.id != null ? origin.rfi.name : ''}
        onChange={(e) => setOrigin({...origin, 'rfi': JSON.parse(e.target.value)})}
      >
        {originMatchedRFI.map((station) => {
          return (
            <option key={station.id} value={`${JSON.stringify(station)}`}>
              {station.name}
            </option>
          );
        }) }
      </select>
    )}</>);
   } else {
      // destination
      return (<>{(inputDestination && destinationMatchedRFI.length > 0 && destination.rfi.id == null) && (
        <select
          value={destination.rfi.id != null ? destination.rfi.name : ''}
          onChange={(e) => setDestination({...destination, 'rfi': JSON.parse(e.target.value)})}
        >
          {destinationMatchedRFI.map((station) => {
            return (
              <option key={station.id} value={`${JSON.stringify(station)}`}>
                {station.name}
              </option>
            );
          }) }
        </select>
      )}</>);
    }
  };

  return (
    <>
      <div>
        <h1>Commutrain</h1>
        <form>
          <label>
            Origin Station:
            <input type="text" value={origin.rfi.id != null ? origin.rfi.name : inputOrigin} onChange={e => setInputOrigin(e.target.value)} />
          </label>
          {renderStationOptions('origin')}
          <label>
            Destination Station:
            <input type="text" value={inputDestination} onChange={e => setInputDestination(e.target.value)} />
          </label>
          {renderStationOptions('destination')}
          <button type="submit">Get Train Times</button>
        </form>
      </div >
    </>
  )
}

export default App

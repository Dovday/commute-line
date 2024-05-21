import { useEffect, useState } from 'react';
import * as cheerio from 'cheerio';
import axios from 'axios';
import './App.css';

function App() {
  const [stations, setStations] = useState([]);
  const [originStation, setOriginStation] = useState('');
  const [destinationStation, setDestinationStation] = useState('');

  let $ = [];

  const getRFI = async (stationId) => {
    const response = await axios.get('/rfi', {
      headers: {}
    });

    console.log(response.data);
  };

  getRFI(1852);

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

  // getStationsId();

  useEffect(() => {
    if (!stations.length) return;

    console.log(`🚂 ${originStation}:`);
    console.log(stations.filter(station => station.name.includes(originStation.toUpperCase())));
  }, [originStation]);

  useEffect(() => {
    if (!stations.length) return;

    console.log(`🚂 ${destinationStation}:`)
    console.log(stations.filter(station => station.name.includes(destinationStation.toUpperCase())));
  }, [destinationStation]);


  return (
    <>
      <div>
        <h1>Commutrain</h1>
        <form>
          <label>
            Origin Station:
            <input type="text" value={originStation} onChange={e => setOriginStation(e.target.value)} />
          </label>
          <label>
            Destination Station:
            <input type="text" value={destinationStation} onChange={e => setDestinationStation(e.target.value)} />
          </label>
          <button type="submit">Get Train Times</button>
        </form>
      </div >
    </>
  )
}

export default App

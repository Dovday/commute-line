import { useEffect, useState } from 'react';
import * as cheerio from 'cheerio';
import axios from 'axios';
import './App.css';
// import Trenitalia from 'api-trenitalia';
// import moment from 'moment';



function App() {
  // const t = new Trenitalia();

  const [originStation, setOriginStation] = useState('');
  const [destinationStation, setDestinationStation] = useState('');

  let $ = [];

  const getStationsId = async () => {
    const response = await axios.get('/monitor', {
      headers: {}
    });
    // Load the HTML into Cheerio
    const html = response.data;

    // Use Cheerio to parse the HTML
    $ = cheerio.load(html);
    // get all options with value attribute
    const $option = $('option[value]');
    console.log('🚂 stations', $option);
  };

  getStationsId();

  // using npm package api-trenitalia
  // not working
  // useEffect(() => {
  //   const getStationsName = async (station) => {
  //     const stations = await t.autocomplete(station);
  //     console.log('🚂 stations', stations);
  //   };

  //   const stations_from = getStationsName(originStation);
  //   console.log('🚂 stations_FROM', stations_from);
  // }, [originStation]);

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

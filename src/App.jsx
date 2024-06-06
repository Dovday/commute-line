import { useEffect, useState } from "react";
import * as cheerio from "cheerio";
import axios from "axios";
import moment from "moment";
import { AutoComplete, Input } from "antd";
import TrainStatus from "./components/TrainStatus";
import "./App.css";

// UTILS - start
const initStation = () => {
  return {
    id: null,
    name: null,
  };
};

const cleanArray = (array) => {
  // remove all new lines and white string in the elements and remove empty elements
  return array.map((el) => el.replace(/\n/g, "").trim());
};
// UTILS - end

const intervals = [];

function App() {
  const [stations, setStations] = useState([]);

  const [inputOrigin, setInputOrigin] = useState("");
  const [inputDestination, setInputDestination] = useState("");

  const [origin, setOrigin] = useState(initStation());
  const [destination, setDestination] = useState(initStation());

  // states for train solutions from origin to destination and viceversa
  const [origin2destination, setOrigin2destination] = useState([]);
  const [destination2origin, setDestination2origin] = useState([]);

  const [areSameStations, setAreSameStations] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(
    moment().format("HH:mm:ss")
  );

  // CHEERIO - start
  const getStationsId = async () => {
    const response = await axios.get("/stations", {
      headers: {},
    });
    // Load the HTML into Cheerio
    const html = response.data;

    // Use Cheerio to parse the HTML
    const $ = cheerio.load(html);
    // get all options with value attribute

    const stations = $("select > option")
      .map((i, el) => {
        return {
          id: $(el).attr("value"),
          name: $(el).text(),
        };
      })
      .toArray();

    setStations(stations);
  };

  const getRFI = async (origin, destination) => {
    const response = await axios.get(`/rfi/${origin.id}`, {
      headers: {},
    });

    // Load the HTML into Cheerio
    const html = response.data;

    // Use Cheerio to parse the HTML
    const $ = cheerio.load(html);
    // get all options with value attribute

    let company = $("td#RVettore > img")
      .map((i, el) => {
        return $(el).attr("alt");
      })
      .toArray();

    let numbers = $("td#RTreno")
      .map((i, el) => {
        return $(el).text();
      })
      .toArray();

      let finalStations = $("td#RStazione > div")
      .map((i, el) => {
        return $(el).text();
      })
      .toArray();

    let plannedTimes = $("td#ROrario")
      .map((i, el) => {
        return $(el).text();
      })
      .toArray();

    let delays = $("td#RRitardo")
      .map((i, el) => {
        return $(el).text();
      })
      .toArray();

    let platforms = $("td#RBinario > div")
      .map((i, el) => {
        return $(el).text();
      })
      .toArray();

    let moreInfo = $("td#RDettagli");

    company = cleanArray(company);
    numbers = cleanArray(numbers);
    finalStations = cleanArray(finalStations);
    plannedTimes = cleanArray(plannedTimes);
    delays = cleanArray(delays);
    platforms = cleanArray(platforms);

    // push each train data like an object to the array
    const trains = [];

    for (let i = 0; i < numbers.length; i++) {
      // print everything of the train
      // console.log(`🚂 ${company[i]} ${numbers[i]} ${plannedTimes[i]} ${delays[i]} ${platforms[i]} ${moreInfo[i]}`);

      if (numbers[i] === "") continue;

      let nextStops = $(moreInfo[i]).find(".FermateSuccessivePopupStyle").find(".testoinfoaggiuntive").first().text().replace(/\n/g, "").trim();

      // push destination name to the array
      nextStops += ('- ' + finalStations[i]);

      // if destination name is composed by more than one word, extract the first one and the last one in two different variables
      const destinationNames = destination.name.split(" ");
      const destinationName = destinationNames[0];

      // if is just one word regex has to verify if '- destination.name (' is in the string
      const regexOneWord = new RegExp(`- ${destination.name} \\(`);
      // if is more than one word regex has to verify if the string starts with '- destinationName' and finishes with 'destinationLastName (' is in the string with everything in the middle
      const regex = new RegExp(`- ${destinationName}`);

      // test on nextStops if the train goes to the destination
      switch (destinationNames.length) {
        case 1:
          if (!regexOneWord.test(nextStops)) continue;
          break;
        default:
          if (!regex.test(nextStops)) continue;
          break;
      }

      // if realTime is after now continue
      if (moment(plannedTimes[i], "HH:mm").diff(moment(), "minutes") < 0)
        continue;

      trains.push({
        cancelled: delays[i] === "Cancellato",
        company: company[i],
        number: numbers[i],
        plannedTime: plannedTimes[i],
        // if train is late, calculate the real time using moment.js
        realTime:
          delays[i] === "0"
            ? plannedTimes[i]
            : moment(plannedTimes[i], "HH:mm")
                .add(delays[i], "minutes")
                .format("HH:mm"),
        delay: delays[i],
        platform: platforms[i],
        nextStops: nextStops,
      });
    }
    return trains;
  };

  getStationsId(); // output: stations
  // CHEERIO - end

  // const getViaggioTrenoSolutions = async (origin, destination) => {
  //   const responseOrigin = await axios.get(`/autocomplete/${origin.name}`);
  //   const responseDestination = await axios.get(`/autocomplete/${destination.name}`);

  //   // split the response by new line
  //   const matchingListOrigin = responseOrigin.data.split('\n').filter((el) => el !== '');
  //   const bestMatchOrigin = matchingListOrigin[0];

  //   const matchingListDestination = responseDestination.data.split('\n').filter((el) => el !== '');
  //   const bestMatchDestination = matchingListDestination[0];

  //   // format of station: <station_name>|S0<code>
  //   const longCodeOrigin = bestMatchOrigin.split('|')[1];
  //   const codeOrigin = longCodeOrigin.slice(2, longCodeOrigin.length);

  //   const longCodeDestination = bestMatchDestination.split('|')[1];
  //   const codeDestination = longCodeDestination.slice(2, longCodeDestination.length);

  //   // print everything
  //   console.log(`🚉 ${origin.name} -> ${bestMatchOrigin} -> ${codeOrigin}`);
  //   console.log(`🚉 ${destination.name} -> ${bestMatchDestination} -> ${codeDestination}`);

  //   // solutions/originCode/destinationCode/YYYY-MM-DDTHH:mm:ss
  //   const response = await axios.get(`/solutions/${codeOrigin}/${codeDestination}/${moment().format('YYYY-MM-DDTHH:mm:ss')}`);
  //   console.log(response.data);

  //   return response.data.vehicles.map((vehicle) => vehicle.numeroTreno);
  // };

  const getTrainSolutions = async () => {
    // console.log(getViaggioTrenoSolutions(origin, destination));
    // getViaggioTrenoSolutions(origin, destination);

    const origin2destination = await getRFI(origin, destination);
    const destination2origin = await getRFI(destination, origin);

    setIsLoading(false);
    // if array has more than five elements, drop the rest
    setOrigin2destination(origin2destination.slice(0, 4));
    setDestination2origin(destination2origin.slice(0, 4));
  };

  // get the origin and destination from the local storage
  useEffect(() => {
    const savedOrigin = localStorage.getItem("origin");
    const savedDestination = localStorage.getItem("destination");

    console.log(`💾 ${savedOrigin}, ${savedDestination}`);

    if (savedOrigin != null) {
      setOrigin(JSON.parse(savedOrigin));
    }

    if (savedDestination != null) {
      setDestination(JSON.parse(savedDestination));
    }
  }, []);

  // setting origin and destination stations based on inputs (adding id)
  useEffect(() => {
    if (!stations.length) return;

    const originStation = stations.find(
      (station) => station.name === inputOrigin
    );

    if (originStation == null) return;

    localStorage.setItem("origin", JSON.stringify(originStation));
    setOrigin(originStation);
  }, [inputOrigin]);

  useEffect(() => {
    if (!stations.length) return;

    const destinationStation = stations.find(
      (station) => station.name === inputDestination
    );

    if (destinationStation == null) return;

    localStorage.setItem("destination", JSON.stringify(destinationStation));
    setDestination(destinationStation);
  }, [inputDestination]);

  // get the train solutions when origin and destination are set
  useEffect(() => {
    if (origin.id == null || destination.id == null) {
      // clear the intervals
      intervals.forEach(clearInterval);

      // clear the arrays
      setOrigin2destination([]);
      setDestination2origin([]);
      return;
    }

    if (origin.id === destination.id) {
      setAreSameStations(true);
      return;
    } else {
      setAreSameStations(false);
    }

    setIsLoading(true);
    getTrainSolutions();

    intervals.push(
      setInterval(() => {
        setLastUpdateTime(moment().format("HH:mm:ss"));
        getTrainSolutions();
      }, 30000)
    );
  }, [origin, destination]);

  return (
    <>
      <div className="contactMe">
        <a href="mailto:dvdcarlomagno@gmail.com">Contact me</a>
      </div>
      <div className="info header">
        {`The page refreshes automatically (updated at: ${lastUpdateTime})`}
      </div>
      <div className="stationContainer">
        <div className="stationHeaderWrapper">
          {
            // if station is set show h2 with name, otherwise show search box
            origin.id != null ? (
              <div className="titleWrapper">
                <h2>{origin.name}</h2>
                <div
                  className="clearButton"
                  onClick={() => {
                    // clear local storage
                    localStorage.removeItem("origin");
                    setOrigin(initStation());
                  }}
                >
                  Clear
                </div>
              </div>
            ) : (
              <AutoComplete
                popupClassName="certain-category-search-dropdown"
                popupMatchSelectWidth={300}
                style={{
                  opacity: 0.75,
                  width: 250,
                }}
                onChange={(value) => setInputOrigin(value)}
                filterOption
                options={stations.map((station) => ({ value: station.name }))}
              >
                <Input.Search
                  size="large"
                  placeholder={
                    origin.id != null ? origin.name : "Origin station"
                  }
                />
              </AutoComplete>
            )
          }
        </div>
        <div className="trainsContainer">
          {areSameStations ? (
            <div className="sameStations">
              <h3>Origin and destination are the same</h3>
            </div>
          ) : origin2destination.length > 0 ? (
            origin2destination.map((train) => (
              <TrainStatus key={train.number} train={train} />
            ))
          ) : isLoading && origin.id != null && destination.id != null ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="noSolutions">
              <h3>No trains were found</h3>
            </div>
          )}
        </div>
      </div>
      <div className="separator" />
      <div className="stationContainer">
        <div className="stationHeaderWrapper">
          {
            // if station is set show h2 with name, otherwise show search box
            destination.id != null ? (
              <div className="titleWrapper">
                <h2>{destination.name}</h2>
                <div
                  className="clearButton"
                  onClick={() => {
                    // clear local storage
                    localStorage.removeItem("destination");
                    setDestination(initStation());
                  }}
                >
                  Clear
                </div>
              </div>
            ) : (
              <AutoComplete
                popupClassName="certain-category-search-dropdown"
                popupMatchSelectWidth={300}
                style={{
                  opacity: 0.75,
                  width: 250,
                }}
                onChange={(value) => setInputDestination(value)}
                filterOption
                options={stations.map((station) => ({ value: station.name }))}
              >
                <Input.Search
                  size="large"
                  placeholder={
                    destination.id != null
                      ? destination.name
                      : "Destination station"
                  }
                />
              </AutoComplete>
            )
          }
        </div>
      <div className="trainsContainer">
        {areSameStations ? (
          <div className="sameStations">
            <h3>Origin and destination are the same</h3>
          </div>
        ) : destination2origin.length > 0 ? (
          destination2origin.map((train) => (
            <TrainStatus key={train.number} train={train} />
          ))
        ) : isLoading && origin.id != null && destination.id != null ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="noSolutions">
            <h3>No trains were found</h3>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default App;

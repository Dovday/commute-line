import React from 'react';
import moment from 'moment';
import './TrainStatus.css';

// based on the missingTime, return the color of the box
const getBoxColor = (missingTime) => {
  if (missingTime === 0) {
    return 'trasparent';
  } else if (missingTime <= 10) {
    return 'red';
  } else if (missingTime <= 20) {
    return 'yellow';
  } else {
    return 'green';
  }
};

// render the missing time in the box
const renderMissingTime = (missingTime) => {
  // if missing time is less than 1h write like 15min otherwise write like 1.5h if it's 1.5 hours
  if (missingTime <= 90) {
    // if < 10 add a leading zero
    missingTime = missingTime < 10 && missingTime >= 0 ? `0${missingTime}'` : `${missingTime}'`;
  } else {
    // convert minutes to decimal hours
    missingTime = `${(missingTime / 60).toFixed(1)}h`;
  }
  return missingTime;
}

const TrainStatus = ({ train }) => {

  let missingTime = moment(train.realTime, 'HH:mm').diff(moment(), 'minutes');

  if (missingTime < 0) return;

  return (
    <div key={train.id} className='trainWrapper'>
      {/* blinking animatino if train is leaving */}
      <div className={`missingTimeBox bg-${getBoxColor(missingTime)}`}>
        {
          missingTime === 0 ?
            // animation for the train that is leaving
            (
              <div className='blinking'>
                <div className='circle st'></div>
                <div className='circle nd'></div>
              </div>
            ) :
            // if train is not leaving, show the missing time
            (
              <>
                <div className='missingMinutes'>{renderMissingTime(missingTime)}</div>
                <div className='realTime'>{train.realTime}</div>
              </>
            )
        }
      </div>
      <div className="textWrapper">
        <div className="platform">
          {`Platform ${train.platform}`}
        </div>
        <div className="trainName">
          {`${train.company} ${train.number}`}
        </div>
      </div>
    </div>
  )
};

export default TrainStatus;

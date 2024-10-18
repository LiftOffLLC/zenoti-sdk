
const Rest = require("./helper/rest");
const _ = require("lodash");
const { extendMoment } = require("moment-range");
const Moment = extendMoment(require('moment'));
const dateTimeFormat = 'YYYY-MM-DDTHH:mm:ss';
const Logger = require("./helper/logger")

class Employees extends Rest {
  /**
   * Get employees available slots
   *
   * @param {Object}
   * @param {String} Object.centerID Center uuid
   * @param {String} Object.date Get availabilities based on this date Ex: 2020-03-27 00:00:00
   * @param {String} Object.userID User/Guest uuid stored in zenoti
   * @param {String} Object.serviceID Zenoti service uuid
   */
  async getAvailabilities({ centerID, date, userID, serviceID }) {
    const params = {
      CenterId: centerID,
      CenterDate: date,
      SlotBookings: [
        {
          GuestId: userID,
          Services: [{ Service: { Id: serviceID } }]
        }
      ]
    };

    const {
      center_hours: centerHours,
      therapist_slots: therapistSlots
    } = await this.post("/v1/appointments/therapist_availability", {}, params);

    const therapists = this._therapistAvailableSchedule(
      therapistSlots,
      centerHours.appointment_interval
    );

    const therapistsWithSlots = _.map(therapists, therapist => {
      therapist.slots = _.reduce(
        therapist.available_times,
        (slots, time) => {
          const chunks = this._intervalChunks(
            time.start_time,
            time.end_time,
            centerHours.appointment_interval
          );
          return _.concat(slots, chunks);
        },
        []
      );
      return therapist;
    });

    return {
      centerHours,
      therapists: therapistsWithSlots
    };
  }
  async getScheduleFiltered({ centerID, serviceID, therapistIds, userID, startDateTime, endDateTime, appointmentDuration }){
    const CenterDate = Moment(startDateTime).format('YYYY-MM-DD');
    const params = {
      CenterId: centerID,
      CenterDate,
      SlotBookings: [
        {
          GuestId: userID,
          Services: [{ Service: { Id: serviceID } }]
        }
      ]
    };

    const {
      center_hours: centerHours,
      therapist_slots: therapistSlots
    } = await this.post("/v1/appointments/therapist_availability", {}, params);

    let therapistFilteredSlots = therapistSlots;
    if (therapistIds) {
      const therapistIdsSet = new Set(therapistIds);
      therapistFilteredSlots = _.filter(therapistFilteredSlots, therapistSlot => therapistIdsSet.has(therapistSlot.Id));
    }
    return (therapistFilteredSlots);
    
  }


  async getBlockOutTimes({ centerId, date }) {
    const blockedOutTimes = await this.get(
      `v1/centers/${centerId}/blockouttimes?start_date=${date}&end_date=${date}`,
    );
    return blockedOutTimes;
  }


  async getAvailabilitiesFiltered({ centerID, serviceID, therapistIds, userID, startDateTime, endDateTime, appointmentDuration, interval}) {

    console.log(`centerID =====>`, centerID);
    console.log(`serviceID =====>`, serviceID);
    console.log(`therapistIds =====>`, therapistIds);
    console.log(`userID =====>`, userID);
    console.log(`startDateTime =====>`, startDateTime);
    console.log(`endDateTime =====>`, endDateTime);
    console.log(`appointmentDuration =====>`, appointmentDuration);
    console.log(`interval =====>`, interval);
    console.log(`1-------------------------------------------------------------`);

    const CenterDate = Moment(startDateTime).format('YYYY-MM-DD');

    console.log(`CenterDate =====>`, CenterDate);
    console.log(`2-------------------------------------------------------------`);


    const params = {
      CenterId: centerID,
      CenterDate,
      SlotBookings: [
        {
          GuestId: userID,
          Services: [{ Service: { Id: serviceID } }]
        }
      ]
    };

    console.log(`params =====>`, params);
    console.log(`JSON.stringify(params) =====>`, JSON.stringify(params));
    console.log(`3-------------------------------------------------------------`);

    const {
      center_hours: centerHours,
      therapist_slots: therapistSlots
    } = await this.post("/v1/appointments/therapist_availability", {}, params);

    console.log(`centerHours =====>`, centerHours);
    console.log(`JSON.stringify(centerHours) =====>`, JSON.stringify(centerHours));
    console.log(`therapistSlots =====>`, therapistSlots);
    console.log(`JSON.stringify(therapistSlots) =====>`, JSON.stringify(therapistSlots));
    console.log(`4-------------------------------------------------------------`);
    
    let therapistFilteredSlots = therapistSlots;
    if (therapistIds) {
      const therapistIdsSet = new Set(therapistIds);
      therapistFilteredSlots = _.filter(therapistFilteredSlots, therapistSlot => therapistIdsSet.has(therapistSlot.Id));
    }

    console.log(`therapistFilteredSlots =====>`, therapistFilteredSlots);
    console.log(`JSON.stringify(therapistFilteredSlots) =====>`, JSON.stringify(therapistFilteredSlots));
    console.log(`5-------------------------------------------------------------`);
    
    const therapists = this._therapistGetAvailableRanges(
      therapistFilteredSlots,
      centerHours, 
      appointmentDuration,
      interval
    );

    console.log(`therapists =====>`, therapists);
    console.log(`JSON.stringify(therapists) =====>`, JSON.stringify(therapists));
    console.log(`6-------------------------------------------------------------`);

    const startDateTimeRounded = this._round(startDateTime, 'ceil', centerHours.appointment_interval);

    console.log(`startDateTimeRounded =====>`, startDateTimeRounded);
    console.log(`7-------------------------------------------------------------`);

    const endDateTimeRounded = this._round(endDateTime, 'floor', centerHours.appointment_interval);

    console.log(`endDateTimeRounded =====>`, endDateTimeRounded);
    console.log(`8-------------------------------------------------------------`);

    const inputRange = Moment.range(Moment(startDateTimeRounded), Moment(endDateTimeRounded));

    console.log(`inputRange =====>`, inputRange);
    console.log(`9-------------------------------------------------------------`);

    _.map(therapists, therapist => {
      const available_times_filtered = [];
      console.log(`therapist =====>`, therapist);
      console.log(`JSON.stringify(therapist) =====>`, JSON.stringify(therapist));
      console.log(`10-------------------------------------------------------------`);
      const availableRanges = therapist.available_times;
      availableRanges.forEach(currentRange => {
        console.log(`currentRange.end =====>`, currentRange.end);
        console.log(`inputRange.start =====>`, inputRange.start);
        console.log(`currentRange.end.isSame(inputRange.start) =====>`, currentRange.end.isSame(inputRange.start));

        if (currentRange.end.isSame(inputRange.start)) {
          available_times_filtered.push({
            start_time: currentRange.end.format(dateTimeFormat),
            end_time: currentRange.end.format(dateTimeFormat),
          });
        } else {
          const intersection = inputRange.intersect(currentRange);
          console.log(`intersection =====>`, intersection);
          if (intersection) {
            available_times_filtered.push({
              start_time: intersection.start.format(dateTimeFormat),
              end_time: intersection.end.format(dateTimeFormat),
            });
            console.log(`intersection.start.format(dateTimeFormat) =====>`, intersection.start.format(dateTimeFormat));
            console.log(`intersection.end.format(dateTimeFormat) =====>`, intersection.end.format(dateTimeFormat));
            console.log(`available_times_filtered =====>`, available_times_filtered);
          }
        }

        console.log(`11-------------------------------------------------------------`);
      });

      console.log(`12-------------------------------------------------------------`);
      therapist.slots = _.reduce(
        available_times_filtered,
        (slots, time) => {
          console.log(`slots =====>`, slots);
          console.log(`time =====>`, time);
          const chunks = this._intervalChunks(
            time.start_time,
            time.end_time,
            centerHours.appointment_interval,
            true
          );
          console.log(`chunks =====>`, chunks);
          console.log(`_.concat(slots, chunks) =====>`, _.concat(slots, chunks));
          console.log(`13-------------------------------------------------------------`);
          return _.concat(slots, chunks);
        },
        []
      );

      console.log(`available_times_filtered =====>`, available_times_filtered);
      console.log(`14-------------------------------------------------------------`);

      therapist.available_times = available_times_filtered;

      return therapist;
    });

    console.log(`centerHours =====>`, centerHours);
    console.log(`therapists =====>`, therapists);
    console.log(`JSON.stringify(centerHours) =====>`, JSON.stringify(centerHours));
    console.log(`JSON.stringify(therapists) =====>`, JSON.stringify(therapists));
    console.log(`15-------------------------------------------------------------`);

    return {
      centerHours, 
      therapists,
    };
  }

  /**
   * Split into time chunks each given minutes
   *
   * @param {String start
   * @param {String} end
   * @param {Number} step
   */
  _intervalChunks(start, end, step) {
    start = Moment(start);
    end = Moment(end);
    const range = Moment.range(start, end);
    return _.map(Array.from(range.by("minutes", { step })), time => {
      return time.format(dateTimeFormat);
    });
  }

  _therapistAvailableSchedule(therapistSlots, appointmentInterval) {
    const therapists = [];
    for (const therapistSlot of therapistSlots) {
      const therapist = {
        id: therapistSlot.Id,
        available_times: []
      };

      if (therapistSlot.unavailable_times.length) {
        for (const unavailableTime of therapistSlot.unavailable_times) {
          if (therapist.available_times.length) {
            if (
              _.last(therapist.available_times).start_time <
              this._subAppointmentInterval(
                unavailableTime.start_time,
                appointmentInterval
              )
            ) {
              therapist.available_times.push({
                start_time: this._formatDate(unavailableTime.end_time),
                end_time: this._formatDate(
                  therapist.available_times[
                    therapist.available_times.length - 1
                  ].end_time
                )
              });
              therapist.available_times[
                therapist.available_times.length - 2
              ].end_time = this._subAppointmentInterval(
                unavailableTime.start_time,
                appointmentInterval
              );
            } else {
              therapist.available_times[
                therapist.available_times.length - 1
              ].start_time = this._formatDate(unavailableTime.end_time);

              therapist.available_times[
                therapist.available_times.length - 2
              ].end_time = this._subAppointmentInterval(
                unavailableTime.start_time,
                appointmentInterval
              );
            }
          } else {
            therapist.available_times.push({
              start_time: this._formatDate(
                therapistSlot.schedule[0].start_time
              ),
              end_time: this._subAppointmentInterval(
                unavailableTime.start_time,
                appointmentInterval
              )
            });
            therapist.available_times.push({
              start_time: this._formatDate(unavailableTime.end_time),
              end_time: this._subAppointmentInterval(
                therapistSlot.schedule[0].end_time,
                appointmentInterval
              )
            });
          }
        }
      } else {
        therapist.available_times.push({
          start_time: therapistSlot.schedule[0].start_time,
          end_time: this._subAppointmentInterval(
            therapistSlot.schedule[0].end_time,
            appointmentInterval
          )
        });
      }

      therapists.push(therapist);
    }

    return therapists;
  }

  _ceilTime(dateTime,interval,format){
    if(typeof(dateTime)==='string'){
      dateTime = Moment(dateTime);
    }
    const minuteDiff = (dateTime.minutes() % interval);
    if(!minuteDiff){
      if(format){
        return dateTime.format(format);
      }
      return dateTime;
    }
    const remainder = interval - minuteDiff
    const ceiledDateTime =dateTime.add(remainder,'minutes')
    if(format){
      return ceiledDateTime.format(format);
    }
    return ceiledDateTime;

  }
  _therapistGetAvailableRanges(therapistSlots, centerHours, appointmentDuration, interval) {
    const therapists = [];
    therapistSlots.forEach(therapistSlot => {
      let availableRanges = [];
      const therapistSchedule = therapistSlot.schedule;
      therapistSchedule.forEach(schedule => {
        const centerRange = Moment.range(centerHours.start_time, centerHours.end_time);
        const therapistRange = Moment.range(schedule.start_time, schedule.end_time);
        const intersection = centerRange.intersect(therapistRange);
        if (intersection) {
          availableRanges.push(intersection);
        }
      });
      if(interval){
      for (const unavailableTime of therapistSlot.unavailable_times){
          unavailableTime.end_time = this._ceilTime(unavailableTime.end_time,interval,'YYYY-MM-DDTHH:mm:ss');
      }}
      for (const availableRange of availableRanges){
        availableRange.start = this._ceilTime(availableRange.start.format('YYYY-MM-DDTHH:mm:ss'),interval);
      };
      const unavailableRanges = therapistSlot.unavailable_times.map(unavailableRange => Moment.range(unavailableRange.start_time, unavailableRange.end_time));
      let tmpAvailableRanges;
      unavailableRanges.forEach(unavailableRange => {
        tmpAvailableRanges = [];
        let overlapFound = false;
        availableRanges.forEach(availableRange => {
          if (!overlapFound && availableRange.overlaps(unavailableRange)) {
            overlapFound = true;
            const subtraction = availableRange.subtract(unavailableRange);
            subtraction.forEach(range => {
              if (range.duration('minutes') >= appointmentDuration) {
                tmpAvailableRanges.push(range);
              }
            });
          } else {
            tmpAvailableRanges.push(availableRange);
          }
        });
        availableRanges = tmpAvailableRanges;
      });
      availableRanges.forEach(availableRange => {
        availableRange.end.subtract(appointmentDuration, 'minutes');
      });
      const therapist = {
        id: therapistSlot.Id,
        available_times: availableRanges,
      };
      therapists.push(therapist);
    });
    return therapists;
  }

  _subAppointmentInterval(endTime, apptInterval) {
    var newEndDateTime = new Date(endTime);
    newEndDateTime.setMinutes(newEndDateTime.getMinutes() - apptInterval);
    return Moment(newEndDateTime).format(dateTimeFormat);
  }
  _formatDate(DateTime) {
    var newEndDateTime = new Date(DateTime);
    return Moment(newEndDateTime).format(dateTimeFormat);
  }
  _round(date, method, duration) {
    const momentDate = Moment(date);
    const momentDuration = Moment.duration(duration, 'minutes');
    return Moment(Math[method]((+momentDate) / (+momentDuration)) * (+momentDuration)).format(dateTimeFormat); 
  }
}

module.exports = Employees;

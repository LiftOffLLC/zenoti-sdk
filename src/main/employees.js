const Rest = require("./helper/rest");
const _ = require("lodash");
const { extendMoment } = require("moment-range");
const Moment = extendMoment(require('moment-timezone'));

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

  async getAvailabilitiesFiltered({ centerID, serviceID, userID, startDateTime, 
    endDateTime, therapistIds, timezone = 'America/Los_Angeles' }) {
    const CenterDate = Moment.tz(startDateTime, timezone).format('YYYY-MM-DD');
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
    
    const startDateTimeRounded = this._round(startDateTime, 'ceil', centerHours.appointment_interval);
    const endDateTimeRounded = this._round(endDateTime, 'floor', centerHours.appointment_interval);
    const therapistIdsSet = new Set(therapistIds);
    const therapistFilteredSlots = _.filter(therapistSlots, therapistSlot => therapistIdsSet.has(therapistSlot.Id));
    
    const therapists = this._therapistAvailableSchedule(
      therapistFilteredSlots,
      centerHours.appointment_interval
    );

    const inputRange = Moment.range(Moment.tz(startDateTimeRounded, timezone), Moment.tz(endDateTimeRounded, timezone));
    _.map(therapists, therapist => {
      const available_times_filtered = [];
      for (let i = 0; i < therapist.available_times.length; i++) {
        const time = therapist.available_times[i];
        let start_time = Moment.tz(time.start_time, timezone);
        let end_time = Moment.tz(time.end_time, timezone);
        const currentRange = Moment.range(Moment(start_time), Moment(end_time));
        const intersection = inputRange.intersect(currentRange);
        if (intersection) {
          available_times_filtered.push({
            start_time: intersection.start.toISOString(),
            end_time: intersection.end.toISOString(),
          });
        }
      }

      therapist.slots = _.reduce(
        available_times_filtered,
        (slots, time) => {
          const chunks = this._intervalChunksISO(
            time.start_time,
            time.end_time,
            centerHours.appointment_interval,
            true
          );
          return _.concat(slots, chunks);
        },
        []
      );

      therapist.available_times = available_times_filtered;

      return therapist;
    });

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
      return time.format("YYYY-MM-DDTHH:mm:ss");
    });
  }

  _intervalChunksISO(start, end, step) {
    start = Moment(start);
    end = Moment(end);
    const range = Moment.range(start, end);
    return _.map(Array.from(range.by("minutes", { step })), time => {
      return time.toISOString();
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

  _subAppointmentInterval(endTime, apptInterval) {
    var newEndDateTime = new Date(endTime);
    newEndDateTime.setMinutes(newEndDateTime.getMinutes() - apptInterval);
    return Moment(newEndDateTime).format("YYYY-MM-DDTHH:mm:ss");
  }
  _formatDate(DateTime) {
    var newEndDateTime = new Date(DateTime);
    return Moment(newEndDateTime).format("YYYY-MM-DDTHH:mm:ss");
  }
  _round(date, method, duration) {
    const momentDate = Moment(date);
    const momentDuration = Moment.duration(duration, 'minutes');
    return Moment(Math[method]((+momentDate) / (+momentDuration)) * (+momentDuration)).toISOString(); 
  }
}

module.exports = Employees;

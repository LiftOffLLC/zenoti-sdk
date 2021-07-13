const Rest = require("./helper/rest");
const _ = require("lodash");
const { extendMoment } = require("moment-range");
const Moment = extendMoment(require("moment"));
const dateTimeFormat = "YYYY-MM-DDTHH:mm:ss";

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
          Services: [{ Service: { Id: serviceID } }],
        },
      ],
    };

    const { center_hours: centerHours, therapist_slots: therapistSlots } =
      await this.post("/v1/appointments/therapist_availability", {}, params);

    const therapists = this._therapistAvailableSchedule(
      therapistSlots,
      centerHours.appointment_interval
    );

    const therapistsWithSlots = _.map(therapists, (therapist) => {
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
      therapists: therapistsWithSlots,
    };
  }
  async getScheduleFiltered({
    centerID,
    serviceID,
    therapistIds,
    userID,
    startDateTime,
    endDateTime,
    appointmentDuration,
  }) {
    const CenterDate = Moment(startDateTime).format("YYYY-MM-DD");
    const params = {
      CenterId: centerID,
      CenterDate,
      SlotBookings: [
        {
          GuestId: userID,
          Services: [{ Service: { Id: serviceID } }],
        },
      ],
    };

    const { center_hours: centerHours, therapist_slots: therapistSlots } =
      await this.post("/v1/appointments/therapist_availability", {}, params);

    let therapistFilteredSlots = therapistSlots;
    if (therapistIds) {
      const therapistIdsSet = new Set(therapistIds);
      therapistFilteredSlots = _.filter(
        therapistFilteredSlots,
        (therapistSlot) => therapistIdsSet.has(therapistSlot.Id)
      );
    }
    return therapistFilteredSlots;
  }

  async getAvailabilitiesFiltered({
    centerID,
    serviceID,
    therapistIds,
    userID,
    startDateTime,
    endDateTime,
    appointmentDuration,
  }) {
    const CenterDate = Moment(startDateTime).format("YYYY-MM-DD");
    const params = {
      CenterId: centerID,
      CenterDate,
      SlotBookings: [
        {
          GuestId: userID,
          Services: [{ Service: { Id: serviceID } }],
        },
      ],
    };

    const { center_hours: centerHours, therapist_slots: therapistSlots } =
      await this.post("/v1/appointments/therapist_availability", {}, params);

    let therapistFilteredSlots = therapistSlots;
    if (therapistIds) {
      const therapistIdsSet = new Set(therapistIds);
      therapistFilteredSlots = _.filter(
        therapistFilteredSlots,
        (therapistSlot) => therapistIdsSet.has(therapistSlot.Id)
      );
    }

    const therapists = this._therapistGetAvailableRanges(
      therapistFilteredSlots,
      centerHours,
      appointmentDuration
    );

    const startDateTimeRounded = this._round(
      startDateTime,
      "ceil",
      centerHours.appointment_interval
    );
    const endDateTimeRounded = this._round(
      endDateTime,
      "floor",
      centerHours.appointment_interval
    );
    const inputRange = Moment.range(
      Moment(startDateTimeRounded),
      Moment(endDateTimeRounded)
    );
    _.map(therapists, (therapist) => {
      const available_times_filtered = [];
      const availableRanges = therapist.available_times;
      availableRanges.forEach((currentRange) => {
        const intersection = inputRange.intersect(currentRange);
        if (intersection) {
          available_times_filtered.push({
            start_time: intersection.start.format(dateTimeFormat),
            end_time: intersection.end.format(dateTimeFormat),
          });
        }
      });

      therapist.slots = _.reduce(
        available_times_filtered,
        (slots, time) => {
          const chunks = this._intervalChunks(
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
    return _.map(Array.from(range.by("minutes", { step })), (time) => {
      return time.format(dateTimeFormat);
    });
  }

  _therapistAvailableSchedule(therapistSlots, appointmentInterval) {
    const therapists = [];
    for (const therapistSlot of therapistSlots) {
      const therapist = {
        id: therapistSlot.Id,
        available_times: [],
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
                ),
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
              ),
            });
            therapist.available_times.push({
              start_time: this._formatDate(unavailableTime.end_time),
              end_time: this._subAppointmentInterval(
                therapistSlot.schedule[0].end_time,
                appointmentInterval
              ),
            });
          }
        }
      } else {
        therapist.available_times.push({
          start_time: therapistSlot.schedule[0].start_time,
          end_time: this._subAppointmentInterval(
            therapistSlot.schedule[0].end_time,
            appointmentInterval
          ),
        });
      }

      therapists.push(therapist);
    }

    return therapists;
  }

  _therapistGetAvailableRanges(
    therapistSlots,
    centerHours,
    appointmentDuration
  ) {
    const therapists = [];
    therapistSlots.forEach((therapistSlot) => {
      let availableRanges = [];
      const therapistSchedule = therapistSlot.schedule;
      therapistSchedule.forEach((schedule) => {
        const centerRange = Moment.range(
          centerHours.start_time,
          centerHours.end_time
        );
        const therapistRange = Moment.range(
          schedule.start_time,
          schedule.end_time
        );
        const intersection = centerRange.intersect(therapistRange);
        if (intersection) {
          availableRanges.push(intersection);
        }
      });
      const unavailableRanges = therapistSlot.unavailable_times.map(
        (unavailableRange) =>
          Moment.range(unavailableRange.start_time, unavailableRange.end_time)
      );
      let tmpAvailableRanges;
      unavailableRanges.forEach((unavailableRange) => {
        tmpAvailableRanges = [];
        let overlapFound = false;
        availableRanges.forEach((availableRange) => {
          if (!overlapFound && availableRange.overlaps(unavailableRange)) {
            overlapFound = true;
            const subtraction = availableRange.subtract(unavailableRange);
            subtraction.forEach((range) => {
              if (range.duration("minutes") >= appointmentDuration) {
                tmpAvailableRanges.push(range);
              }
            });
          } else {
            tmpAvailableRanges.push(availableRange);
          }
        });
        availableRanges = tmpAvailableRanges;
      });
      availableRanges.forEach((availableRange) => {
        availableRange.end.subtract(appointmentDuration, "minutes");
        availableRange.end.add(1, "minutes");
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
    const momentDuration = Moment.duration(duration, "minutes");
    return Moment(
      Math[method](+momentDate / +momentDuration) * +momentDuration
    ).format(dateTimeFormat);
  }
}

module.exports = Employees;

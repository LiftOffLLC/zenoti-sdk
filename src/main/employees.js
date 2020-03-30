const Rest = require("./helper/rest");

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

    const response = await this.post(
      "/v1/appointments/therapist_availability",
      {},
      params
    );
    return this._therapistAvailableSchedule(response);
  }

  _therapistAvailableSchedule(Response) {
    if (
      Response &&
      Response.therapist_slots &&
      Response.therapist_slots.length > 0
    ) {
      Response.therapist_slots.forEach((therapist, therapistindex) => {
        if (
          therapist.unavailable_times &&
          therapist.unavailable_times.length > 0
        ) {
          if (therapist.schedule && therapist.schedule.length == 1) {
            therapist.unavailable_times.forEach(unavailabletimes => {
              if (
                Response.therapist_slots[therapistindex].available_times &&
                Response.therapist_slots[therapistindex].available_times
                  .length > 0
              ) {
                if (
                  Response.therapist_slots[therapistindex].available_times[
                    Response.therapist_slots[therapistindex].available_times
                      .length - 1
                  ].start_time <
                  this._subAppointmentInterval(
                    unavailabletimes.start_time,
                    Response.center_hours.appointment_interval
                  )
                ) {
                  Response.therapist_slots[therapistindex].available_times.push(
                    {
                      start_time: this._formatDate(unavailabletimes.end_time),
                      end_time: this._formatDate(
                        Response.therapist_slots[therapistindex]
                          .available_times[
                          Response.therapist_slots[therapistindex]
                            .available_times.length - 1
                        ].end_time
                      )
                    }
                  );
                  Response.therapist_slots[therapistindex].available_times[
                    Response.therapist_slots[therapistindex].available_times
                      .length - 2
                  ].end_time = this._subAppointmentInterval(
                    unavailabletimes.start_time,
                    Response.center_hours.appointment_interval
                  );
                } else {
                  Response.therapist_slots[therapistindex].available_times[
                    Response.therapist_slots[therapistindex].available_times
                      .length - 1
                  ].start_time = this._formatDate(unavailabletimes.end_time);
                  Response.therapist_slots[therapistindex].available_times[
                    Response.therapist_slots[therapistindex].available_times
                      .length - 2
                  ].end_time = this._subAppointmentInterval(
                    unavailabletimes.start_time,
                    Response.center_hours.appointment_interval
                  );
                }
              } else {
                Response.therapist_slots[therapistindex].available_times = [
                  {
                    start_time: this._formatDate(
                      Response.therapist_slots[therapistindex].schedule[0]
                        .start_time
                    ),
                    end_time: this._formatDate(
                      Response.therapist_slots[therapistindex].schedule[0]
                        .end_time
                    )
                  }
                ];
                Response.therapist_slots[therapistindex].available_times.push({
                  start_time: this._formatDate(
                    Response.therapist_slots[therapistindex].schedule[0]
                      .start_time
                  ),
                  end_time: this._formatDate(
                    Response.therapist_slots[therapistindex].schedule[0]
                      .end_time
                  )
                });
                Response.therapist_slots[
                  therapistindex
                ].available_times[0].end_time = this._subAppointmentInterval(
                  unavailabletimes.start_time,
                  Response.center_hours.appointment_interval
                );
                Response.therapist_slots[
                  therapistindex
                ].available_times[1].start_time = this._formatDate(
                  unavailabletimes.end_time
                );
                Response.therapist_slots[
                  therapistindex
                ].available_times[1].end_time = this._subAppointmentInterval(
                  Response.therapist_slots[therapistindex].schedule[0].end_time,
                  Response.center_hours.appointment_interval
                );
              }
            });
          } else {
          }
        } else {
          Response.therapist_slots[therapistindex].available_times =
            Response.therapist_slots[therapistindex].schedule;

          Response.therapist_slots[
            therapistindex
          ].available_times[0].end_time = this._subAppointmentInterval(
            Response.therapist_slots[therapistindex].available_times[0]
              .end_time,
            Response.center_hours.appointment_interval
          );
        }
      });
      return Response;
    }
  }

  _subAppointmentInterval(endTime, apptInterval) {
    var newEndDateTime = new Date(endTime);
    newEndDateTime.setMinutes(newEndDateTime.getMinutes() - apptInterval);
    return newEndDateTime.toString("yyyy-MM-dd HH:mm:ss");
  }
  _formatDate(DateTime) {
    var newEndDateTime = new Date(DateTime);
    return newEndDateTime.toString("yyyy-MM-dd HH:mm:ss");
  }
}

module.exports = Employees;

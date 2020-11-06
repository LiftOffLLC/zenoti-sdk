require("dotenv").config();
const ZenotiClient = require("../src/main");

const options = {
  handler: async (request, _h) => {
    const client = new ZenotiClient();
    const centerId = "aad7b465-3d5c-4421-be94-7ba021ee917d";
    // eslint-disable-next-line no-await-in-loop
    let x = [];
    let page = 1;
    let response;
    do {
      response = await client.guests.get(
        `/v1/guests?center_id=${centerId}&size=100&page=${page}`
      );
      x = x.concat(response.guests);
      page++;
    } while (response.guests.length);
    // console.dir(guests, { depth: null });
    console.log(`${x.length} total guests`);
      const m = ["EMP01", "EMP02", "MGR01", "THP01", "THP02"];
    const yy = x.filter((e) => !m.includes(e.code));
    // const y = yy.filter(e=>(e.code))
    const z = yy.filter((m) => !/.*\d{13}/.test(m.personal_info.email));
    if (!z.length) {
      console.log("No guests without disabled emails!");
    } else {
      console.log(`${z.length} guests without disabled emails:`);
      for (const user of z) {
        const u = (({ id, code, personal_info: {first_name, last_name, email} }) => ({ id, code, first_name, last_name, email }))(user);
        console.log(u);
        if (user.code === "OH-S-2" || user.code === "OH-S-4" || user.code === "OH-S-6") {
          const emailWithTimestamp = user.personal_info.email + Date.now();
          const ohDisabledId = user.code
            ? `D-${user.code}-${Date.now()}`
            : `D-${Date.now()}`;
          const response = await client.guests.updateGuest(user.id, {
            code: ohDisabledId,
            center_id: centerId,
            personal_info: {
              first_name: user.personal_info.first_name,
              last_name: user.personal_info.last_name,
              mobile_phone: {
                country_code: user.personal_info.mobile_phone.country_code,
                number: user.personal_info.mobile_phone.number,
              },
              email: emailWithTimestamp,
            },
          });
          console.log(response);
        }
      }
    }
  },
};

(async () => {
  try {
    await options.handler();
  } catch (err) {
    console.error(err);
  }
})();

import { createPromise } from "../helpers/promise";

export const testAllEventRoutes = async (
  ticketServiceTest: (data: Object) => any
) => {
  const [resolve, reject, promise] = createPromise();

  try {
    const postData = {
      method: "post",
      path: "event",
      data: {
        name: "Evento legal",
        type: "show",
        local: "barramas",
        ticketPrice: 45.6,
        ticketQuantity: 100,
        date: "34-23-6543",
      },
    };

    const created = await ticketServiceTest(postData);

    if (created.status === "success") {
      console.log("[EVENT | POST]: PASSED");
    } else {
        console.log(created);
        
      reject("[EVENT | POST]: ERROR");
      return;
    }

    const getAllData = {
      method: "getAll",
      path: "event",
      data: {},
    };

    const gotAll = await ticketServiceTest(getAllData);

    if (gotAll.status === "success") {
      console.log("[EVENT | GET ALL]: PASSED");
    } else {
      reject("[EVENT | GET ALL]: ERROR");
      return;
    }

    const id = gotAll.data[0].id;

    const getData = {
      method: "get",
      path: "event",
      data: {
        id: id,
      },
    };

    const gotOne = await ticketServiceTest(getData);

    if (gotOne.status === "success") {
      console.log("[EVENT | GET ONE]: PASSED");
    } else {
      reject("[EVENT | GET ONE]: ERROR");
      return;
    }

    const updateData = {
      method: "update",
      path: "event",
      data: {
        id: id,
        name: "Evento mais ou menos",
        type: "show",
        local: "barramas",
        ticketPrice: 45.6,
        ticketQuantity: 100,
        date: "34-23-6543",
      },
    };

    try {
      const updated = await ticketServiceTest(updateData);
      if (updated.status === "success") {
        console.log("[EVENT | UPDATE]: PASSED");
      } else {
        console.log("[EVENT | UPDATE]: DID NOT PASS: ", updated);
      }
    } catch (error) {
      reject(error);
    }

    const deleteData = {
      method: "delete",
      path: "event",
      data: {
        id: id,
      },
    };

    const deleted = await ticketServiceTest(deleteData);

    if (deleted.status === "success") {
      console.log("[EVENT | DELETE]: PASSED");
    } else {
      reject("[EVENT | DELETE ]: ERROR");
      return;
    }
  } catch (error) {
    reject(error);
  }

  resolve("success");

  return promise;
};

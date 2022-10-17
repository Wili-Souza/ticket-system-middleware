import { createPromise } from "../helpers/promise";

export const testAllOrderRoutes = async (
  ticketServiceTest: (data: Object) => any
) => {
  const [resolve, reject, promise] = createPromise();

  try {
    const createdEvent = await ticketServiceTest({
      method: "post",
      path: "event",
      data: {
        name: "Evento teste",
        type: "para order teste",
        local: "teste",
        ticketPrice: 15.6,
        ticketQuantity: 100,
        date: "21-10-1543",
      },
    });

    const eventId = createdEvent.data?.id;

    if (!eventId) {
      reject("[ORDER | POST]: There is no event to generate a new order");
      return;
    }

    const postData = {
      method: "post",
      path: "order",
      data: {
        name: "Evento legal",
        cpf: "34534508345",
        quantity: 2,
        eventId: eventId,
      },
    };

    const created = await ticketServiceTest(postData);

    if (created.status === "success") {
      console.log("[ORDER | POST]: PASSED");
    } else {
      reject("[ORDER | POST]: ERROR");
      return;
    }

    const getAllData = {
      method: "getAll",
      path: "order",
      data: {},
    };

    const gotAll = await ticketServiceTest(getAllData);

    if (gotAll.status === "success") {
      console.log("[ORDER | GET ALL]: PASSED");
    } else {
      reject("[ORDER | GET ALL]: ERROR");
      return;
    }

    const id = gotAll.data[0].id;

    const getData = {
      method: "get",
      path: "order",
      data: {
        id: id,
      },
    };

    const gotOne = await ticketServiceTest(getData);

    if (gotOne.status === "success") {
      console.log("[ORDER | GET ONE]: PASSED");
    } else {
      reject("[ORDER | GET ONE]: ERROR");
      return;
    }

    const updateData = {
      method: "update",
      path: "order",
      data: {
        id: id,
        name: "Jose da silva",
        cpf: "34534508345",
        quantity: 3,
        eventId: eventId,
      },
    };

    const updated = await ticketServiceTest(updateData);

    if (updated.status === "success") {
      console.log("[ORDER | UPDATE]: PASSED");
    } else {
      reject("[ORDER | UPDATE ]: ERROR");
      return;
    }

    const deleteData = {
      method: "delete",
      path: "order",
      data: {
        id: id,
      },
    };

    const deleted = await ticketServiceTest(deleteData);

    if (deleted.status === "success") {
      console.log("[ORDER | DELETE]: PASSED");
    } else {
      reject("[ORDER | DELETE ]: ERROR");
      return;
    }
  } catch (error) {
    reject(error);
  }

  resolve("success");
  return promise;
};

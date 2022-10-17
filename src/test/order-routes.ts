import { createPromise } from "../helpers/promise";

const METHODS = (eventId: string = "test") => [
  {
    method: "post",
    path: "order",
    data: {
      name: "Evento legal",
      cpf: "34534508345",
      quantity: 2,
      eventId: eventId,
    },
  },
  {
    method: "getAll",
    path: "order",
    data: {},
  },
];

const DEPENDENCY_METHODS = (id: string = "test") => [
  {
    method: "get",
    path: "order",
    data: {
      id: id,
    },
  },
  {
    method: "update",
    path: "order",
    data: {
      id: id,
      name: "Jose da silva",
      cpf: "34534508345",
      quantity: 3,
      eventId: id,
    },
  },
  {
    method: "delete",
    path: "order",
    data: {
      id: id,
    },
  },
];

const TEST_EVENT_DATA = {
  method: "post",
  path: "event",
  data: {
    id: "test",
    name: "test",
    type: "test",
    local: "test",
    ticketPrice: 1,
    ticketQuantity: 2,
    date: "test",
  },
};

const validate = (result: any, method: string): boolean => {
  if (result.status !== "success") {
    console.log(`--- [${method} Order]: error`);
    return false;
  }
  console.log(`--- [${method} Order]: passed`);
  return true;
};

export const testAllOrderRoutes = async (
  ticketServiceTest: (data: Object) => any
) => {
  const [resolve, reject, promise] = createPromise();
  const eventPostResult = await ticketServiceTest(TEST_EVENT_DATA);
  console.log(eventPostResult);

  const allMethods = [
    ...METHODS(eventPostResult.data.id),
    ...DEPENDENCY_METHODS(),
  ];

  allMethods.forEach(async (data, index) => {
    const result = await ticketServiceTest(data);
    const method = data.method.toUpperCase();
    const valid = validate(result, method);
    if (!valid) {
      reject(result);
    }
    if (index + 1 === allMethods.length) {
      resolve("success");
    }
  });

  return promise;
};

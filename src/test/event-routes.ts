import { createPromise } from "../helpers/promise";

const METHODS = [
  {
    method: "post",
    path: "event",
    data: {
      name: "Evento legal",
      type: "show",
      local: "barramas",
      ticketPrice: 0,
      ticketQuantity: 0,
      date: "34-23-6543",
    },
  },
  {
    method: "getAll",
    path: "event",
    data: {},
  },
];

const DEPENDENCY_METHODS = (id: string = "test") => [
  {
    method: "get",
    path: "event",
    data: {
      id: id,
    },
  },
  {
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
  },
  {
    method: "delete",
    path: "event",
    data: {
      id: id,
    },
  },
];

const validate = (result: any, method: string): boolean => {
  if (result.status !== "success") {
    console.log(`--- [${method} Event]: error`);
    return false;
  }
  console.log(`--- [${method} Event]: passed`);
  return true;
};

export const testAllEventRoutes = async (
  ticketServiceTest: (data: Object) => any
) => {
  const [resolve, reject, promise] = createPromise();
  const allMethods = [...METHODS, ...DEPENDENCY_METHODS()];

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

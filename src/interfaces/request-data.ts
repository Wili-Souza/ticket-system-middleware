export interface RequestData {
    method: "post" | "delete" | "get" | "update",  // TODO: get by id or get all?
    body?: Object
}
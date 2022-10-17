export interface RequestData {
    method: "post" | "delete" | "get" | "getAll" | "update",  
    body?: Object
}